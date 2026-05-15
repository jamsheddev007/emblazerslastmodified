import type { Express } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { teacherAssignmentsTable } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import { insertTimetableSchema, insertDateSheetSchema } from "@shared/schema";

export function registerTimetableRoutes(app: Express) {
  app.get("/api/assigned-teachers", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const teachers = await db.select().from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.branchId, branchId));
    res.json(teachers);
  }));

  app.get("/api/timetable/assigned-teachers", asyncHandler(async (req, res) => {
    const { className, section } = req.query as Record<string, string>;
    const branchId = getBranchId(req);
    const conditions = [eq(teacherAssignmentsTable.branchId, branchId), eq(teacherAssignmentsTable.isActive, true)];
    if (className) conditions.push(eq(teacherAssignmentsTable.className, className));
    if (section) conditions.push(eq(teacherAssignmentsTable.section, section));
    const rows = await db.select().from(teacherAssignmentsTable).where(and(...conditions));
    const unique = Array.from(
      new Map(rows.map((t) => [t.staffId, { id: String(t.id), teacherId: t.staffId, name: t.staffName, subject: t.subject }])).values()
    );
    res.json(unique);
  }));

  app.get("/api/assigned-teachers/:id", asyncHandler(async (req, res) => {
    const [teacher] = await db.select().from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.id, Number(req.params.id)));
    if (!teacher || teacher.branchId !== getBranchId(req)) return res.status(404).json({ error: "Not found" });
    res.json(teacher);
  }));

  app.post("/api/assigned-teachers", asyncHandler(async (req, res) => {
    const [teacher] = await db.insert(teacherAssignmentsTable)
      .values({ ...req.body, branchId: getBranchId(req) })
      .returning();
    res.status(201).json(teacher);
  }));

  app.patch("/api/assigned-teachers/:id", asyncHandler(async (req, res) => {
    const [existing] = await db.select().from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.id, Number(req.params.id)));
    if (!existing || existing.branchId !== getBranchId(req)) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const [teacher] = await db.update(teacherAssignmentsTable)
      .set(updates)
      .where(eq(teacherAssignmentsTable.id, Number(req.params.id)))
      .returning();
    res.json(teacher);
  }));

  app.delete("/api/assigned-teachers/:id", asyncHandler(async (req, res) => {
    const [existing] = await db.select().from(teacherAssignmentsTable)
      .where(eq(teacherAssignmentsTable.id, Number(req.params.id)));
    if (!existing || existing.branchId !== getBranchId(req)) return res.status(404).json({ error: "Not found" });
    await db.delete(teacherAssignmentsTable).where(eq(teacherAssignmentsTable.id, Number(req.params.id)));
    res.json({ success: true });
  }));

  app.get("/api/timetables", asyncHandler(async (req, res) => {
    const timetables = filterByBranch(await storage.getTimetables(), getBranchId(req));
    res.json(timetables);
  }));

  app.get("/api/timetables/:id", asyncHandler(async (req, res) => {
    const timetable = await storage.getTimetable(req.params.id);
    if (!timetable || !verifyBranch(timetable, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(timetable);
  }));

  app.post("/api/timetables", asyncHandler(async (req, res) => {
    const parsed = insertTimetableSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const timetable = await storage.createTimetable({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(timetable);
  }));

  app.patch("/api/timetables/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getTimetable(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertTimetableSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const timetable = await storage.updateTimetable(req.params.id, parsed.data);
    if (!timetable) return res.status(404).json({ error: "Not found" });
    res.json(timetable);
  }));

  app.delete("/api/timetables/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getTimetable(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteTimetable(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/date-sheets", asyncHandler(async (req, res) => {
    const dateSheets = filterByBranch(await storage.getDateSheets(), getBranchId(req));
    res.json(dateSheets);
  }));

  app.get("/api/date-sheets/:id", asyncHandler(async (req, res) => {
    const dateSheet = await storage.getDateSheet(req.params.id);
    if (!dateSheet || !verifyBranch(dateSheet, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(dateSheet);
  }));

  app.post("/api/date-sheets", asyncHandler(async (req, res) => {
    const parsed = insertDateSheetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const dateSheet = await storage.createDateSheet({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(dateSheet);
  }));

  app.patch("/api/date-sheets/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDateSheet(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertDateSheetSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const dateSheet = await storage.updateDateSheet(req.params.id, parsed.data);
    if (!dateSheet) return res.status(404).json({ error: "Not found" });
    res.json(dateSheet);
  }));

  app.delete("/api/date-sheets/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDateSheet(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteDateSheet(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
