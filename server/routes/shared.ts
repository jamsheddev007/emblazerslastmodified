import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "../storage";
import { db } from "../db";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import { clients, broadcastNotification } from "../lib/websocket";
import {
  insertNotificationSchema,
  insertActivityLogSchema,
  insertStudentSchema,
  insertFeeVoucherSchema,
  insertResultSchema,
  notificationsTable,
  parentNotificationsTable,
  parentStudentLinksTable,
  studentsTable,
  challansTable,
} from "@shared/schema";
import { moduleAuthMiddleware } from "../middleware/module-auth";
import { eq, and, desc, inArray } from "drizzle-orm";

export function registerSharedRoutes(app: Express) {
  app.get("/api/notifications", asyncHandler(async (req, res) => {
    const module = req.query.module as string | undefined;
    const notifications = filterByBranch(await storage.getNotifications(module), getBranchId(req));
    res.json(notifications);
  }));

  app.get("/api/notifications/unread-count", asyncHandler(async (req, res) => {
    const module = req.query.module as string | undefined;
    const allNotifications = filterByBranch(await storage.getNotifications(module), getBranchId(req));
    const count = allNotifications.filter((n: any) => !n.isRead).length;
    res.json({ count });
  }));

  app.post("/api/notifications", asyncHandler(async (req, res) => {
    const parsed = insertNotificationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const notification = await storage.createNotification({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    broadcastNotification(notification);
    res.status(201).json(notification);
  }));

  app.patch("/api/notifications/:id/read", asyncHandler(async (req, res) => {
    const existing = await storage.getNotification(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const notification = await storage.markNotificationRead(req.params.id);
    if (!notification) return res.status(404).json({ error: "Not found" });
    res.json(notification);
  }));

  app.patch("/api/notifications/mark-all-read", asyncHandler(async (req, res) => {
    const module = req.query.module as string | undefined;
    await storage.markAllNotificationsRead(module);
    res.json({ success: true });
  }));

  app.delete("/api/notifications/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getNotification(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteNotification(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/activity-logs", asyncHandler(async (req, res) => {
    const module = req.query.module as string | undefined;
    const logs = filterByBranch(await storage.getActivityLogs(module), getBranchId(req));
    res.json(logs);
  }));

  app.post("/api/activity-logs", asyncHandler(async (req, res) => {
    const parsed = insertActivityLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const log = await storage.createActivityLog({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req), ipAddress });
    res.status(201).json(log);
  }));

  const MAX_BULK_SIZE = 500;

  app.post("/api/bulk/students", asyncHandler(async (req, res) => {
    const { students } = req.body;
    if (!Array.isArray(students)) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: "Students array required" }] });
    }
    if (students.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: `Maximum ${MAX_BULK_SIZE} records per batch` }] });
    }

    const branchId = getBranchId(req);
    const schoolId = getSchoolId(req);
    const results = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };
    const validGenders = ["Male", "Female", "Other"];
    const validStatuses = ["Active", "Inactive", "Alumni", "Left"];

    for (let i = 0; i < students.length; i++) {
      let normalizedGender = students[i].gender;
      if (typeof normalizedGender === "string") {
        const genderLower = normalizedGender.trim().toLowerCase();
        const matchedGender = validGenders.find(g => g.toLowerCase() === genderLower);
        normalizedGender = matchedGender || normalizedGender;
      }
      let normalizedStatus = students[i].status || "Active";
      if (typeof normalizedStatus === "string") {
        const statusLower = normalizedStatus.trim().toLowerCase();
        const matchedStatus = validStatuses.find(s => s.toLowerCase() === statusLower);
        normalizedStatus = matchedStatus || normalizedStatus;
      }
      const studentData = { ...students[i], gender: normalizedGender, status: normalizedStatus };
      const parsed = insertStudentSchema.safeParse(studentData);
      if (!parsed.success) {
        results.failed++;
        results.errors.push({ row: i + 1, message: parsed.error.errors.map(e => e.message).join(", ") });
      } else {
        try {
          await storage.createStudent({ ...parsed.data, branchId, schoolId });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ row: i + 1, message: String(err) });
        }
      }
    }
    res.json(results);
  }));

  app.post("/api/bulk/fee-vouchers", asyncHandler(async (req, res) => {
    const { vouchers } = req.body;
    if (!Array.isArray(vouchers)) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: "Vouchers array required" }] });
    }
    if (vouchers.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: `Maximum ${MAX_BULK_SIZE} records per batch` }] });
    }
    const branchId = getBranchId(req);
    const schoolId = getSchoolId(req);
    const results = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };

    for (let i = 0; i < vouchers.length; i++) {
      const v = vouchers[i];
      const feeHeads = [];
      if (v.tuitionFee) feeHeads.push({ name: "Tuition Fee", amount: Number(v.tuitionFee) });
      if (v.transportFee) feeHeads.push({ name: "Transport Fee", amount: Number(v.transportFee) });
      if (v.otherFee) feeHeads.push({ name: "Other Fee", amount: Number(v.otherFee) });
      const totalAmount = feeHeads.reduce((sum, h) => sum + h.amount, 0);
      const discount = Number(v.discount) || 0;
      const netAmount = totalAmount - discount;
      const voucherData = {
        voucherId: `BV${Date.now()}${i}`,
        studentId: v.studentId,
        studentName: v.studentName,
        class: v.class,
        section: v.section,
        month: v.month,
        feeHeads,
        totalAmount,
        discount,
        fine: 0,
        netAmount,
        paidAmount: 0,
        dueDate: v.dueDate,
        status: "Unpaid" as const,
        paymentHistory: [],
      };
      const parsed = insertFeeVoucherSchema.safeParse(voucherData);
      if (!parsed.success) {
        results.failed++;
        results.errors.push({ row: i + 1, message: parsed.error.errors.map(e => e.message).join(", ") });
      } else {
        try {
          await storage.createFeeVoucher({ ...parsed.data, branchId, schoolId });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ row: i + 1, message: String(err) });
        }
      }
    }
    res.json(results);
  }));

  app.post("/api/bulk/results", asyncHandler(async (req, res) => {
    const { results: resultData, examId } = req.body;
    if (!Array.isArray(resultData) || !examId) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: "Results array and examId required" }] });
    }
    if (resultData.length > MAX_BULK_SIZE) {
      return res.status(400).json({ success: 0, failed: 0, errors: [{ row: 0, message: `Maximum ${MAX_BULK_SIZE} records per batch` }] });
    }
    const results = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };
    for (let i = 0; i < resultData.length; i++) {
      const marksObtained = resultData[i].marksObtained;
      const maxMarks = resultData[i].maxMarks;
      const parsedMarks = marksObtained !== undefined && marksObtained !== "" ? Number(marksObtained) : 0;
      const parsedMaxMarks = maxMarks !== undefined && maxMarks !== "" ? Number(maxMarks) : 100;
      const data = {
        ...resultData[i],
        examId,
        marksObtained: isNaN(parsedMarks) ? 0 : parsedMarks,
        maxMarks: isNaN(parsedMaxMarks) ? 100 : parsedMaxMarks,
      };
      const parsed = insertResultSchema.safeParse(data);
      if (!parsed.success) {
        results.failed++;
        results.errors.push({ row: i + 1, message: parsed.error.errors.map(e => e.message).join(", ") });
      } else {
        try {
          await storage.createResult({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ row: i + 1, message: String(err) });
        }
      }
    }
    res.json(results);
  }));

  app.post("/api/notifications/fee-broadcast", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const { type, title, message, targetClass, targetSection, targetDefaulters, targetAll } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!type) return res.status(400).json({ error: "Notification type is required" });
    if (["announcement", "exam_notice"].includes(type)) {
      return res.status(400).json({ error: "Use the Curriculum Admin broadcast for announcements and exam notices" });
    }
    if (!targetAll && !targetClass && !targetDefaulters) {
      return res.status(400).json({ error: "Please specify a target audience" });
    }

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
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    }

    if (studentIds.length === 0) {
      return res.status(400).json({ error: "No students found for the selected audience" });
    }

    const parentLinks = await db.select().from(parentStudentLinksTable)
      .where(inArray(parentStudentLinksTable.studentId, studentIds));

    if (parentLinks.length === 0) {
      return res.status(400).json({ error: "No linked parent accounts found for the selected students" });
    }

    const uniqueParentIds = [...new Set(parentLinks.map(l => l.parentId))];
    const parentToStudent: Record<number, string> = {};
    for (const link of parentLinks) {
      if (!parentToStudent[link.parentId]) parentToStudent[link.parentId] = link.studentId;
    }

    await db.insert(parentNotificationsTable).values(
      uniqueParentIds.map(parentId => ({
        parentId,
        studentId: parentToStudent[parentId] || null,
        type,
        title,
        body: message,
        isRead: false,
        createdAt: now,
        branchId: branchId || null,
      }))
    );

    const targetLabel = targetDefaulters
      ? "Defaulters Only"
      : targetAll
      ? "All Parents"
      : `Class ${targetClass}${targetSection ? ` – Section ${targetSection}` : ""}`;

    await db.insert(notificationsTable).values({
      type: "broadcast",
      title: `Broadcast Sent: ${title}`,
      message: `Sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s). Target: ${targetLabel}`,
      module: "fee",
      priority: "medium",
      read: false,
      createdAt: now,
      branchId: branchId || null,
    });

    res.json({
      sent: uniqueParentIds.length,
      students: studentIds.length,
      message: `Broadcast sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s)`,
    });
  }));

  app.get("/api/notifications/fee-broadcast-history", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const conditions: any[] = [eq(notificationsTable.type, "broadcast"), eq(notificationsTable.module, "fee")];
    if (branchId) conditions.push(eq(notificationsTable.branchId, branchId));
    const history = await db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.id))
      .limit(50);
    res.json(history);
  }));

  app.post("/api/notifications/fee-broadcast-preview", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const { targetClass, targetSection, targetDefaulters, targetAll } = req.body;
    const branchId = getBranchId(req);
    let studentIds: string[] = [];

    if (targetDefaulters) {
      const conditions: any[] = [inArray(challansTable.status, ["Unpaid", "Partial"])];
      if (branchId) conditions.push(eq(challansTable.branchId, branchId));
      const rows = await db.select({ studentId: challansTable.studentId }).from(challansTable).where(and(...conditions));
      studentIds = [...new Set(rows.map(r => r.studentId))];
    } else if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    }

    if (studentIds.length === 0) return res.json({ students: 0, parents: 0 });

    const parentLinks = await db.select({ parentId: parentStudentLinksTable.parentId })
      .from(parentStudentLinksTable)
      .where(inArray(parentStudentLinksTable.studentId, studentIds));

    const uniqueParents = new Set(parentLinks.map(l => l.parentId)).size;
    res.json({ students: studentIds.length, parents: uniqueParents });
  }));

  app.post("/api/notifications/general-broadcast", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const { type, title, message, targetClass, targetSection, targetAll } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!message?.trim()) return res.status(400).json({ error: "Message is required" });
    if (!type) return res.status(400).json({ error: "Notification type is required" });
    if (!["announcement", "exam_notice"].includes(type)) {
      return res.status(400).json({ error: "Only General Announcement and Exam Notice types are allowed here" });
    }
    if (!targetAll && !targetClass) {
      return res.status(400).json({ error: "Please specify a target audience" });
    }

    const branchId = getBranchId(req);
    const now = new Date().toISOString();
    let studentIds: string[] = [];

    if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    }

    if (studentIds.length === 0) {
      return res.status(400).json({ error: "No students found for the selected audience" });
    }

    const parentLinks = await db.select().from(parentStudentLinksTable)
      .where(inArray(parentStudentLinksTable.studentId, studentIds));

    if (parentLinks.length === 0) {
      return res.status(400).json({ error: "No linked parent accounts found for the selected students" });
    }

    const uniqueParentIds = [...new Set(parentLinks.map(l => l.parentId))];
    const parentToStudent: Record<number, string> = {};
    for (const link of parentLinks) {
      if (!parentToStudent[link.parentId]) parentToStudent[link.parentId] = link.studentId;
    }

    await db.insert(parentNotificationsTable).values(
      uniqueParentIds.map(parentId => ({
        parentId,
        studentId: parentToStudent[parentId] || null,
        type,
        title,
        body: message,
        isRead: false,
        createdAt: now,
        branchId: branchId || null,
      }))
    );

    const targetLabel = targetAll
      ? "All Parents"
      : `Class ${targetClass}${targetSection ? ` – Section ${targetSection}` : ""}`;

    await db.insert(notificationsTable).values({
      type: "broadcast",
      title: `Broadcast Sent: ${title}`,
      message: `Sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s). Target: ${targetLabel}`,
      module: "curriculum",
      priority: "medium",
      read: false,
      createdAt: now,
      branchId: branchId || null,
    });

    res.json({
      sent: uniqueParentIds.length,
      students: studentIds.length,
      message: `Broadcast sent to ${uniqueParentIds.length} parent(s) for ${studentIds.length} student(s)`,
    });
  }));

  app.get("/api/notifications/general-broadcast-history", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const conditions: any[] = [eq(notificationsTable.type, "broadcast"), eq(notificationsTable.module, "curriculum")];
    if (branchId) conditions.push(eq(notificationsTable.branchId, branchId));
    const history = await db.select().from(notificationsTable)
      .where(and(...conditions))
      .orderBy(desc(notificationsTable.id))
      .limit(50);
    res.json(history);
  }));

  app.post("/api/notifications/general-broadcast-preview", moduleAuthMiddleware, asyncHandler(async (req, res) => {
    const { targetClass, targetSection, targetAll } = req.body;
    const branchId = getBranchId(req);
    let studentIds: string[] = [];

    if (targetAll) {
      const conditions: any[] = [eq(studentsTable.status, "Active")];
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    } else if (targetClass) {
      const conditions: any[] = [eq(studentsTable.class, targetClass), eq(studentsTable.status, "Active")];
      if (targetSection) conditions.push(eq(studentsTable.section, targetSection));
      if (branchId) conditions.push(eq(studentsTable.branchId, branchId));
      const rows = await db.select({ studentId: studentsTable.studentId }).from(studentsTable).where(and(...conditions));
      studentIds = rows.map(r => r.studentId);
    }

    if (studentIds.length === 0) return res.json({ students: 0, parents: 0 });

    const parentLinks = await db.select({ parentId: parentStudentLinksTable.parentId })
      .from(parentStudentLinksTable)
      .where(inArray(parentStudentLinksTable.studentId, studentIds));

    const uniqueParents = new Set(parentLinks.map(l => l.parentId)).size;
    res.json({ students: studentIds.length, parents: uniqueParents });
  }));
}

export function setupWebSocket(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    clients.add(ws);
    ws.on("close", () => clients.delete(ws));
    ws.on("error", () => clients.delete(ws));
  });
}
