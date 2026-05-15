import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { db } from "../db";
import {
  asyncHandler,
  getBranchId,
  loginLimiter,
  passwordChangeLimiter,
} from "../lib/route-helpers";
import {
  studentPortalAccountsTable,
  teacherQuizzesTable,
  studentQuizAttemptsTable,
  teacherContentsTable,
  feeVouchersTable,
  attendanceRecordsTable,
  timetablesTable,
  teacherAssignmentsTable,
  idCardRequestsTable,
  examResultsTable,
} from "@shared/schema";
import { eq, and, desc, gte, lte, inArray, sql } from "drizzle-orm";

export function registerStudentPortalRoutes(app: Express) {
  app.post("/api/student-portal/login", loginLimiter, asyncHandler(async (req, res) => {
    const { studentId, password } = req.body;
    if (!studentId || !password) return res.status(400).json({ error: "Student ID and password are required" });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: "Server configuration error" });

    const [account] = await db.select().from(studentPortalAccountsTable).where(and(eq(studentPortalAccountsTable.studentId, studentId), eq(studentPortalAccountsTable.isActive, true)));
    if (!account) return res.status(401).json({ error: "Student portal account not found. Contact admin." });

    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });

    const isFirstLogin = account.isFirstLogin !== false;
    await db.update(studentPortalAccountsTable).set({ lastLogin: new Date().toISOString() }).where(eq(studentPortalAccountsTable.id, account.id));

    const token = jwt.sign(
      { userId: String(account.id), email: studentId, role: "student", module: "curriculum", studentId: account.studentId, studentName: account.studentName, className: account.className, section: account.section, branchId: account.branchId || 1, schoolId: 1 },
      jwtSecret,
      { expiresIn: "3d" }
    );

    return res.json({ success: true, token, module: "curriculum", user: { email: studentId, role: "student", name: account.studentName, studentId: account.studentId, className: account.className, section: account.section, isFirstLogin } });
  }));

  app.post("/api/student-portal/change-password", passwordChangeLimiter, asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current password and new password are required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters" });

    const [account] = await db.select().from(studentPortalAccountsTable).where(and(eq(studentPortalAccountsTable.studentId, user.studentId), eq(studentPortalAccountsTable.isActive, true)));
    if (!account) return res.status(404).json({ error: "Account not found" });

    const isValid = await bcrypt.compare(currentPassword, account.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Current password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(studentPortalAccountsTable).set({ passwordHash: newHash, isFirstLogin: false }).where(eq(studentPortalAccountsTable.id, account.id));

    return res.json({ success: true, message: "Password changed successfully" });
  }));

  app.get("/api/student-portal/dashboard", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const allStudents = await storage.getStudents();
    const studentProfile = allStudents.find(s => s.studentId === user.studentId);

    const now = new Date();
    const publishedQuizzes = await db.select().from(teacherQuizzesTable).where(and(eq(teacherQuizzesTable.className, user.className), eq(teacherQuizzesTable.section, user.section), eq(teacherQuizzesTable.isPublished, true)));
    const myAttempts = await db.select().from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.studentId, user.studentId));
    const attemptedQuizIds = new Set(myAttempts.map((a: any) => a.quizId));

    const activeQuizzesCount = publishedQuizzes.filter((q: any) => {
      const start = new Date(q.startDateTime);
      const end = new Date(q.endDateTime);
      return now >= start && now <= end && !attemptedQuizIds.has(String(q.id));
    }).length;

    let pendingFeesTotal = 0;
    try {
      const allVouchers = await db.select().from(feeVouchersTable).where(eq(feeVouchersTable.studentId, user.studentId));
      const unpaid = allVouchers.filter((v: any) => v.status !== "Paid" && v.status !== "paid");
      pendingFeesTotal = unpaid.reduce((sum: number, v: any) => sum + ((v.totalAmount || 0) - (v.paidAmount || 0)), 0);
    } catch { /* non-fatal */ }

    let thisMonthAttendance = 0;
    try {
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;
      const records = await db.select().from(attendanceRecordsTable).where(and(eq(attendanceRecordsTable.studentId, user.studentId), gte(attendanceRecordsTable.date, startOfMonth), lte(attendanceRecordsTable.date, endOfMonth)));
      const total = records.length;
      const present = records.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length;
      thisMonthAttendance = total > 0 ? Math.round((present / total) * 100) : 0;
    } catch { /* non-fatal */ }

    res.json({
      profile: studentProfile ? { name: studentProfile.name, studentId: studentProfile.studentId, class: studentProfile.class, section: studentProfile.section, dob: studentProfile.dob, parentName: studentProfile.parentName } : null,
      activeQuizzesCount,
      completedQuizzesCount: myAttempts.length,
      pendingFeesTotal,
      thisMonthAttendance,
    });
  }));

  app.get("/api/student-portal/content", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const docs = await db.select().from(teacherContentsTable).where(and(eq(teacherContentsTable.className, user.className), eq(teacherContentsTable.section, user.section), eq(teacherContentsTable.isPublished, true))).orderBy(desc(teacherContentsTable.id));

    const grouped: Record<string, any[]> = {};
    for (const d of docs) {
      const subject = d.subject || "General";
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push({ id: String(d.id), title: d.title, description: d.description, contentType: d.contentType, fileData: d.fileData, fileName: d.fileName, teacherName: d.teacherName, subject: d.subject, createdAt: d.createdAt });
    }

    res.json({ content: grouped, total: docs.length });
  }));

  app.get("/api/student-portal/quizzes", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const quizzes = await db.select().from(teacherQuizzesTable).where(and(eq(teacherQuizzesTable.className, user.className), eq(teacherQuizzesTable.section, user.section), eq(teacherQuizzesTable.isPublished, true))).orderBy(desc(teacherQuizzesTable.id));
    const myAttempts = await db.select().from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.studentId, user.studentId));
    const attemptMap = new Map(myAttempts.map((a: any) => [a.quizId, a]));
    const now = new Date();

    const result = quizzes.map((q: any) => {
      const start = new Date(q.startDateTime);
      const end = new Date(q.endDateTime);
      let status: "upcoming" | "active" | "expired" = "expired";
      if (now < start) status = "upcoming";
      else if (now >= start && now <= end) status = "active";
      const attempt = attemptMap.get(String(q.id));
      return {
        id: String(q.id), title: q.title, subject: q.subject, instructions: q.instructions,
        timeLimitMinutes: q.timeLimitMinutes, totalMarks: q.totalMarks, passingMarks: q.passingMarks,
        questionsCount: (q.questions as any[])?.length || 0, startDateTime: q.startDateTime,
        endDateTime: q.endDateTime, teacherName: q.teacherName, status, attempted: !!attempt,
        myResult: attempt ? { grade: attempt.grade, percentage: attempt.percentage, isPassed: attempt.isPassed, totalMarksObtained: attempt.totalMarksObtained } : null,
      };
    });

    res.json(result);
  }));

  app.get("/api/student-portal/quizzes/:id/start", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const quizId = parseInt(req.params.id, 10);
    const [quiz] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    if (!quiz.isPublished) return res.status(400).json({ error: "Quiz is not published" });

    const userBranchId = user.branchId || 1;
    if (quiz.branchId && quiz.branchId !== userBranchId) return res.status(403).json({ error: "Access denied" });
    if (quiz.className && quiz.className !== user.className) return res.status(403).json({ error: "This quiz is not assigned to your class" });
    if (quiz.section && quiz.section !== user.section) return res.status(403).json({ error: "This quiz is not assigned to your section" });

    const now = new Date();
    const start = new Date(quiz.startDateTime);
    const end = new Date(quiz.endDateTime);
    if (now < start) return res.status(400).json({ error: "Quiz has not started yet. Starts at " + start.toLocaleString() });
    if (now > end) return res.status(400).json({ error: "Quiz time slot has expired" });

    const [existing] = await db.select().from(studentQuizAttemptsTable).where(and(eq(studentQuizAttemptsTable.quizId, req.params.id), eq(studentQuizAttemptsTable.studentId, user.studentId)));
    if (existing) return res.status(400).json({ error: "Already submitted" });

    const questions = (quiz.questions as any[]) || [];
    const sanitizedQuestions = questions.map((q: any, idx: number) => ({
      questionIndex: idx, questionText: q.questionText, questionType: q.questionType, options: q.options || [], marks: q.marks,
    }));

    res.json({ id: String(quiz.id), title: quiz.title, subject: quiz.subject, instructions: quiz.instructions, timeLimitMinutes: quiz.timeLimitMinutes, totalMarks: quiz.totalMarks, passingMarks: quiz.passingMarks, questions: sanitizedQuestions, startDateTime: quiz.startDateTime, endDateTime: quiz.endDateTime });
  }));

  app.post("/api/student-portal/quizzes/:id/submit", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const quizId = parseInt(req.params.id, 10);
    const [quiz] = await db.select().from(teacherQuizzesTable).where(eq(teacherQuizzesTable.id, quizId));
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const userBranchId = user.branchId || 1;
    if (quiz.branchId && quiz.branchId !== userBranchId) return res.status(403).json({ error: "Access denied" });
    if (quiz.className && quiz.className !== user.className) return res.status(403).json({ error: "This quiz is not assigned to your class" });
    if (quiz.section && quiz.section !== user.section) return res.status(403).json({ error: "This quiz is not assigned to your section" });

    const [existing] = await db.select().from(studentQuizAttemptsTable).where(and(eq(studentQuizAttemptsTable.quizId, req.params.id), eq(studentQuizAttemptsTable.studentId, user.studentId)));
    if (existing) return res.status(400).json({ error: "Already submitted" });

    const now = new Date();
    if (now < new Date(quiz.startDateTime)) return res.status(400).json({ error: "Quiz has not started yet" });
    if (now > new Date(quiz.endDateTime)) return res.status(400).json({ error: "Quiz time slot has ended" });

    const { answers, timeTakenMinutes } = req.body;
    const quizQuestions = (quiz.questions as any[]) || [];

    const gradedAnswers = (answers || []).map((ans: any) => {
      const question = quizQuestions[ans.questionIndex];
      if (!question) return { ...ans, isCorrect: false, marksAwarded: 0 };
      if (question.questionType === "short") return { questionIndex: ans.questionIndex, givenAnswer: ans.givenAnswer || "", isCorrect: null, marksAwarded: 0 };
      const isCorrect = ans.givenAnswer?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase();
      return { questionIndex: ans.questionIndex, givenAnswer: ans.givenAnswer || "", isCorrect, marksAwarded: isCorrect ? question.marks : 0 };
    });

    const totalMarksObtained = gradedAnswers.reduce((sum: number, a: any) => sum + a.marksAwarded, 0);
    const percentage = quiz.totalMarks > 0 ? Math.round((totalMarksObtained / quiz.totalMarks) * 100) : 0;
    const isPassed = totalMarksObtained >= quiz.passingMarks;

    const { calculateGrade } = await import("../utils/grade");
    const grade = calculateGrade(percentage);

    const [doc] = await db.insert(studentQuizAttemptsTable).values({
      quizId: req.params.id, studentId: user.studentId, studentName: user.studentName || "Student",
      className: user.className, section: user.section, answers: gradedAnswers,
      totalMarksObtained, totalMarks: quiz.totalMarks, percentage, grade, isPassed,
      timeTakenMinutes: timeTakenMinutes || 0, submittedAt: new Date().toISOString(),
    }).returning();

    const detailedAnswers = gradedAnswers.map((ga: any) => {
      const question = quizQuestions[ga.questionIndex];
      return { questionText: question?.questionText || "", questionType: question?.questionType || "", givenAnswer: ga.givenAnswer, correctAnswer: question?.correctAnswer || "", isCorrect: ga.isCorrect, marks: question?.marks || 0, marksObtained: ga.marksAwarded, options: question?.options || [] };
    });

    res.status(201).json({ id: String(doc.id), totalMarksObtained, totalMarks: quiz.totalMarks, percentage, grade, isPassed, timeTakenMinutes: doc.timeTakenMinutes, answers: detailedAnswers });
  }));

  app.get("/api/student-portal/results", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const attempts = await db.select().from(studentQuizAttemptsTable).where(eq(studentQuizAttemptsTable.studentId, user.studentId)).orderBy(desc(studentQuizAttemptsTable.id));
    const quizIds = [...new Set(attempts.map((a: any) => a.quizId))];
    let quizMap = new Map<string, any>();

    if (quizIds.length > 0) {
      const quizIdNums = quizIds.map(id => parseInt(id, 10)).filter(n => !isNaN(n));
      if (quizIdNums.length > 0) {
        const quizzes = await db.select().from(teacherQuizzesTable).where(inArray(teacherQuizzesTable.id, quizIdNums));
        quizMap = new Map(quizzes.map((q: any) => [String(q.id), q]));
      }
    }

    const result = attempts.map((a: any) => {
      const quiz = quizMap.get(a.quizId);
      return { id: String(a.id), quizId: a.quizId, quizTitle: quiz?.title || "Unknown Quiz", subject: quiz?.subject || "", teacherName: quiz?.teacherName || "", totalMarksObtained: a.totalMarksObtained, totalMarks: a.totalMarks, percentage: a.percentage, grade: a.grade, isPassed: a.isPassed, timeTakenMinutes: a.timeTakenMinutes, submittedAt: a.submittedAt };
    });

    res.json(result);
  }));

  app.get("/api/student-portal/fees", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    try {
      const vouchers = await db.select().from(feeVouchersTable).where(eq(feeVouchersTable.studentId, user.studentId)).orderBy(desc(feeVouchersTable.id));
      res.json(vouchers.map((v: any) => ({ id: String(v.id), month: v.month, totalAmount: v.totalAmount, paidAmount: v.paidAmount || 0, dueDate: v.dueDate, status: v.status })));
    } catch {
      res.json([]);
    }
  }));

  app.get("/api/student-portal/attendance", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    try {
      const records = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.studentId, user.studentId)).orderBy(desc(attendanceRecordsTable.date));
      const monthlyMap: Record<string, { present: number; absent: number; total: number }> = {};
      for (const r of records) {
        const d = new Date(r.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthlyMap[key]) monthlyMap[key] = { present: 0, absent: 0, total: 0 };
        monthlyMap[key].total++;
        if (r.status?.toUpperCase() === "PRESENT") monthlyMap[key].present++;
        else monthlyMap[key].absent++;
      }
      const result = Object.entries(monthlyMap).map(([month, data]) => ({ month, presentDays: data.present, absentDays: data.absent, percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0 })).sort((a, b) => b.month.localeCompare(a.month));
      res.json(result);
    } catch {
      res.json([]);
    }
  }));

  app.get("/api/student-portal/timetable", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.className) return res.status(401).json({ error: "Not authenticated as student" });
    const branchId = user.branchId || getBranchId(req);
    const rows = await db.select().from(timetablesTable).where(
      and(
        eq(timetablesTable.class, user.className),
        user.section ? eq(timetablesTable.section, user.section) : sql`1=1`,
        branchId ? eq(timetablesTable.branchId, branchId) : sql`1=1`,
      )
    );
    res.json(rows.map((r: any) => ({ ...r, id: String(r.id) })));
  }));

  app.get("/api/teacher/timetable", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const staffId = user?.staffId;
    if (!staffId) return res.status(401).json({ error: "Not authenticated as teacher" });
    const branchId = user.branchId || getBranchId(req);
    const assignments = await db.select().from(teacherAssignmentsTable).where(and(eq(teacherAssignmentsTable.staffId, staffId), eq(teacherAssignmentsTable.isActive, true)));
    if (assignments.length === 0) return res.json([]);
    const classesWithSections = assignments.map((a: any) => ({ class: a.className, section: a.section }));
    const results = await Promise.all(
      classesWithSections.map(async ({ class: cls, section }: { class: string; section: string }) => {
        const rows = await db.select().from(timetablesTable).where(
          and(eq(timetablesTable.class, cls), section ? eq(timetablesTable.section, section) : sql`1=1`, branchId ? eq(timetablesTable.branchId, branchId) : sql`1=1`)
        );
        return rows.map((r: any) => ({ ...r, id: String(r.id) }));
      })
    );
    res.json(results.flat());
  }));

  app.get("/api/student-portal/id-card/status", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [existing] = await db.select().from(idCardRequestsTable).where(and(eq(idCardRequestsTable.studentId, user.studentId), gte(idCardRequestsTable.generatedAt, monthStart), lte(idCardRequestsTable.generatedAt, monthEnd)));

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextAvailableDate = nextMonth.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    return res.json({ canGenerate: !existing, lastGeneratedAt: existing ? existing.generatedAt.toISOString() : null, nextAvailableDate: existing ? nextAvailableDate : null });
  }));

  app.post("/api/student-portal/id-card/generate", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [existing] = await db.select().from(idCardRequestsTable).where(and(eq(idCardRequestsTable.studentId, user.studentId), gte(idCardRequestsTable.generatedAt, monthStart), lte(idCardRequestsTable.generatedAt, monthEnd)));

    if (existing) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextAvailableDate = nextMonth.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      return res.status(429).json({ error: "duplicate_request", message: `You have already generated your ID card this month. You can generate again on ${nextAvailableDate}.`, nextAvailableDate });
    }

    const allStudents = await storage.getStudents();
    const studentProfile = allStudents.find(s => s.studentId === user.studentId);

    await db.insert(idCardRequestsTable).values({ studentId: user.studentId, generatedAt: now, branchId: user.branchId || null });

    return res.json({ success: true, studentId: user.studentId, name: user.studentName, className: user.className, section: user.section, photo: studentProfile?.photo || null, branchId: user.branchId, generatedAt: now.toISOString() });
  }));

  app.get("/api/student-portal/homework", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });
    const { homeworkAssignmentsTable, homeworkSubmissionsTable } = await import("@shared/schema");
    const branchId = user.branchId || 1;
    const allHw = await db.select().from(homeworkAssignmentsTable).where(and(eq(homeworkAssignmentsTable.branchId, branchId), eq(homeworkAssignmentsTable.className, user.className || ""))).orderBy(desc(homeworkAssignmentsTable.id));
    const mySubmissions = await db.select().from(homeworkSubmissionsTable).where(eq(homeworkSubmissionsTable.studentId, user.studentId));
    const subMap: Record<number, any> = {};
    for (const s of mySubmissions) subMap[s.homeworkId] = s;
    const result = allHw.map((hw: any) => {
      const sub = subMap[hw.id];
      return {
        ...hw,
        submissionStatus: sub ? sub.status : "not_submitted",
        submissionGrade: sub?.grade || null,
        submissionMarks: sub?.marks || null,
        submissionFeedback: sub?.feedback || null,
        submissionAnswerText: sub?.answerText || null,
        submissionFileUrl: sub?.submittedFileUrl || null,
        submissionAt: sub?.submittedAt || null,
      };
    });
    res.json(result);
  }));

  app.get("/api/student-portal/exam-results", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });
    try {
      const results = await db.select().from(examResultsTable).where(eq(examResultsTable.studentId, user.studentId)).orderBy(desc(examResultsTable.id));
      res.json(results.map((r: any) => ({ ...r, id: String(r.id) })));
    } catch {
      res.json([]);
    }
  }));

  app.post("/api/student-portal/homework/:id/submit", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.studentId) return res.status(401).json({ error: "Not authenticated as student" });
    const { homeworkAssignmentsTable, homeworkSubmissionsTable } = await import("@shared/schema");
    const branchId = user.branchId || 1;
    const homeworkId = Number(req.params.id);
    const [hw] = await db.select().from(homeworkAssignmentsTable).where(eq(homeworkAssignmentsTable.id, homeworkId));
    if (!hw) return res.status(404).json({ error: "Homework not found" });
    if (hw.branchId && hw.branchId !== branchId) return res.status(403).json({ error: "Access denied" });
    if (hw.className && hw.className !== user.className) return res.status(403).json({ error: "This assignment is not assigned to your class" });
    if (hw.sectionName && hw.sectionName !== user.section) return res.status(403).json({ error: "This assignment is not assigned to your section" });
    if (hw.status === "closed") return res.status(400).json({ error: "Assignment is closed" });
    const now = new Date().toISOString();
    const isPastDeadline = new Date(now) > new Date(hw.dueDate);
    if (isPastDeadline) return res.status(400).json({ error: "Deadline has passed. Submission is closed." });
    const [existing] = await db.select().from(homeworkSubmissionsTable).where(and(eq(homeworkSubmissionsTable.homeworkId, homeworkId), eq(homeworkSubmissionsTable.studentId, user.studentId)));
    if (existing) return res.status(400).json({ error: "Already submitted" });
    const { answerText, submittedFileUrl } = req.body;
    const submissionType = hw.submissionType || "both";
    if ((submissionType === "text" || submissionType === "both") && !answerText?.trim()) {
      return res.status(400).json({ error: "Text answer is required for this assignment" });
    }
    if (submissionType === "file" && !submittedFileUrl?.trim()) {
      return res.status(400).json({ error: "File upload is required for this assignment" });
    }
    const isLateNum = 0;
    const status = "submitted";
    const [sub] = await db.insert(homeworkSubmissionsTable).values({ homeworkId, studentId: user.studentId, studentName: user.studentName || "", submittedAt: now, status, answerText: answerText?.trim() || null, submittedFileUrl: submittedFileUrl?.trim() || null, isLate: isLateNum, grade: null, marks: null, feedback: null, gradedAt: null, gradedBy: null, branchId, createdAt: now }).returning();
    res.status(201).json(sub);
  }));
}
