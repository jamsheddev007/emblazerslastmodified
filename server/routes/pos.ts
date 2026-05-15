import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import { insertPosItemSchema, insertSaleSchema, posItemsTable, salesTable } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export function registerPosRoutes(app: Express) {
  app.get("/api/pos-items", asyncHandler(async (req, res) => {
    const items = filterByBranch(await storage.getPosItems(), getBranchId(req));
    res.json(items);
  }));

  app.get("/api/pos-items/:id", asyncHandler(async (req, res) => {
    const item = await storage.getPosItem(req.params.id);
    if (!item || !verifyBranch(item, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(item);
  }));

  app.post("/api/pos-items", asyncHandler(async (req, res) => {
    const parsed = insertPosItemSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const item = await storage.createPosItem({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(item);
  }));

  app.patch("/api/pos-items/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getPosItem(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertPosItemSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const item = await storage.updatePosItem(req.params.id, parsed.data);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  }));

  app.delete("/api/pos-items/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getPosItem(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deletePosItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/sales", asyncHandler(async (req, res) => {
    const sales = filterByBranch(await storage.getSales(), getBranchId(req));
    res.json(sales);
  }));

  app.get("/api/sales/:id", asyncHandler(async (req, res) => {
    const sale = await storage.getSale(req.params.id);
    if (!sale || !verifyBranch(sale, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(sale);
  }));

  app.post("/api/sales", asyncHandler(async (req, res) => {
    const parsed = insertSaleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const branchId = getBranchId(req);
    const schoolId = getSchoolId(req);
    const sale = await storage.createSale({ ...parsed.data, branchId, schoolId });

    if (parsed.data.items && Array.isArray(parsed.data.items)) {
      for (const item of parsed.data.items as any[]) {
        if (item.itemId && item.quantity) {
          try {
            const [existing] = await db.select().from(posItemsTable).where(and(eq(posItemsTable.id, item.itemId), eq(posItemsTable.branchId, branchId)));
            if (existing) {
              const newStock = Math.max(0, (existing.stock || 0) - item.quantity);
              await db.update(posItemsTable).set({ stock: newStock }).where(eq(posItemsTable.id, item.itemId));
            }
          } catch (e) {
            console.warn("[POS] Failed to update stock for item", item.itemId, e);
          }
        }
      }
    }

    if (parsed.data.grandTotal > 0) {
      try {
        await (storage as any).createAutoPostedVoucher({
          type: "Receipt",
          date: new Date().toISOString().split("T")[0],
          debitAccountCode: "1001",
          creditAccountCode: "4003",
          amount: parsed.data.grandTotal,
          narration: `POS Sale — Receipt #${(sale as any).receiptNo || sale.id}`,
          reference: `POS-${sale.id}`,
          referenceType: "POSSale",
          createdBy: (req as any).user?.email || "system",
          branchId,
          sourceModule: "pos",
        });
      } catch (voucherErr) {
        console.warn("[POS] Auto-voucher posting failed (non-fatal):", (voucherErr as Error).message);
      }
    }

    res.status(201).json(sale);
  }));

  app.patch("/api/sales/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getSale(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertSaleSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const sale = await storage.updateSale(req.params.id, parsed.data);
    if (!sale) return res.status(404).json({ error: "Not found" });
    res.json(sale);
  }));

  app.delete("/api/sales/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getSale(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteSale(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
