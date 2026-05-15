import type { Express } from "express";
import { storage } from "../storage";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import {
  insertHostelRoomSchema,
  insertHostelResidentSchema,
  insertHostelFeeSchema,
} from "@shared/schema";
import {
  checkHostelRoomReferences,
  checkHostelResidentReferences,
} from "../validation";

export function registerHostelRoutes(app: Express) {
  app.get("/api/hostel-rooms", asyncHandler(async (req, res) => {
    const rooms = filterByBranch(await storage.getHostelRooms(), getBranchId(req));
    res.json(rooms);
  }));

  app.get("/api/hostel-rooms/:id", asyncHandler(async (req, res) => {
    const room = await storage.getHostelRoom(req.params.id);
    if (!room || !verifyBranch(room, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(room);
  }));

  app.post("/api/hostel-rooms", asyncHandler(async (req, res) => {
    const parsed = insertHostelRoomSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const room = await storage.createHostelRoom({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(room);
  }));

  app.patch("/api/hostel-rooms/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelRoom(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertHostelRoomSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const room = await storage.updateHostelRoom(req.params.id, parsed.data);
    if (!room) return res.status(404).json({ error: "Not found" });
    res.json(room);
  }));

  app.delete("/api/hostel-rooms/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelRoom(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkHostelRoomReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteHostelRoom(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/hostel-residents", asyncHandler(async (req, res) => {
    const residents = filterByBranch(await storage.getHostelResidents(), getBranchId(req));
    res.json(residents);
  }));

  app.get("/api/hostel-residents/:id", asyncHandler(async (req, res) => {
    const resident = await storage.getHostelResident(req.params.id);
    if (!resident || !verifyBranch(resident, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(resident);
  }));

  app.post("/api/hostel-residents", asyncHandler(async (req, res) => {
    const parsed = insertHostelResidentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const resident = await storage.createHostelResident({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    try {
      const room = await storage.getHostelRoom(String(parsed.data.roomId));
      if (room) {
        const newOccupied = (room.occupiedBeds || 0) + 1;
        const newStatus = newOccupied >= room.bedCount ? "Full" : "Available";
        await storage.updateHostelRoom(String(room.id), { occupiedBeds: newOccupied, status: newStatus });
      }
    } catch (e) {
      console.warn("[Hostel] Failed to update room occupancy on check-in:", e);
    }
    res.status(201).json(resident);
  }));

  app.patch("/api/hostel-residents/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelResident(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertHostelResidentSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const resident = await storage.updateHostelResident(req.params.id, parsed.data);
    if (!resident) return res.status(404).json({ error: "Not found" });
    try {
      if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
        const wasActive = existing.status === "Active";
        const isNowActive = parsed.data.status === "Active";
        if (wasActive && !isNowActive) {
          const room = await storage.getHostelRoom(String(existing.roomId));
          if (room) {
            const newOccupied = Math.max(0, (room.occupiedBeds || 1) - 1);
            await storage.updateHostelRoom(String(room.id), { occupiedBeds: newOccupied, status: newOccupied < room.bedCount ? "Available" : "Full" });
          }
        } else if (!wasActive && isNowActive) {
          const room = await storage.getHostelRoom(String(existing.roomId));
          if (room) {
            const newOccupied = (room.occupiedBeds || 0) + 1;
            await storage.updateHostelRoom(String(room.id), { occupiedBeds: newOccupied, status: newOccupied >= room.bedCount ? "Full" : "Available" });
          }
        }
      }
    } catch (e) {
      console.warn("[Hostel] Failed to update room occupancy on resident status change:", e);
    }
    res.json(resident);
  }));

  app.delete("/api/hostel-residents/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelResident(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkHostelResidentReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteHostelResident(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    if (existing.status === "Active") {
      try {
        const room = await storage.getHostelRoom(String(existing.roomId));
        if (room) {
          const newOccupied = Math.max(0, (room.occupiedBeds || 1) - 1);
          await storage.updateHostelRoom(String(room.id), { occupiedBeds: newOccupied, status: newOccupied < room.bedCount ? "Available" : "Full" });
        }
      } catch (e) {
        console.warn("[Hostel] Failed to update room occupancy on resident deletion:", e);
      }
    }
    res.json({ success: true });
  }));

  app.get("/api/hostel-fees", asyncHandler(async (req, res) => {
    const fees = filterByBranch(await storage.getHostelFees(), getBranchId(req));
    res.json(fees);
  }));

  app.get("/api/hostel-fees/:id", asyncHandler(async (req, res) => {
    const fee = await storage.getHostelFee(req.params.id);
    if (!fee || !verifyBranch(fee, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(fee);
  }));

  app.post("/api/hostel-fees", asyncHandler(async (req, res) => {
    const parsed = insertHostelFeeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const fee = await storage.createHostelFee({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(fee);
  }));

  app.patch("/api/hostel-fees/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelFee(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertHostelFeeSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const fee = await storage.updateHostelFee(req.params.id, parsed.data);
    if (!fee) return res.status(404).json({ error: "Not found" });
    let warning: string | undefined;
    if (existing.status !== "Paid" && fee.status === "Paid" && fee.amount > 0) {
      try {
        await (storage as any).createAutoPostedVoucher({
          type: "Receipt",
          date: fee.paidDate || new Date().toISOString().split("T")[0],
          debitAccountCode: "1001",
          creditAccountCode: "4004",
          amount: fee.amount,
          narration: `Hostel Fee — ${fee.month} — ${fee.studentName}`,
          reference: String(fee.id),
          referenceType: "HostelFeePayment",
          createdBy: (req as any).user?.email || "system",
          branchId: getBranchId(req),
          sourceModule: "hostel",
        });
      } catch (voucherErr) {
        console.error("Hostel Finance voucher posting failed:", voucherErr);
        warning = `Fee updated but Finance voucher could not be posted: ${(voucherErr as Error).message}`;
      }
    }
    res.json(warning ? { ...fee, warning } : fee);
  }));

  app.delete("/api/hostel-fees/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getHostelFee(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteHostelFee(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
