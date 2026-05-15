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
import { requireStudentModuleWrite } from "../middleware/module-auth";
import { studentSchema, insertStudentSchema, libraryMembersTable } from "@shared/schema";
import { checkStudentReferences } from "../validation";

export function registerStudentRoutes(app: Express) {
  app.get("/api/students", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    let students = filterByBranch(await storage.getStudents(), branchId);
    const { query, status, class: filterClass, page, limit: limitStr } = req.query;

    if (query && typeof query === "string") {
      const searchLower = query.toLowerCase().trim();
      students = students.filter(s => {
        const studentIdMatch = s.studentId?.toLowerCase().includes(searchLower);
        const nameMatch = s.name?.toLowerCase().includes(searchLower);
        return studentIdMatch || nameMatch;
      });
    }
    if (status && typeof status === "string") {
      students = students.filter(s => s.status === status);
    }
    if (filterClass && typeof filterClass === "string") {
      students = students.filter(s => s.class === filterClass);
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(String(page)));
      const limitNum = Math.min(500, Math.max(1, parseInt(String(limitStr || "100"))));
      const total = students.length;
      const offset = (pageNum - 1) * limitNum;
      return res.json({ data: students.slice(offset, offset + limitNum), total, page: pageNum, limit: limitNum });
    }

    res.json(students);
  }));

  // Named sub-routes must come BEFORE /:id to avoid being swallowed as an id param
  app.get("/api/students/promotion-preview", asyncHandler(async (req, res) => {
    const { fromClass, fromSection } = req.query as { fromClass?: string; fromSection?: string };
    const branchId = getBranchId(req);
    let students = filterByBranch(await storage.getStudents(), branchId);
    students = students.filter(s => s.status === "Active");
    if (fromClass) students = students.filter(s => s.class === fromClass);
    if (fromSection) students = students.filter(s => s.section === fromSection);
    res.json({ count: students.length, students });
  }));

  app.post("/api/students/promote", requireStudentModuleWrite, asyncHandler(async (req, res) => {
    const { fromClass, fromSection, toClass, toSection } = req.body;
    if (!fromClass || !toClass) return res.status(400).json({ error: "fromClass and toClass are required" });
    const branchId = getBranchId(req);
    let students = filterByBranch(await storage.getStudents(), branchId);
    students = students.filter(s => s.status === "Active" && s.class === fromClass);
    if (fromSection) students = students.filter(s => s.section === fromSection);

    let promoted = 0;
    for (const student of students) {
      await storage.updateStudent(String(student.id), { class: toClass, section: toSection || student.section });
      promoted++;
    }
    res.json({ promoted, message: `${promoted} students promoted from ${fromClass} to ${toClass}` });
  }));

  app.post("/api/students/graduate", requireStudentModuleWrite, asyncHandler(async (req, res) => {
    const { fromClass, fromSection } = req.body;
    if (!fromClass) return res.status(400).json({ error: "fromClass is required" });
    const branchId = getBranchId(req);
    let students = filterByBranch(await storage.getStudents(), branchId);
    students = students.filter(s => s.status === "Active" && s.class === fromClass);
    if (fromSection) students = students.filter(s => s.section === fromSection);

    let graduated = 0;
    for (const student of students) {
      await storage.updateStudent(String(student.id), { status: "Alumni" });
      graduated++;
    }
    res.json({ graduated, message: `${graduated} students graduated from ${fromClass}` });
  }));

  app.get("/api/students/:id", asyncHandler(async (req, res) => {
    const student = await storage.getStudent(req.params.id);
    if (!student || !verifyBranch(student, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(student);
  }));

  app.post("/api/students", requireStudentModuleWrite, asyncHandler(async (req, res) => {
    const parsed = insertStudentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });

    const student = await storage.createStudent({
      ...parsed.data,
      branchId: getBranchId(req),
      schoolId: getSchoolId(req),
    });

    try {
      await db.insert(libraryMembersTable)
        .values({
          memberId: `LIB-${student.studentId}`,
          name: student.name,
          type: "student",
          contact: student.parentContact,
          referenceId: student.studentId,
          branchId: getBranchId(req) ?? null,
        })
        .onConflictDoNothing();
    } catch (libErr: any) {
      console.warn(
        `[Enrollment] Library member creation failed for ${student.studentId} — rolling back student. Error: ${libErr.message}`
      );
      try {
        await storage.deleteStudent(String(student.id));
      } catch (deleteErr: any) {
        console.error(
          `[Enrollment] CRITICAL: Could not rollback student ${student.studentId} after library failure:`,
          deleteErr
        );
      }
      return res.status(500).json({
        error:
          "Student enrollment failed: could not create library membership. Please try again.",
      });
    }

    res.status(201).json(student);
  }));

  app.patch("/api/students/:id", requireStudentModuleWrite, asyncHandler(async (req, res) => {
    const existing = await storage.getStudent(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = studentSchema.omit({ id: true, studentId: true }).partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const student = await storage.updateStudent(req.params.id, parsed.data);
    if (!student) return res.status(404).json({ error: "Not found" });
    res.json(student);
  }));

  app.delete("/api/students/:id", requireStudentModuleWrite, asyncHandler(async (req, res) => {
    const existing = await storage.getStudent(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkStudentReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteStudent(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
