import type { Express } from "express";
import { storage } from "../storage";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import { insertAttendanceRecordSchema } from "@shared/schema";

export function registerAttendanceRoutes(app: Express) {
  app.get("/api/attendance-records", asyncHandler(async (req, res) => {
    const records = filterByBranch(await storage.getAttendanceRecords(), getBranchId(req));
    res.json(records);
  }));

  app.get("/api/attendance-records/summary/:date", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const allRecords = filterByBranch(await storage.getAttendanceRecords(), branchId);
    const dateRecords = allRecords.filter((r: any) => r.date === req.params.date);
    const studentRecords = dateRecords.filter((r: any) => r.targetType === "STUDENT" || r.targetType === "student");
    const staffRecords = dateRecords.filter((r: any) => r.targetType === "STAFF" || r.targetType === "staff");
    res.json({
      date: req.params.date,
      students: {
        total: studentRecords.length,
        present: studentRecords.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length,
        absent: studentRecords.filter((r: any) => r.status?.toUpperCase() === "ABSENT").length,
        late: studentRecords.filter((r: any) => r.status?.toUpperCase() === "LATE").length,
      },
      staff: {
        total: staffRecords.length,
        present: staffRecords.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length,
        absent: staffRecords.filter((r: any) => r.status?.toUpperCase() === "ABSENT").length,
        late: staffRecords.filter((r: any) => r.status?.toUpperCase() === "LATE").length,
      },
    });
  }));

  app.get("/api/attendance/summary", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { date, targetType } = req.query as Record<string, string>;
    const allRecords = filterByBranch(await storage.getAttendanceRecords(), branchId);
    const dateRecords = date ? allRecords.filter((r: any) => r.date === date) : allRecords;
    const studentRecords = dateRecords.filter((r: any) => r.targetType === "STUDENT" || r.targetType === "student");
    const staffRecords = dateRecords.filter((r: any) => r.targetType === "STAFF" || r.targetType === "staff");
    const filtered = targetType ? (targetType.toUpperCase() === "STUDENT" ? studentRecords : staffRecords) : dateRecords;
    res.json({
      date: date || null,
      students: {
        total: studentRecords.length,
        present: studentRecords.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length,
        absent: studentRecords.filter((r: any) => r.status?.toUpperCase() === "ABSENT").length,
        late: studentRecords.filter((r: any) => r.status?.toUpperCase() === "LATE").length,
      },
      staff: {
        total: staffRecords.length,
        present: staffRecords.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length,
        absent: staffRecords.filter((r: any) => r.status?.toUpperCase() === "ABSENT").length,
        late: staffRecords.filter((r: any) => r.status?.toUpperCase() === "LATE").length,
      },
    });
  }));

  app.get("/api/attendance-records/report", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { startDate, endDate, targetType } = req.query as Record<string, string>;
    let allRecords = filterByBranch(await storage.getAttendanceRecords(), branchId);
    if (startDate) allRecords = allRecords.filter((r: any) => r.date >= startDate);
    if (endDate) allRecords = allRecords.filter((r: any) => r.date <= endDate);
    if (targetType) allRecords = allRecords.filter((r: any) => r.targetType?.toUpperCase() === targetType.toUpperCase());
    res.json(allRecords);
  }));

  app.get("/api/attendance/report", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { startDate, endDate, targetType, className, section } = req.query as Record<string, string>;
    let allRecords = filterByBranch(await storage.getAttendanceRecords(), branchId);
    if (startDate) allRecords = allRecords.filter((r: any) => r.date >= startDate);
    if (endDate) allRecords = allRecords.filter((r: any) => r.date <= endDate);
    if (targetType) allRecords = allRecords.filter((r: any) => r.targetType?.toUpperCase() === targetType.toUpperCase());
    if (className) allRecords = allRecords.filter((r: any) => r.className === className);
    if (section) allRecords = allRecords.filter((r: any) => r.section === section);
    res.json(allRecords);
  }));

  app.get("/api/attendance-records/:id", asyncHandler(async (req, res) => {
    const record = await storage.getAttendanceRecord(req.params.id);
    if (!record || !verifyBranch(record, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(record);
  }));

  app.post("/api/attendance-records", asyncHandler(async (req, res) => {
    const parsed = insertAttendanceRecordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const record = await storage.createAttendanceRecord({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(record);
  }));

  app.patch("/api/attendance-records/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getAttendanceRecord(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertAttendanceRecordSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const record = await storage.updateAttendanceRecord(req.params.id, parsed.data);
    if (!record) return res.status(404).json({ error: "Not found" });
    res.json(record);
  }));

  app.delete("/api/attendance-records/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getAttendanceRecord(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteAttendanceRecord(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
