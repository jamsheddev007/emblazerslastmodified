import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { db } from "../db";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
  loginLimiter,
  passwordChangeLimiter,
} from "../lib/route-helpers";
import { requireCurriculumAdmin } from "../middleware/module-auth";
import {
  insertCurriculumSchema,
  insertExamSchema,
  insertResultSchema,
  staffTable,
  teacherAssignmentsTable,
  studentPortalAccountsTable,
  teacherAuthPasswordsTable,
  teacherContentsTable,
  teacherQuizzesTable,
  studentQuizAttemptsTable,
  idCardRequestsTable,
  parentAccountsTable,
  parentStudentLinksTable,
  parentMessagesTable,
  parentNotificationsTable,
  studentsTable,
  challansTable,
  notificationsTable,
  messagesTable,
  certificatesTable,
  homeworkAssignmentsTable,
  homeworkSubmissionsTable,
  examResultsTable,
  assetsTable,
  assetMaintenanceLogsTable,
  reportCardSettingsTable,
  branchesTable,
  schoolsTable,
} from "@shared/schema";
import { eq, and, desc, count, inArray, gte, lte, sql } from "drizzle-orm";

export function registerCurriculumRoutes(app: Express) {

  // ============== CURRICULUM CRUD ==============

  app.get("/api/curriculums", asyncHandler(async (req, res) => {
    const curriculums = filterByBranch(await storage.getCurriculums(), getBranchId(req));
    res.json(curriculums);
  }));

  app.get("/api/curriculums/:id", asyncHandler(async (req, res) => {
    const curriculum = await storage.getCurriculum(req.params.id);
    if (!curriculum || !verifyBranch(curriculum, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(curriculum);
  }));

  app.post("/api/curriculums", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const parsed = insertCurriculumSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const curriculum = await storage.createCurriculum({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(curriculum);
  }));

  app.patch("/api/curriculums/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const existing = await storage.getCurriculum(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id: _id, ...updates } = req.body;
    const parsed = insertCurriculumSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const curriculum = await storage.updateCurriculum(req.params.id, parsed.data);
    if (!curriculum) return res.status(404).json({ error: "Not found" });
    res.json(curriculum);
  }));

  app.delete("/api/curriculums/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const existing = await storage.getCurriculum(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteCurriculum(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  // ============== EXAMS ==============

  app.get("/api/exams", asyncHandler(async (req, res) => {
    const exams = filterByBranch(await storage.getExams(), getBranchId(req));
    res.json(exams);
  }));

  app.get("/api/exams/:id", asyncHandler(async (req, res) => {
    const exam = await storage.getExam(req.params.id);
    if (!exam || !verifyBranch(exam, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(exam);
  }));

  app.post("/api/exams", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const parsed = insertExamSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const branchId = getBranchId(req);
    const exam = await storage.createExam({ ...parsed.data, branchId, schoolId: getSchoolId(req) });
    try {
      await storage.createDateSheet({ examName: exam.name, examType: exam.term as any, class: exam.classRange, startDate: exam.startDate, endDate: exam.endDate, entries: [], branchId });
    } catch (e) {
      console.warn("[Exam→Datesheet] Auto datesheet creation failed (non-fatal):", (e as Error).message);
    }
    res.status(201).json(exam);
  }));

  app.patch("/api/exams/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const existing = await storage.getExam(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id: _id, ...updates } = req.body;
    const parsed = insertExamSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const exam = await storage.updateExam(req.params.id, parsed.data);
    if (!exam) return res.status(404).json({ error: "Not found" });
    res.json(exam);
  }));

  app.delete("/api/exams/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const existing = await storage.getExam(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { checkExamReferences } = await import("../validation");
    const validation = await checkExamReferences(req.params.id);
    if (!validation.canDelete) return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    const deleted = await storage.deleteExam(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  // ============== RESULTS ==============

  app.get("/api/results", asyncHandler(async (req, res) => {
    const results = filterByBranch(await storage.getResults(), getBranchId(req));
    res.json(results);
  }));

  app.get("/api/results/:id", asyncHandler(async (req, res) => {
    const result = await storage.getResult(req.params.id);
    if (!result || !verifyBranch(result, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(result);
  }));

  app.post("/api/results", requireCurriculumAdmin, async (req, res) => {
    try {
      const parsed = insertResultSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const result = await storage.createResult({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error creating result:", error);
      res.status(500).json({ error: error.message || "Failed to create result" });
    }
  });

  app.patch("/api/results/:id", requireCurriculumAdmin, async (req, res) => {
    try {
      const existing = await storage.getResult(req.params.id);
      if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
      const { id: _id, ...updates } = req.body;
      const parsed = insertResultSchema.partial().safeParse(updates);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const result = await storage.updateResult(req.params.id, parsed.data);
      if (!result) return res.status(404).json({ error: "Not found" });
      res.json(result);
    } catch (error: any) {
      console.error("Error updating result:", error);
      res.status(500).json({ error: error.message || "Failed to update result" });
    }
  });

  app.delete("/api/results/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const existing = await storage.getResult(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteResult(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  // ============== CURRICULUM ADMIN ROUTES ==============

  app.get("/api/curriculum/staff-teachers", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const allStaff = await db.select().from(staffTable);
    const staff = allStaff.filter(s => /teacher|professor|instructor/i.test(s.designation) && (s.branchId === branchId || s.branchId === null));
    res.json(staff.map((s: any) => ({ id: String(s.id), staffId: s.staffId || String(s.id), name: s.name, email: s.email, designation: s.designation, department: s.department })));
  }));

  app.get("/api/curriculum/teacher-assignments", asyncHandler(async (req, res) => {
    const conditions: any[] = [];
    if (req.query.staffId) conditions.push(eq(teacherAssignmentsTable.staffId, req.query.staffId as string));
    if (req.query.className) conditions.push(eq(teacherAssignmentsTable.className, req.query.className as string));
    const rows = conditions.length > 0
      ? await db.select().from(teacherAssignmentsTable).where(and(...conditions)).orderBy(desc(teacherAssignmentsTable.id))
      : await db.select().from(teacherAssignmentsTable).orderBy(desc(teacherAssignmentsTable.id));
    res.json(filterByBranch(rows.map((d: any) => ({ ...d, id: String(d.id) })), getBranchId(req)));
  }));

  app.post("/api/curriculum/teacher-assignments", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const { insertTeacherAssignmentSchema } = await import("@shared/schema");
    const parsed = insertTeacherAssignmentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const [row] = await db.insert(teacherAssignmentsTable).values({ ...parsed.data, branchId: getBranchId(req), createdAt: new Date().toISOString() }).returning();
    res.status(201).json({ ...row, id: String(row.id) });
  }));

  app.delete("/api/curriculum/teacher-assignments/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const [existing] = await db.select().from(teacherAssignmentsTable).where(eq(teacherAssignmentsTable.id, parseInt(req.params.id, 10)));
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const result = await db.delete(teacherAssignmentsTable).where(eq(teacherAssignmentsTable.id, parseInt(req.params.id, 10))).returning();
    if (result.length === 0) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/curriculum/student-accounts", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const allAccounts = await db.select().from(studentPortalAccountsTable).orderBy(desc(studentPortalAccountsTable.id));
    const accounts = filterByBranch(allAccounts, branchId);
    res.json(accounts.map((a: any) => ({ id: String(a.id), studentId: a.studentId, studentName: a.studentName, className: a.className, section: a.section, isFirstLogin: true, isActive: a.isActive, lastLogin: null, createdAt: a.createdAt })));
  }));

  app.post("/api/curriculum/student-accounts/create", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const { studentId, className, section } = req.body;
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    const branchId = getBranchId(req);

    const allStudents = filterByBranch(await storage.getStudents(), branchId);
    let targetStudents: typeof allStudents = [];

    if (studentId) {
      const student = allStudents.find(s => s.studentId === studentId || s.id === studentId);
      if (student) targetStudents = [student];
      else results.errors.push(`Student ${studentId} not found`);
    } else if (className) {
      targetStudents = allStudents.filter(s => s.class === className && (!section || s.section === section));
    } else {
      return res.status(400).json({ error: "Provide studentId or className (with optional section)" });
    }

    for (const student of targetStudents) {
      try {
        const [existing] = await db.select().from(studentPortalAccountsTable).where(eq(studentPortalAccountsTable.studentId, student.studentId));
        if (existing) { results.skipped++; continue; }
        const passwordHash = await bcrypt.hash("12345678", 10);
        await db.insert(studentPortalAccountsTable).values({ studentId: student.studentId, studentName: student.name, className: student.class, section: student.section, passwordHash, branchId, createdAt: new Date().toISOString() });
        results.created++;
      } catch (err: any) {
        results.errors.push(`${student.studentId}: ${err.message}`);
      }
    }

    res.json(results);
  }));

  app.post("/api/curriculum/student-accounts/reset-password/:studentId", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const [account] = await db.select().from(studentPortalAccountsTable).where(eq(studentPortalAccountsTable.studentId, req.params.studentId));
    if (!account || !verifyBranch(account, getBranchId(req))) return res.status(404).json({ error: "Account not found" });
    const passwordHash = await bcrypt.hash("12345678", 10);
    await db.update(studentPortalAccountsTable).set({ passwordHash }).where(eq(studentPortalAccountsTable.id, account.id));
    res.json({ success: true, message: "Password reset to default (12345678)" });
  }));

  app.patch("/api/curriculum/student-accounts/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const [existing] = await db.select().from(studentPortalAccountsTable).where(eq(studentPortalAccountsTable.id, parseInt(req.params.id, 10)));
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Account not found" });
    const { isActive } = req.body;
    const result = await db.update(studentPortalAccountsTable).set({ isActive }).where(eq(studentPortalAccountsTable.id, parseInt(req.params.id, 10))).returning();
    if (result.length === 0) return res.status(404).json({ error: "Account not found" });
    res.json({ success: true });
  }));

  app.get("/api/curriculum/quiz-overview", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const allQuizzes = await db.select().from(teacherQuizzesTable).orderBy(desc(teacherQuizzesTable.id));
    const quizzes = filterByBranch(allQuizzes, branchId);
    const result = await Promise.all(quizzes.map(async (q: any) => {
      const [{ cnt }] = await db.select({ cnt: count() }).from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.quizId, String(q.id)));
      return { id: String(q.id), title: q.title, teacherName: q.teacherName, className: q.className, section: q.section, subject: q.subject, totalMarks: q.totalMarks, isPublished: q.isPublished, questionsCount: (q.questions as any[])?.length || 0, attemptCount: Number(cnt), createdAt: q.createdAt };
    }));
    res.json(result);
  }));

  // ============== TEACHER AUTH ROUTES ==============

  app.post("/api/teacher/login", loginLimiter, asyncHandler(async (req, res) => {
    const { staffEmail, password } = req.body;
    if (!staffEmail || !password) return res.status(400).json({ error: "Staff email and password are required" });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: "Server configuration error" });

    const allStaff = await db.select().from(staffTable);
    const staff = allStaff.find(s => s.email.toLowerCase() === staffEmail.toLowerCase());
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const staffDbId = String(staff.id);
    const assignments = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, staffDbId), eq(teacherAssignmentsTable.isActive, true)));
    const staffIdValue = staff.staffId || staffDbId;
    let [authRecord] = await db.select().from(teacherAuthPasswordsTable).where(eq(teacherAuthPasswordsTable.staffId, staffIdValue));

    if (!authRecord) {
      const defaultHash = await bcrypt.hash(staffIdValue, 10);
      [authRecord] = await db.insert(teacherAuthPasswordsTable).values({ staffId: staffIdValue, passwordHash: defaultHash, createdAt: new Date().toISOString() }).returning();
    }

    const isValid = await bcrypt.compare(password, authRecord.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { userId: staffDbId, email: staff.email, staffName: staff.name, role: "teacher", module: "curriculum", staffId: staffDbId, branchId: staff.branchId || 1, schoolId: 1 },
      jwtSecret, { expiresIn: "3d" }
    );

    return res.json({ success: true, token, module: "curriculum", user: { email: staff.email, role: "teacher", name: staff.name, staffId: staffDbId, staffEmail: staff.email }, assignments: assignments.map((a: any) => ({ id: String(a.id), className: a.className, section: a.section, subject: a.subject })) });
  }));

  app.post("/api/teacher/change-password", passwordChangeLimiter, asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current password and new password are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(user.staffId, 10)));
    if (!staff) return res.status(404).json({ error: "Staff not found" });

    const staffIdValue = staff.staffId || String(staff.id);
    let [authRecord] = await db.select().from(teacherAuthPasswordsTable).where(eq(teacherAuthPasswordsTable.staffId, staffIdValue));

    if (!authRecord) {
      const defaultHash = await bcrypt.hash(staffIdValue, 10);
      [authRecord] = await db.insert(teacherAuthPasswordsTable).values({ staffId: staffIdValue, passwordHash: defaultHash, createdAt: new Date().toISOString() }).returning();
    }

    const isValid = await bcrypt.compare(currentPassword, authRecord.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(teacherAuthPasswordsTable).set({ passwordHash: newHash }).where(eq(teacherAuthPasswordsTable.id, authRecord.id));
    return res.json({ success: true, message: "Password changed successfully" });
  }));

  // ============== TEACHER PORTAL ROUTES ==============

  app.get("/api/teacher/my-assignments", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const rows = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, staffId), eq(teacherAssignmentsTable.isActive, true)));
    res.json(rows.map((d: any) => ({ ...d, id: String(d.id) })));
  }));

  app.get("/api/teacher/content", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const rows = await db.select().from(teacherContentsTable).where(eq(teacherContentsTable.staffId, staffId)).orderBy(desc(teacherContentsTable.id));
    res.json(rows.map((d: any) => ({ ...d, id: String(d.id) })));
  }));

  app.post("/api/teacher/content", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(staffId, 10)));
    const teacherName = req.body.teacherName || staff?.name || "Teacher";
    const [row] = await db.insert(teacherContentsTable).values({ ...req.body, staffId, teacherName, createdAt: new Date().toISOString() }).returning();
    res.status(201).json({ ...row, id: String(row.id) });
  }));

  app.patch("/api/teacher/content/:id/toggle-publish", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const [doc] = await db.select().from(teacherContentsTable).where(eq(teacherContentsTable.id, parseInt(req.params.id, 10)));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    const [updated] = await db.update(teacherContentsTable).set({ isPublished: !doc.isPublished }).where(eq(teacherContentsTable.id, doc.id)).returning();
    res.json({ id: String(updated.id), isPublished: updated.isPublished });
  }));

  app.delete("/api/teacher/content/:id", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const [doc] = await db.select().from(teacherContentsTable).where(eq(teacherContentsTable.id, parseInt(req.params.id, 10)));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    await db.delete(teacherContentsTable).where(eq(teacherContentsTable.id, doc.id));
    res.json({ success: true });
  }));

  app.get("/api/teacher/quizzes", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const rows = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.staffId, staffId)).orderBy(desc(teacherQuizzesTable.id));
    res.json(rows.map((d: any) => ({ ...d, id: String(d.id) })));
  }));

  app.post("/api/teacher/quizzes", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(staffId, 10)));
    const teacherName = req.body.teacherName || staff?.name || "Teacher";
    const questions = (req.body.questions || []).map((q: any) => ({ ...q, questionType: q.questionType === "true_false" ? "truefalse" : q.questionType }));
    const [row] = await db.insert(teacherQuizzesTable).values({ ...req.body, staffId, teacherName, questions, createdAt: new Date().toISOString() }).returning();
    res.status(201).json({ ...row, id: String(row.id) });
  }));

  app.put("/api/teacher/quizzes/:id", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const quizId = parseInt(req.params.id, 10);
    const [existing] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!existing) return res.status(404).json({ error: "Not found" });
    if (existing.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    const [{ cnt }] = await db.select({ cnt: count() }).from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.quizId, req.params.id));
    if (Number(cnt) > 0) return res.status(400).json({ error: "Cannot update quiz that already has student attempts" });
    const { id: _id, ...updates } = req.body;
    const [updated] = await db.update(teacherQuizzesTable).set(updates).where(eq(teacherQuizzesTable.id, quizId)).returning();
    res.json({ ...updated, id: String(updated.id) });
  }));

  app.delete("/api/teacher/quizzes/:id", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const quizId = parseInt(req.params.id, 10);
    const [doc] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    const [{ cnt }] = await db.select({ cnt: count() }).from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.quizId, req.params.id));
    if (Number(cnt) > 0) return res.status(400).json({ error: "Cannot delete quiz that already has student attempts" });
    await db.delete(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    res.json({ success: true });
  }));

  app.patch("/api/teacher/quizzes/:id/toggle-publish", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const quizId = parseInt(req.params.id, 10);
    const [doc] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!doc) return res.status(404).json({ error: "Not found" });
    if (doc.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    const [updated] = await db.update(teacherQuizzesTable).set({ isPublished: !doc.isPublished }).where(eq(teacherQuizzesTable.id, quizId)).returning();
    res.json({ id: String(updated.id), isPublished: updated.isPublished });
  }));

  app.get("/api/teacher/quizzes/:id/attempts", asyncHandler(async (req, res) => {
    const staffId = (req as any).user?.staffId;
    const quizId = parseInt(req.params.id, 10);
    const [quiz] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (quiz.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });
    const rows = await db.select().from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.quizId, req.params.id)).orderBy(desc(studentQuizAttemptsTable.id));
    res.json(rows.map((d: any) => ({ ...d, id: String(d.id) })));
  }));

  app.patch("/api/teacher/quizzes/:id/attempts/:attemptId/grade-short", asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    if (!attemptId || attemptId === "null" || attemptId === "undefined") return res.status(400).json({ error: "Invalid attempt ID" });
    const attemptIdNum = parseInt(attemptId, 10);
    if (isNaN(attemptIdNum)) return res.status(400).json({ error: "Invalid attempt ID" });

    const { questionIndex, marksAwarded } = req.body;
    const [attempt] = await db.select().from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.id, attemptIdNum));
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    const quizId = parseInt(req.params.id, 10);
    const [quiz] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const staffId = (req as any).user?.staffId;
    if (quiz.staffId !== staffId) return res.status(403).json({ error: "Unauthorized: You do not own this resource" });

    const answers = attempt.answers as any[];
    if (questionIndex < 0 || questionIndex >= answers.length) return res.status(400).json({ error: "Invalid question index" });

    answers[questionIndex].marksAwarded = marksAwarded;
    answers[questionIndex].isCorrect = marksAwarded > 0;

    const totalMarksObtained = answers.reduce((sum: number, a: any) => sum + (a.marksAwarded || 0), 0);
    const percentage = attempt.totalMarks > 0 ? Math.round((totalMarksObtained / attempt.totalMarks) * 100) : 0;
    const isPassed = totalMarksObtained >= quiz.passingMarks;

    const { calculateGrade } = await import("../utils/grade");
    const grade = calculateGrade(percentage);

    const [updated] = await db.update(studentQuizAttemptsTable).set({ answers, totalMarksObtained, percentage, isPassed, grade }).where(eq(studentQuizAttemptsTable.id, attemptIdNum)).returning();
    res.json({ ...updated, id: String(updated.id) });
  }));

  // ============== PUBLISHED CONTENT (read-only for students) ==============

  app.get("/api/curriculum/published-content", asyncHandler(async (req, res) => {
    const conditions: any[] = [eq(teacherContentsTable.isPublished, true)];
    if (req.query.className) conditions.push(eq(teacherContentsTable.className, req.query.className as string));
    if (req.query.section) conditions.push(eq(teacherContentsTable.section, req.query.section as string));
    if (req.query.subject) conditions.push(eq(teacherContentsTable.subject, req.query.subject as string));
    const rows = await db.select().from(teacherContentsTable).where(and(...conditions)).orderBy(desc(teacherContentsTable.id));
    res.json(filterByBranch(rows.map((d: any) => ({ ...d, id: String(d.id) })), getBranchId(req)));
  }));

  app.get("/api/curriculum/published-quizzes", asyncHandler(async (req, res) => {
    const conditions: any[] = [eq(teacherQuizzesTable.isPublished, true)];
    if (req.query.className) conditions.push(eq(teacherQuizzesTable.className, req.query.className as string));
    if (req.query.section) conditions.push(eq(teacherQuizzesTable.section, req.query.section as string));
    const rows = await db.select().from(teacherQuizzesTable).where(and(...conditions)).orderBy(desc(teacherQuizzesTable.id));
    res.json(filterByBranch(rows.map((d: any) => ({ ...d, id: String(d.id) })), getBranchId(req)));
  }));

  // ============== ID CARD ADMIN ROUTES ==============

  app.delete("/api/curriculum/student-accounts/id-card-reset/:studentId", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin" || user.module !== "curriculum") return res.status(403).json({ error: "Admin access required" });
    await db.delete(idCardRequestsTable).where(eq(idCardRequestsTable.studentId, req.params.studentId));
    return res.json({ success: true, message: "ID card request reset successfully" });
  }));

  // ============== PARENT INBOX (ADMIN) ROUTES ==============

  app.get("/api/curriculum/parent-inbox", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin" || user.module !== "curriculum") return res.status(403).json({ error: "Admin access required" });

    const allMessages = await db.select().from(parentMessagesTable).orderBy(desc(parentMessagesTable.createdAt));
    const allParents = await db.select().from(parentAccountsTable);
    const allStudents = await storage.getStudents();

    const conversationMap: Record<string, any> = {};
    for (const msg of allMessages) {
      const key = msg.studentId;
      if (!conversationMap[key]) {
        const student = allStudents.find(s => s.studentId === msg.studentId);
        const parentLink = await db.select().from(parentStudentLinksTable).where(eq(parentStudentLinksTable.studentId, msg.studentId)).limit(1);
        const parent = parentLink.length > 0 ? allParents.find(p => p.id === parentLink[0].parentId) : null;
        conversationMap[key] = { studentId: msg.studentId, studentName: student?.name || msg.studentId, parentName: parent?.fullName || "Unknown Parent", parentCnic: parent?.cnic || "", lastMessage: msg.message, lastMessageAt: msg.createdAt, lastSenderRole: msg.senderRole, unreadCount: 0 };
      }
      if (msg.senderRole === "parent" && !msg.isRead) conversationMap[key].unreadCount++;
    }

    res.json(Object.values(conversationMap).sort((a: any, b: any) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()));
  }));

  app.get("/api/curriculum/parent-inbox/:studentId", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin" || user.module !== "curriculum") return res.status(403).json({ error: "Admin access required" });
    const { studentId } = req.params;
    const messages = await db.select().from(parentMessagesTable).where(eq(parentMessagesTable.studentId, studentId)).orderBy(parentMessagesTable.createdAt);
    await db.update(parentMessagesTable).set({ isRead: true }).where(and(eq(parentMessagesTable.studentId, studentId), eq(parentMessagesTable.senderRole, "parent")));
    res.json(messages);
  }));

  app.post("/api/curriculum/parent-inbox/reply", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user || user.role !== "admin" || user.module !== "curriculum") return res.status(403).json({ error: "Admin access required" });
    const { studentId, message } = req.body;
    if (!studentId || !message) return res.status(400).json({ error: "studentId and message are required" });
    const [msg] = await db.insert(parentMessagesTable).values({ senderRole: "school", senderId: "school", receiverId: "parent", studentId, message, isRead: false, createdAt: new Date().toISOString() }).returning();
    res.json(msg);
  }));

  // ============== CERTIFICATES ==============

  app.get("/api/certificates/student/:studentId", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const certs = await db.select().from(certificatesTable).where(and(eq(certificatesTable.branchId, branchId), eq(certificatesTable.studentId, parseInt(req.params.studentId)))).orderBy(desc(certificatesTable.id));
    res.json(certs);
  }));

  app.get("/api/certificates/:id", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [cert] = await db.select({
      id: certificatesTable.id, certificateType: certificatesTable.certificateType, studentId: certificatesTable.studentId,
      studentName: certificatesTable.studentName, issuedBy: certificatesTable.issuedBy, issueDate: certificatesTable.issueDate,
      content: certificatesTable.content, certificateNo: certificatesTable.certificateNo, status: certificatesTable.status,
      branchId: certificatesTable.branchId, createdAt: certificatesTable.createdAt,
      studentClass: studentsTable.class, studentSection: studentsTable.section, studentParentName: studentsTable.parentName,
    }).from(certificatesTable).leftJoin(studentsTable, eq(certificatesTable.studentId, studentsTable.id)).where(and(eq(certificatesTable.id, parseInt(req.params.id)), eq(certificatesTable.branchId, branchId)));
    if (!cert) return res.status(404).json({ error: "Certificate not found" });
    res.json(cert);
  }));

  app.patch("/api/certificates/:id/cancel", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [existing] = await db.select().from(certificatesTable).where(and(eq(certificatesTable.id, parseInt(req.params.id)), eq(certificatesTable.branchId, branchId)));
    if (!existing) return res.status(404).json({ error: "Certificate not found" });
    const [updated] = await db.update(certificatesTable).set({ status: "cancelled" }).where(eq(certificatesTable.id, parseInt(req.params.id))).returning();
    res.json(updated);
  }));

  app.get("/api/certificates", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { studentId, certificateType } = req.query as { studentId?: string; certificateType?: string };
    const conditions: any[] = [eq(certificatesTable.branchId, branchId)];
    if (studentId) conditions.push(eq(certificatesTable.studentId, parseInt(studentId)));
    if (certificateType && certificateType !== "all") conditions.push(eq(certificatesTable.certificateType, certificateType));
    const certs = await db.select().from(certificatesTable).where(and(...conditions)).orderBy(desc(certificatesTable.id));
    res.json(certs);
  }));

  app.post("/api/certificates", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { certificateType, studentId, issuedBy, issueDate, customContent, purpose } = req.body;
    if (!certificateType || !studentId || !issuedBy || !issueDate) return res.status(400).json({ error: "certificateType, studentId, issuedBy, issueDate required" });

    const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parseInt(String(studentId))));
    if (!student) return res.status(404).json({ error: "Student not found" });

    const typePrefix: Record<string, string> = { bonafide: "BON", character: "CHA", transfer: "TRA", completion: "COM" };
    const year = new Date().getFullYear();
    const [{ count: certCount }] = await db.select({ count: sql<number>`count(*)::int` }).from(certificatesTable).where(eq(certificatesTable.branchId, branchId));
    const seq = String(Number(certCount) + 1).padStart(4, "0");
    const certificateNo = `CERT-${typePrefix[certificateType] || certificateType.substring(0, 3).toUpperCase()}-${year}-${seq}`;

    const templates: Record<string, string> = {
      bonafide: `This is to certify that ${student.name} son/daughter of ${student.parentName} is a bonafide student of this institution. He/She is currently studying in Class ${student.class} Section ${student.section}. His/Her date of admission is ${student.admissionDate}. This certificate is issued on the request of the student for ${purpose || "official purposes"}.`,
      character: `This is to certify that ${student.name} son/daughter of ${student.parentName} has been a student of this institution from ${student.admissionDate}. During his/her stay he/she has shown good character and conduct. He/She bears a good moral character. This certificate is issued on his/her request.`,
      transfer: `This is to certify that ${student.name} son/daughter of ${student.parentName} was a bonafide student of this institution. He/She studied in Class ${student.class} Section ${student.section}. He/She is hereby granted Transfer Certificate on his/her own request. His/Her conduct and character was good during his/her stay.`,
      completion: `This is to certify that ${student.name} son/daughter of ${student.parentName} has successfully completed his/her studies from this institution. He/She passed Class ${student.class} in the year ${year}. We wish him/her success in future endeavors.`,
    };

    const content = customContent || templates[certificateType] || "";
    const now = new Date().toISOString();
    const [cert] = await db.insert(certificatesTable).values({ certificateType, studentId: parseInt(String(studentId)), studentName: student.name, issuedBy, issueDate, content, certificateNo, status: "active", branchId, createdAt: now }).returning();
    try {
      await db.insert(notificationsTable).values({ type: "certificate_issued", title: "Certificate Issued", message: `Certificate ${certificateNo} issued for ${student.name}`, module: "student", priority: "low", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(cert);
  }));

  // ============== MESSAGING SYSTEM ==============

  app.get("/api/teachers/list", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const teachers = await db.select({ id: staffTable.id, name: staffTable.name, designation: staffTable.designation }).from(staffTable).where(eq(staffTable.branchId, branchId));
    res.json(teachers);
  }));

  app.get("/api/messages/unread-count", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const msgs = await db.select().from(messagesTable).where(and(eq(messagesTable.receiverId, parseInt(user.userId)), eq(messagesTable.receiverRole, user.role), eq(messagesTable.isRead, false)));
    res.json({ count: msgs.length });
  }));

  app.get("/api/messages/inbox", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const msgs = await db.select().from(messagesTable).where(and(eq(messagesTable.receiverId, parseInt(user.userId)), eq(messagesTable.receiverRole, user.role))).orderBy(desc(messagesTable.id));
    res.json(msgs);
  }));

  app.get("/api/messages/sent", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const msgs = await db.select().from(messagesTable).where(and(eq(messagesTable.senderId, parseInt(user.userId)), eq(messagesTable.senderRole, user.role))).orderBy(desc(messagesTable.id));
    res.json(msgs);
  }));

  app.post("/api/messages", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const branchId = getBranchId(req);
    const { receiverId, receiverRole, subject, body, studentId } = req.body;
    if (!receiverId || !receiverRole || !subject || !body) return res.status(400).json({ error: "receiverId, receiverRole, subject, body required" });
    const senderName = user.staffName || user.studentName || user.cnic || `User #${user.userId}`;
    const now = new Date().toISOString();
    const [msg] = await db.insert(messagesTable).values({ senderId: parseInt(user.userId), senderRole: user.role, senderName, receiverId: parseInt(String(receiverId)), receiverRole, subject, body, isRead: false, studentId: studentId ? parseInt(String(studentId)) : null, branchId, createdAt: now }).returning();
    try {
      await db.insert(notificationsTable).values({ type: "message", title: "New Message", message: `New message from ${senderName}: ${subject}`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(msg);
  }));

  app.patch("/api/messages/:id/read", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const [updated] = await db.update(messagesTable).set({ isRead: true }).where(and(eq(messagesTable.id, parseInt(req.params.id)), eq(messagesTable.receiverId, parseInt(user.userId)))).returning();
    if (!updated) return res.status(404).json({ error: "Message not found" });
    res.json(updated);
  }));

  app.get("/api/teacher/messages/inbox", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const msgs = await db.select().from(messagesTable).where(and(eq(messagesTable.receiverId, parseInt(user.userId)), eq(messagesTable.receiverRole, "teacher"))).orderBy(desc(messagesTable.id));
    res.json(msgs);
  }));

  app.post("/api/teacher/messages/reply", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const branchId = getBranchId(req);
    const { receiverId, receiverRole, subject, body } = req.body;
    if (!receiverId || !receiverRole || !subject || !body) return res.status(400).json({ error: "receiverId, receiverRole, subject, body required" });
    const senderName = user.staffName || `Teacher #${user.userId}`;
    const now = new Date().toISOString();
    const [msg] = await db.insert(messagesTable).values({ senderId: parseInt(user.userId), senderRole: "teacher", senderName, receiverId: parseInt(String(receiverId)), receiverRole, subject, body, isRead: false, teacherStaffId: parseInt(user.userId), branchId, createdAt: now }).returning();
    try {
      await db.insert(notificationsTable).values({ type: "message", title: "New Message", message: `New message from ${senderName}: ${subject}`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(msg);
  }));

  // ============== REPORT CARD SETTINGS & REPORT CARD ==============

  app.get("/api/report-card-settings", asyncHandler(async (req, res) => {
    const { moduleAuthMiddleware } = await import("../middleware/module-auth");
    const branchId = getBranchId(req);
    const rows = await db.select().from(reportCardSettingsTable).where(eq(reportCardSettingsTable.branchId, branchId));
    if (rows.length === 0) return res.json({});
    return res.json(rows[0]);
  }));

  app.get("/api/report-card/:studentId", asyncHandler(async (req, res) => {
    const { authenticateToken } = await import("../middleware/auth");
    let { studentId } = req.params;
    const examId = req.query.examId as string | undefined;
    const branchId = getBranchId(req);
    const user = (req as any).user;

    if (studentId === "me" && user?.studentId) studentId = user.studentId;
    if (user?.role === "student") {
      if (!user.studentId || (studentId !== user.studentId && studentId !== "me")) return res.status(403).json({ error: "Access denied" });
      studentId = user.studentId;
    }

    const allStudents = filterByBranch(await storage.getStudents(), branchId);
    const student = allStudents.find((s: any) => s.studentId === studentId || String(s.id) === studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const allExams = filterByBranch(await storage.getExams(), branchId);
    const allResults = filterByBranch(await storage.getResults(), branchId);
    const studentResults = allResults.filter((r: any) => r.studentId === student.studentId || r.studentId === String(student.id));

    let exam = null;
    let results: any[] = [];

    if (examId) {
      exam = allExams.find((e: any) => String(e.id) === examId);
      results = studentResults.filter((r: any) => String(r.examId) === examId);
    } else {
      results = studentResults;
      if (results.length > 0) {
        const latestExamId = results[results.length - 1].examId;
        exam = allExams.find((e: any) => String(e.id) === String(latestExamId));
        if (exam) results = results.filter((r: any) => String(r.examId) === String(latestExamId));
      }
    }

    const allBranches = await db.select().from(branchesTable);
    const allSchools = await db.select().from(schoolsTable);
    const branch = allBranches.find((b: any) => b.id === ((student as any).branchId || branchId || 1));
    const school = branch ? allSchools.find((s: any) => s.id === branch.schoolId) : allSchools[0];

    const allAttendance = filterByBranch(await storage.getAttendanceRecords(), branchId);
    const studentAttendance = allAttendance.filter((a: any) =>
      (a.targetType || "").toUpperCase() === "STUDENT" && (a.entityName === student.name || a.studentId === student.studentId || a.entityId === student.studentId)
    );
    const totalDays = studentAttendance.length;
    const presentDays = studentAttendance.filter((a: any) => { const s = (a.status || "").toUpperCase(); return s === "PRESENT" || s === "LATE"; }).length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    const subjectResults = results.map((r: any, i: number) => {
      const pct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
      let grade = "F"; let remarks = "Fail";
      if (pct >= 90) { grade = "A+"; remarks = "Excellent"; }
      else if (pct >= 80) { grade = "A"; remarks = "Very Good"; }
      else if (pct >= 75) { grade = "B+"; remarks = "Good"; }
      else if (pct >= 65) { grade = "B"; remarks = "Satisfactory"; }
      else if (pct >= 55) { grade = "C"; remarks = "Average"; }
      else if (pct >= 45) { grade = "D"; remarks = "Below Average"; }
      return { sNo: i + 1, subject: r.subject, maxMarks: r.maxMarks, marksObtained: r.marksObtained, percentage: pct, grade, remarks };
    });

    const totalMaxMarks = subjectResults.reduce((s: number, r: any) => s + r.maxMarks, 0);
    const totalObtained = subjectResults.reduce((s: number, r: any) => s + r.marksObtained, 0);
    const overallPct = totalMaxMarks > 0 ? Math.round((totalObtained / totalMaxMarks) * 100) : 0;
    let overallGrade = "F";
    if (overallPct >= 90) overallGrade = "A+";
    else if (overallPct >= 80) overallGrade = "A";
    else if (overallPct >= 75) overallGrade = "B+";
    else if (overallPct >= 65) overallGrade = "B";
    else if (overallPct >= 55) overallGrade = "C";
    else if (overallPct >= 45) overallGrade = "D";

    res.json({
      student: { name: student.name, fatherName: student.parentName, class: student.class, section: student.section, rollNo: student.studentId, admissionNo: student.studentId, photo: student.photo },
      school: { name: school?.name || "Emblazers School", logoUrl: school?.logoUrl || null, branchName: branch?.name || "Main Branch", address: branch?.address || "", phone: branch?.phone || "" },
      exam: exam ? { name: exam.name, term: exam.term, startDate: exam.startDate, endDate: exam.endDate } : null,
      results: subjectResults,
      summary: { totalMaxMarks, totalObtained, overallPercentage: overallPct, overallGrade, passStatus: overallPct >= 45 ? "PASS" : "FAIL" },
      attendance: { totalDays, presentDays, percentage: attendancePercent },
      availableExams: allExams.map((e: any) => ({ id: e.id, name: e.name, term: e.term })),
    });
  }));

  // ============== ASSET MANAGEMENT ==============

  app.get("/api/assets/summary", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const assets = await db.select().from(assetsTable).where(eq(assetsTable.branchId, branchId));
    const byCategory: Record<string, { count: number; value: number }> = {};
    const byCondition: Record<string, number> = {};
    for (const a of assets) {
      if (!byCategory[a.category]) byCategory[a.category] = { count: 0, value: 0 };
      byCategory[a.category].count++;
      byCategory[a.category].value += a.currentValue || 0;
      byCondition[a.condition] = (byCondition[a.condition] || 0) + 1;
    }
    res.json({ totalAssets: assets.length, totalValue: assets.reduce((sum: number, a: any) => sum + (a.currentValue || 0), 0), byCategory, byCondition });
  }));

  app.get("/api/assets", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    let assets = await db.select().from(assetsTable).where(eq(assetsTable.branchId, branchId)).orderBy(desc(assetsTable.id));
    if (req.query.category) assets = assets.filter((a: any) => a.category === req.query.category);
    if (req.query.condition) assets = assets.filter((a: any) => a.condition === req.query.condition);
    if (req.query.search) {
      const s = (req.query.search as string).toLowerCase();
      assets = assets.filter((a: any) => a.assetName.toLowerCase().includes(s) || a.assetCode.toLowerCase().includes(s));
    }
    res.json({ total: assets.length, assets });
  }));

  app.post("/api/assets", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const body = req.body;
    const now = new Date().toISOString();
    let assetCode = body.assetCode;
    if (!assetCode) {
      const year = new Date().getFullYear();
      const catPrefix = (body.category || "OTH").substring(0, 3).toUpperCase();
      const countRow = await db.select({ cnt: count() }).from(assetsTable).where(eq(assetsTable.branchId, branchId));
      const nextId = (Number(countRow[0]?.cnt || 0) + 1).toString().padStart(4, "0");
      assetCode = `ASSET-${catPrefix}-${year}-${nextId}`;
    }
    const [asset] = await db.insert(assetsTable).values({ assetName: body.assetName, assetCode, category: body.category, purchaseDate: body.purchaseDate || null, purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null, currentValue: body.currentValue ? Number(body.currentValue) : null, condition: body.condition || "good", location: body.location || null, assignedTo: body.assignedTo || null, warrantyExpiry: body.warrantyExpiry || null, notes: body.notes || null, branchId, createdAt: now }).returning();
    await db.insert(notificationsTable).values({ type: "asset", title: "New Asset Added", message: `New asset added: ${body.assetName} (${assetCode})`, module: "finance", priority: "low", read: false, createdAt: now, branchId });
    res.status(201).json(asset);
  }));

  app.get("/api/assets/:id", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [asset] = await db.select().from(assetsTable).where(and(eq(assetsTable.id, Number(req.params.id)), eq(assetsTable.branchId, branchId)));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    const logs = await db.select().from(assetMaintenanceLogsTable).where(eq(assetMaintenanceLogsTable.assetId, asset.id)).orderBy(desc(assetMaintenanceLogsTable.id));
    res.json({ ...asset, maintenanceLogs: logs });
  }));

  app.patch("/api/assets/:id", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const body = req.body;
    const updateData: any = {};
    if (body.assetName !== undefined) updateData.assetName = body.assetName;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate;
    if (body.purchasePrice !== undefined) updateData.purchasePrice = body.purchasePrice ? Number(body.purchasePrice) : null;
    if (body.currentValue !== undefined) updateData.currentValue = body.currentValue ? Number(body.currentValue) : null;
    if (body.condition !== undefined) updateData.condition = body.condition;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.assignedTo !== undefined) updateData.assignedTo = body.assignedTo;
    if (body.warrantyExpiry !== undefined) updateData.warrantyExpiry = body.warrantyExpiry;
    if (body.notes !== undefined) updateData.notes = body.notes;
    const [updated] = await db.update(assetsTable).set(updateData).where(and(eq(assetsTable.id, Number(req.params.id)), eq(assetsTable.branchId, branchId))).returning();
    if (!updated) return res.status(404).json({ error: "Asset not found" });
    res.json(updated);
  }));

  app.delete("/api/assets/:id", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [asset] = await db.select().from(assetsTable).where(and(eq(assetsTable.id, Number(req.params.id)), eq(assetsTable.branchId, branchId)));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    await db.delete(assetMaintenanceLogsTable).where(eq(assetMaintenanceLogsTable.assetId, asset.id));
    await db.delete(assetsTable).where(eq(assetsTable.id, asset.id));
    res.json({ success: true });
  }));

  app.post("/api/assets/:id/maintenance", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const assetId = Number(req.params.id);
    const [asset] = await db.select().from(assetsTable).where(and(eq(assetsTable.id, assetId), eq(assetsTable.branchId, branchId)));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    const { maintenanceType, description, cost, performedAt, performedBy, nextMaintenanceDate, condition } = req.body;
    if (!maintenanceType || !description || !performedAt || !performedBy) return res.status(400).json({ error: "Missing required fields" });
    const now = new Date().toISOString();
    const [log] = await db.insert(assetMaintenanceLogsTable).values({ assetId, maintenanceType, description, cost: cost ? Number(cost) : null, performedAt, performedBy, nextMaintenanceDate: nextMaintenanceDate || null, branchId, createdAt: now }).returning();
    if (condition) await db.update(assetsTable).set({ condition }).where(eq(assetsTable.id, assetId));
    await db.insert(notificationsTable).values({ type: "asset_maintenance", title: "Asset Maintenance Logged", message: `Maintenance logged for ${asset.assetName}: ${maintenanceType}`, module: "finance", priority: "low", read: false, createdAt: now, branchId });
    res.status(201).json(log);
  }));

  app.get("/api/assets/:id/maintenance", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const logs = await db.select().from(assetMaintenanceLogsTable).where(and(eq(assetMaintenanceLogsTable.assetId, Number(req.params.id)), eq(assetMaintenanceLogsTable.branchId, branchId))).orderBy(desc(assetMaintenanceLogsTable.id));
    res.json(logs);
  }));

  // ============== HOMEWORK (admin/teacher CRUD) ==============

  app.get("/api/homework", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    let rows = await db.select().from(homeworkAssignmentsTable).where(eq(homeworkAssignmentsTable.branchId, branchId)).orderBy(desc(homeworkAssignmentsTable.id));
    if (req.query.className) rows = rows.filter((r: any) => r.className === req.query.className);
    if (req.query.sectionName) rows = rows.filter((r: any) => r.sectionName === req.query.sectionName);
    if (req.query.subjectName) rows = rows.filter((r: any) => r.subjectName === req.query.subjectName);
    const allStaff = await db.select({ id: staffTable.id, name: staffTable.name }).from(staffTable);
    const staffMap: Record<number, string> = {};
    for (const s of allStaff) staffMap[s.id] = s.name;
    const submissionCounts = await db.select({ homeworkId: homeworkSubmissionsTable.homeworkId, cnt: count() }).from(homeworkSubmissionsTable).groupBy(homeworkSubmissionsTable.homeworkId);
    const cntMap: Record<number, number> = {};
    for (const sc of submissionCounts) cntMap[sc.homeworkId] = Number(sc.cnt);
    res.json(rows.map((hw: any) => ({ ...hw, assignedByName: staffMap[hw.assignedByStaffId] || hw.assignedByName || "", submissionCount: cntMap[hw.id] || 0 })));
  }));

  app.post("/api/homework", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { title, description, subjectName, className, sectionName, assignedByStaffId, dueDate, attachmentUrl } = req.body;
    if (!title || !description || !subjectName || !className || !assignedByStaffId || !dueDate) return res.status(400).json({ error: "Missing required fields" });
    const [staff] = await db.select({ name: staffTable.name }).from(staffTable).where(eq(staffTable.id, Number(assignedByStaffId)));
    const now = new Date().toISOString();
    const [hw] = await db.insert(homeworkAssignmentsTable).values({ title, description, subjectName, className, sectionName: sectionName || null, assignedByStaffId: Number(assignedByStaffId), assignedByName: staff?.name || "", dueDate, attachmentUrl: attachmentUrl || null, branchId, createdAt: now }).returning();
    await db.insert(notificationsTable).values({ type: "homework", title: "New Homework Assigned", message: `New homework assigned: ${title} for Class ${className} due ${dueDate}`, module: "curriculum", priority: "medium", read: false, createdAt: now, branchId });
    res.status(201).json(hw);
  }));

  app.get("/api/homework/:id", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.id, Number(req.params.id)), eq(homeworkAssignmentsTable.branchId, branchId)));
    if (!hw) return res.status(404).json({ error: "Homework not found" });
    const submissions = await db.select().from(homeworkSubmissionsTable).where(eq(homeworkSubmissionsTable.homeworkId, hw.id)).orderBy(desc(homeworkSubmissionsTable.id));
    res.json({ ...hw, submissions, submissionCount: submissions.length });
  }));

  app.patch("/api/homework/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [updated] = await db.update(homeworkAssignmentsTable).set({ ...req.body }).where(and(eq(homeworkAssignmentsTable.id, Number(req.params.id)), eq(homeworkAssignmentsTable.branchId, branchId))).returning();
    if (!updated) return res.status(404).json({ error: "Homework not found" });
    res.json(updated);
  }));

  app.delete("/api/homework/:id", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.id, Number(req.params.id)), eq(homeworkAssignmentsTable.branchId, branchId)));
    if (!hw) return res.status(404).json({ error: "Homework not found" });
    await db.delete(homeworkSubmissionsTable).where(eq(homeworkSubmissionsTable.homeworkId, hw.id));
    await db.delete(homeworkAssignmentsTable).where(eq(homeworkAssignmentsTable.id, hw.id));
    res.json({ success: true });
  }));

  app.post("/api/homework/:id/submit", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const homeworkId = Number(req.params.id);
    const { studentId, studentName, submittedAt } = req.body;
    if (!studentId) return res.status(400).json({ error: "studentId required" });
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.id, homeworkId), eq(homeworkAssignmentsTable.branchId, branchId)));
    if (!hw) return res.status(404).json({ error: "Homework not found" });
    const [existing] = await db.select().from(homeworkSubmissionsTable).where(and(eq(homeworkSubmissionsTable.homeworkId, homeworkId), eq(homeworkSubmissionsTable.studentId, String(studentId))));
    if (existing) return res.status(400).json({ error: "Already submitted" });
    const submitTime = submittedAt || new Date().toISOString();
    const isLate = new Date(submitTime) > new Date(hw.dueDate);
    const now = new Date().toISOString();
    const [sub] = await db.insert(homeworkSubmissionsTable).values({ homeworkId, studentId: String(studentId), studentName: studentName || "", submittedAt: submitTime, status: isLate ? "late" : "submitted", grade: null, feedback: null, branchId, createdAt: now }).returning();
    res.status(201).json(sub);
  }));

  app.patch("/api/homework/submissions/:submissionId/grade", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const { grade, feedback, marks } = req.body;
    const now = new Date().toISOString();
    const user = (req as any).user;
    const gradedBy = user?.name || user?.email || null;
    const [updated] = await db.update(homeworkSubmissionsTable).set({ grade: grade ? String(grade) : null, marks: marks !== undefined ? String(marks) : null, feedback: feedback || null, status: "graded", gradedAt: now, gradedBy }).where(eq(homeworkSubmissionsTable.id, Number(req.params.submissionId))).returning();
    if (!updated) return res.status(404).json({ error: "Submission not found" });
    res.json(updated);
  }));

  app.get("/api/teacher/homework", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const rows = await db.select().from(homeworkAssignmentsTable).where(eq(homeworkAssignmentsTable.assignedByStaffId, Number(user.staffId))).orderBy(desc(homeworkAssignmentsTable.id));
    const submissionCounts = await db.select({ homeworkId: homeworkSubmissionsTable.homeworkId, cnt: count() }).from(homeworkSubmissionsTable).groupBy(homeworkSubmissionsTable.homeworkId);
    const cntMap: Record<number, number> = {};
    for (const sc of submissionCounts) cntMap[sc.homeworkId] = Number(sc.cnt);
    res.json(rows.map((hw: any) => ({ ...hw, submissionCount: cntMap[hw.id] || 0 })));
  }));

  app.post("/api/teacher/homework", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const branchId = user.branchId || 1;
    const { title, description, subjectName, className, sectionName, dueDate, attachmentUrl, submissionType, totalMarks } = req.body;
    if (!title || !description || !subjectName || !className || !dueDate) return res.status(400).json({ error: "Missing required fields" });
    // Verify teacher is assigned to this class+subject
    const teacherAssignments = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, String(user.staffId)), eq(teacherAssignmentsTable.isActive, true)));
    const isAssigned = teacherAssignments.some((a: any) => a.className === className && a.subject === subjectName);
    if (!isAssigned) return res.status(403).json({ error: "You are not assigned to this class/subject" });
    const [staff] = await db.select({ name: staffTable.name }).from(staffTable).where(eq(staffTable.id, Number(user.staffId)));
    const now = new Date().toISOString();
    const [hw] = await db.insert(homeworkAssignmentsTable).values({ title, description, subjectName, className, sectionName: sectionName || null, assignedByStaffId: Number(user.staffId), assignedByName: staff?.name || "", dueDate, attachmentUrl: attachmentUrl || null, submissionType: submissionType || "both", totalMarks: totalMarks ? Number(totalMarks) : null, status: "open", branchId, createdAt: now }).returning();
    await db.insert(notificationsTable).values({ type: "homework", title: "New Assignment", message: `New assignment: ${title} for ${className} — due ${dueDate}`, module: "curriculum", priority: "medium", read: false, createdAt: now, branchId });
    res.status(201).json(hw);
  }));

  app.patch("/api/teacher/homework/:id", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.id, Number(req.params.id)), eq(homeworkAssignmentsTable.assignedByStaffId, Number(user.staffId))));
    if (!hw) return res.status(404).json({ error: "Assignment not found or not yours" });
    const { title, description, subjectName, className, sectionName, dueDate, attachmentUrl, submissionType, totalMarks, status } = req.body;
    const [updated] = await db.update(homeworkAssignmentsTable).set({ title, description, subjectName, className, sectionName: sectionName || null, dueDate, attachmentUrl: attachmentUrl || null, submissionType: submissionType || hw.submissionType, totalMarks: totalMarks !== undefined ? Number(totalMarks) : hw.totalMarks, status: status || hw.status }).where(eq(homeworkAssignmentsTable.id, hw.id)).returning();
    res.json(updated);
  }));

  app.delete("/api/teacher/homework/:id", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.id, Number(req.params.id)), eq(homeworkAssignmentsTable.assignedByStaffId, Number(user.staffId))));
    if (!hw) return res.status(404).json({ error: "Assignment not found or not yours" });
    await db.delete(homeworkSubmissionsTable).where(eq(homeworkSubmissionsTable.homeworkId, hw.id));
    await db.delete(homeworkAssignmentsTable).where(eq(homeworkAssignmentsTable.id, hw.id));
    res.json({ success: true });
  }));

  app.get("/api/teacher/homework/:id/submissions", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const submissions = await db.select().from(homeworkSubmissionsTable).where(eq(homeworkSubmissionsTable.homeworkId, Number(req.params.id))).orderBy(desc(homeworkSubmissionsTable.id));
    res.json(submissions);
  }));

  // ============== BROADCAST ROUTES ==============

  app.post("/api/notifications/fee-broadcast", asyncHandler(async (req, res) => {
    const { moduleAuthMiddleware: mam } = await import("../middleware/module-auth");
    const { type, title, message, targetClass, targetSection, targetDefaulters, targetAll } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!type) return res.status(400).json({ error: "Notification type is required" });
    if (["announcement", "exam_notice"].includes(type)) return res.status(400).json({ error: "Use the Curriculum Admin broadcast for announcements and exam notices" });
    if (!targetAll && !targetClass && !targetDefaulters) return res.status(400).json({ error: "Please specify a target audience" });

    const branchId = getBranchId(req);
    const now = new Date().toISOString();
    let studentIds: string[] = [];

    if (targetDefaulters) {
      const conditions: any[] = [inArray(challansTable.status, ["Unpaid", "Partial"])];
      if (branchId) conditions.push(eq(challansTable.branchId, branchId));
      const rows = await db.select({ studentId: challansTable.studentId }).from(challansTable).where(and(...conditions));
      studentIds = [...new Set(rows.map(r => r.studentId))];
    } else if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    }

    if (studentIds.length === 0) return res.status(400).json({ error: "No students found for the selected audience" });
    const parentLinks = await db.select().from(parentStudentLinksTable).where(inArray(parentStudentLinksTable.studentId, studentIds));
    if (parentLinks.length === 0) return res.status(400).json({ error: "No linked parent accounts found for the selected students" });

    const uniqueParentIds = [...new Set(parentLinks.map(l => l.parentId))];
    const parentToStudent: Record<number, string> = {};
    for (const link of parentLinks) { if (!parentToStudent[link.parentId]) parentToStudent[link.parentId] = link.studentId; }

    await db.insert(parentNotificationsTable).values(uniqueParentIds.map(parentId => ({ parentId, studentId: parentToStudent[parentId] || null, type, title, body: message, isRead: false, createdAt: now, branchId: branchId || null })));

    const targetLabel = targetDefaulters ? "Defaulters Only" : targetAll ? "All Parents" : `Class ${targetClass}${targetSection ? ` – Section ${targetSection}` : ""}`;
    await db.insert(notificationsTable).values({ type: "broadcast", title: `Broadcast Sent: ${title}`, message: `Sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s). Target: ${targetLabel}`, module: "fee", priority: "medium", read: false, createdAt: now, branchId: branchId || null });
    res.json({ sent: uniqueParentIds.length, students: studentIds.length, message: `Broadcast sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s)` });
  }));

  app.get("/api/notifications/fee-broadcast-history", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const conditions: any[] = [eq(notificationsTable.type, "broadcast"), eq(notificationsTable.module, "fee")];
    if (branchId) conditions.push(eq(notificationsTable.branchId, branchId));
    res.json(await db.select().from(notificationsTable).where(and(...conditions)).orderBy(desc(notificationsTable.id)).limit(50));
  }));

  app.post("/api/notifications/fee-broadcast-preview", asyncHandler(async (req, res) => {
    const { targetClass, targetSection, targetDefaulters, targetAll } = req.body;
    const branchId = getBranchId(req);
    let studentIds: string[] = [];
    if (targetDefaulters) {
      const conditions: any[] = [inArray(challansTable.status, ["Unpaid", "Partial"])];
      if (branchId) conditions.push(eq(challansTable.branchId, branchId));
      studentIds = [...new Set((await db.select({ studentId: challansTable.studentId }).from(challansTable).where(and(...conditions))).map(r => r.studentId))];
    } else if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    }
    if (studentIds.length === 0) return res.json({ students: 0, parents: 0 });
    const parentLinks = await db.select({ parentId: parentStudentLinksTable.parentId }).from(parentStudentLinksTable).where(inArray(parentStudentLinksTable.studentId, studentIds));
    res.json({ students: studentIds.length, parents: new Set(parentLinks.map(l => l.parentId)).size });
  }));

  app.post("/api/notifications/general-broadcast", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const { type, title, message, targetClass, targetSection, targetAll } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!type) return res.status(400).json({ error: "Notification type is required" });
    if (!["announcement", "exam_notice"].includes(type)) return res.status(400).json({ error: "Only General Announcement and Exam Notice types are allowed here" });
    if (!targetAll && !targetClass) return res.status(400).json({ error: "Please specify a target audience" });

    const branchId = getBranchId(req);
    const now = new Date().toISOString();
    let studentIds: string[] = [];

    if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    }

    if (studentIds.length === 0) return res.status(400).json({ error: "No students found for the selected audience" });
    const parentLinks = await db.select().from(parentStudentLinksTable).where(inArray(parentStudentLinksTable.studentId, studentIds));
    if (parentLinks.length === 0) return res.status(400).json({ error: "No linked parent accounts found for the selected students" });

    const uniqueParentIds = [...new Set(parentLinks.map(l => l.parentId))];
    const parentToStudent: Record<number, string> = {};
    for (const link of parentLinks) { if (!parentToStudent[link.parentId]) parentToStudent[link.parentId] = link.studentId; }

    await db.insert(parentNotificationsTable).values(uniqueParentIds.map(parentId => ({ parentId, studentId: parentToStudent[parentId] || null, type, title, body: message, isRead: false, createdAt: now, branchId: branchId || null })));

    const targetLabel = targetAll ? "All Parents" : `Class ${targetClass}${targetSection ? ` – Section ${targetSection}` : ""}`;
    await db.insert(notificationsTable).values({ type: "broadcast", title: `Broadcast Sent: ${title}`, message: `Sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s). Target: ${targetLabel}`, module: "curriculum", priority: "medium", read: false, createdAt: now, branchId: branchId || null });
    res.json({ sent: uniqueParentIds.length, students: studentIds.length, message: `Broadcast sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s)` });
  }));

  app.get("/api/notifications/general-broadcast-history", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const conditions: any[] = [eq(notificationsTable.type, "broadcast"), eq(notificationsTable.module, "curriculum")];
    if (branchId) conditions.push(eq(notificationsTable.branchId, branchId));
    res.json(await db.select().from(notificationsTable).where(and(...conditions)).orderBy(desc(notificationsTable.id)).limit(50));
  }));

  // ============== TEACHER EXAM RESULT ROUTES ==============

  app.get("/api/teacher/exam-results", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const assignments = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, String(user.staffId)), eq(teacherAssignmentsTable.isActive, true)));
    if (assignments.length === 0) return res.json([]);
    const branchId = user.branchId || 1;
    const allResults = await db.select().from(examResultsTable).where(eq(examResultsTable.branchId, branchId)).orderBy(desc(examResultsTable.id));
    const assignedCombos = new Set(assignments.map((a: any) => `${a.className}|${a.subject}`));
    const filtered = allResults.filter((r: any) => assignedCombos.has(`${r.class}|${r.subject}`));
    res.json(filtered.map((r: any) => ({ ...r, id: String(r.id) })));
  }));

  app.post("/api/teacher/exam-results", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const { examId, className, section, subject, maxMarks, entries } = req.body;
    if (!examId || !className || !subject || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: "examId, className, subject, and entries are required" });
    }
    const assignments = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, String(user.staffId)), eq(teacherAssignmentsTable.isActive, true)));
    const isAssigned = assignments.some((a: any) => a.className === className && a.subject === subject);
    if (!isAssigned) return res.status(403).json({ error: "You are not assigned to this class/subject" });
    const [staff] = await db.select({ name: staffTable.name }).from(staffTable).where(eq(staffTable.id, Number(user.staffId)));
    const teacherName = staff?.name || user.staffName || "Teacher";
    const now = new Date().toISOString();
    const branchId = user.branchId || 1;
    let saved = 0, updated = 0;
    for (const entry of entries) {
      const { studentId, studentName, marksObtained, grade } = entry;
      const [existing] = await db.select().from(examResultsTable).where(and(
        eq(examResultsTable.examId, examId),
        eq(examResultsTable.studentId, studentId),
        eq(examResultsTable.class, className),
        eq(examResultsTable.subject, subject)
      ));
      if (existing) {
        await db.update(examResultsTable).set({
          marksObtained, maxMarks: maxMarks || existing.maxMarks, grade,
          status: existing.status === "verified" ? "edited" : "saved",
          enteredBy: teacherName, enteredAt: now,
        }).where(eq(examResultsTable.id, existing.id));
        updated++;
      } else {
        await db.insert(examResultsTable).values({
          examId, studentId, studentName, class: className, section: section || null, subject,
          marksObtained, maxMarks: maxMarks || 100, grade,
          status: "saved", enteredBy: teacherName, enteredAt: now, branchId,
        });
        saved++;
      }
    }
    res.json({ success: true, saved, updated });
  }));

  app.patch("/api/results/:id/verify", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const adminName = user?.name || user?.email || "Admin";
    const existing = await storage.getResult(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const result = await storage.updateResult(req.params.id, {
      status: "verified",
      verifiedBy: adminName,
      verifiedAt: new Date().toISOString(),
    });
    res.json(result);
  }));

  app.post("/api/notifications/general-broadcast-preview", requireCurriculumAdmin, asyncHandler(async (req, res) => {
    const { targetClass, targetSection, targetAll } = req.body;
    const branchId = getBranchId(req);
    let studentIds: string[] = [];
    if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      studentIds = (await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions))).map(r => r.studentId);
    }
    if (studentIds.length === 0) return res.json({ students: 0, parents: 0 });
    const parentLinks = await db.select({ parentId: parentStudentLinksTable.parentId }).from(parentStudentLinksTable).where(inArray(parentStudentLinksTable.studentId, studentIds));
    res.json({ students: studentIds.length, parents: new Set(parentLinks.map(l => l.parentId)).size });
  }));
}
