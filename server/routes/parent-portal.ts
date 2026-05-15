import type { Express } from "express";
import { db } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import {
  asyncHandler,
  getBranchId,
} from "../lib/route-helpers";
import {
  parentAccountsTable,
  parentStudentLinksTable,
  parentMessagesTable,
  parentNotificationsTable,
  studentsTable,
  challansTable,
  attendanceRecordsTable,
  examResultsTable,
  messagesTable,
  notificationsTable,
} from "@shared/schema";
import { eq, and, desc, inArray, gte } from "drizzle-orm";

const parentLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Bohat zyada attempts. 15 minute baad try karein." },
});

const parentPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Bohat zyada attempts." },
});

function verifyParent(req: any, res: any, next: any) {
  const user = req.user;
  if (!user || user.role !== "parent") {
    return res.status(403).json({ error: "Parent access required" });
  }
  next();
}

async function verifyParentOwnsStudent(parentId: number, studentId: string): Promise<boolean> {
  const links = await db.select().from(parentStudentLinksTable)
    .where(and(eq(parentStudentLinksTable.parentId, parentId), eq(parentStudentLinksTable.studentId, studentId)));
  return links.length > 0;
}

function requireAdmin(req: any, res: any, next: any) {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function registerParentPortalRoutes(app: Express) {
  app.post("/api/parent/login", parentLoginLimiter, asyncHandler(async (req, res) => {
    const { cnic, password } = req.body;
    if (!cnic || !password) return res.status(400).json({ error: "CNIC aur password zaruri hain" });

    const normalizedInput = cnic.replace(/-/g, "");
    const allParents = await db.select().from(parentAccountsTable);
    const parent = allParents.find(p => p.cnic.replace(/-/g, "") === normalizedInput);
    if (!parent) return res.status(401).json({ error: "Account nahi mila" });
    if (!parent.isActive) return res.status(401).json({ error: "Account ghair-fa'al hai" });

    const valid = await bcrypt.compare(password, parent.passwordHash);
    if (!valid) return res.status(401).json({ error: "Password galat hai" });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: "Server configuration error" });

    const token = jwt.sign(
      { userId: String(parent.id), role: "parent", module: "parent", cnic: parent.cnic, branchId: parent.branchId || 1, schoolId: 1 },
      jwtSecret,
      { expiresIn: "3d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: parent.id,
        cnic: parent.cnic,
        fullName: parent.fullName,
        phone: parent.phone,
        isFirstLogin: parent.isFirstLogin,
      },
    });
  }));

  app.get("/api/parent/children", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const links = await db.select().from(parentStudentLinksTable).where(eq(parentStudentLinksTable.parentId, parentId));
    if (links.length === 0) return res.json([]);

    const studentIds = links.map(l => l.studentId);
    const students = await db.select().from(studentsTable).where(inArray(studentsTable.studentId, studentIds));

    const result = students.map(s => {
      const link = links.find(l => l.studentId === s.studentId);
      return {
        studentId: s.studentId,
        name: s.name,
        class: s.class,
        section: s.section,
        status: s.status,
        photo: s.photo,
        relation: link?.relation || "Parent",
      };
    });
    res.json(result);
  }));

  app.get("/api/parent/dashboard/:studentId", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const { studentId } = req.params;

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns) return res.status(403).json({ error: "Access denied" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const [challans, attendance, results] = await Promise.all([
      db.select().from(challansTable).where(eq(challansTable.studentId, studentId)).orderBy(desc(challansTable.id)).limit(5),
      db.select().from(attendanceRecordsTable).where(
        and(
          eq(attendanceRecordsTable.studentId, studentId),
          gte(attendanceRecordsTable.date, thirtyDaysAgoStr)
        )
      ),
      db.select().from(examResultsTable).where(eq(examResultsTable.studentId, studentId)).orderBy(desc(examResultsTable.id)).limit(5),
    ]);

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status?.toUpperCase() === "PRESENT").length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      fee: challans,
      attendance: { records: attendance, totalDays, presentDays, percentage: attendancePercentage },
      results,
    });
  }));

  app.get("/api/parent/messages/inbox", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const msgs = await db.select().from(messagesTable).where(
      and(eq(messagesTable.receiverId, parentId), eq(messagesTable.receiverRole, "parent"))
    ).orderBy(desc(messagesTable.id));
    res.json(msgs);
  }));

  app.post("/api/parent/messages/send", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const branchId = getBranchId(req);
    const [parentAccount] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, parentId));
    const senderName = parentAccount?.fullName || `Parent #${parentId}`;
    const { receiverId, receiverRole, subject, body, studentId } = req.body;
    if (!receiverId || !receiverRole || !subject || !body) return res.status(400).json({ error: "receiverId, receiverRole, subject, body required" });
    const now = new Date().toISOString();
    const [msg] = await db.insert(messagesTable).values({
      senderId: parentId, senderRole: "parent", senderName, receiverId: parseInt(String(receiverId)),
      receiverRole, subject, body, isRead: false, parentId, studentId: studentId ? parseInt(String(studentId)) : null, branchId, createdAt: now
    }).returning();
    try {
      await db.insert(notificationsTable).values({
        type: "message", title: "New Message from Parent",
        message: `New message from ${senderName}: ${subject}`, module: "hr",
        priority: "medium", read: false, createdAt: now, branchId
      });
    } catch { /* non-fatal */ }
    res.json(msg);
  }));

  app.get("/api/parent/messages/:studentId", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const { studentId } = req.params;

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns) return res.status(403).json({ error: "Access denied" });

    const messages = await db.select().from(parentMessagesTable)
      .where(eq(parentMessagesTable.studentId, studentId))
      .orderBy(parentMessagesTable.createdAt);
    res.json(messages);
  }));

  app.post("/api/parent/messages", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const { studentId, receiverId, message } = req.body;
    if (!studentId || !receiverId || !message) return res.status(400).json({ error: "Missing required fields" });

    const owns = await verifyParentOwnsStudent(parentId, studentId);
    if (!owns) return res.status(403).json({ error: "Access denied" });

    const [msg] = await db.insert(parentMessagesTable).values({
      senderRole: "parent",
      senderId: String(parentId),
      receiverId: "school",
      studentId,
      message,
      createdAt: new Date().toISOString(),
    }).returning();

    res.json(msg);
  }));

  app.get("/api/parent/notifications", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const notifications = await db.select().from(parentNotificationsTable)
      .where(eq(parentNotificationsTable.parentId, parentId))
      .orderBy(desc(parentNotificationsTable.id))
      .limit(20);
    res.json(notifications);
  }));

  app.patch("/api/parent/notifications/:id/read", verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const notifId = parseInt(req.params.id);
    const [updated] = await db.update(parentNotificationsTable)
      .set({ isRead: true })
      .where(and(eq(parentNotificationsTable.id, notifId), eq(parentNotificationsTable.parentId, parentId)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Notification not found" });
    res.json(updated);
  }));

  app.post("/api/parent/change-password", parentPasswordLimiter, verifyParent, asyncHandler(async (req, res) => {
    const parentId = parseInt(req.user.userId);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password required" });
    if (newPassword.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

    const [parent] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, parentId));
    if (!parent) return res.status(404).json({ error: "Account not found" });

    const valid = await bcrypt.compare(currentPassword, parent.passwordHash);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });

    const hash = await bcrypt.hash(newPassword, 10);
    await db.update(parentAccountsTable)
      .set({ passwordHash: hash, isFirstLogin: false })
      .where(eq(parentAccountsTable.id, parentId));

    res.json({ success: true, message: "Password changed successfully" });
  }));

  app.get("/api/parent/accounts", requireAdmin, asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const accounts = await db.select().from(parentAccountsTable)
      .where(eq(parentAccountsTable.branchId, branchId))
      .orderBy(desc(parentAccountsTable.id));
    const links = await db.select().from(parentStudentLinksTable);

    const result = accounts.map(a => ({
      ...a,
      passwordHash: undefined,
      linkedStudents: links.filter(l => l.parentId === a.id).map(l => l.studentId),
    }));
    res.json(result);
  }));

  app.post("/api/parent/accounts", requireAdmin, asyncHandler(async (req, res) => {
    const { cnic, fullName, phone, password, studentIds, relations } = req.body;
    if (!cnic || !password) return res.status(400).json({ error: "CNIC and password are required" });
    const branchId = getBranchId(req);

    const existing = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.cnic, cnic));
    if (existing.length > 0) return res.status(400).json({ error: "An account with this CNIC already exists" });

    const hash = await bcrypt.hash(password, 10);
    const [account] = await db.insert(parentAccountsTable).values({
      cnic,
      fullName: fullName || null,
      phone: phone || null,
      passwordHash: hash,
      branchId,
      createdAt: new Date().toISOString(),
    }).returning();

    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      const branchStudents = await db.select({ studentId: studentsTable.studentId, branchId: studentsTable.branchId })
        .from(studentsTable)
        .where(inArray(studentsTable.studentId, studentIds));
      const crossBranch = branchStudents.filter(s => s.branchId !== branchId).map(s => s.studentId);
      if (crossBranch.length > 0) {
        await db.delete(parentAccountsTable).where(eq(parentAccountsTable.id, account.id));
        return res.status(403).json({ error: `Students do not belong to your branch: ${crossBranch.join(", ")}` });
      }
      const linkValues = studentIds.map((sid: string, i: number) => ({
        parentId: account.id,
        studentId: sid,
        relation: relations?.[i] || "Parent",
        createdAt: new Date().toISOString(),
      }));
      await db.insert(parentStudentLinksTable).values(linkValues);
    }

    res.json({ ...account, passwordHash: undefined });
  }));

  app.patch("/api/parent/accounts/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const branchId = getBranchId(req);

    const [existing] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, id));
    if (!existing || existing.branchId !== branchId) return res.status(404).json({ error: "Account not found" });

    const { fullName, phone, isActive, resetPassword } = req.body;
    const updates: any = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (isActive !== undefined) updates.isActive = isActive;
    if (resetPassword) {
      const defaultPw = existing.cnic.replace(/-/g, "").slice(-6);
      updates.passwordHash = await bcrypt.hash(defaultPw, 10);
      updates.isFirstLogin = true;
    }

    const [updated] = await db.update(parentAccountsTable).set(updates).where(eq(parentAccountsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Account not found" });
    res.json({ ...updated, passwordHash: undefined });
  }));

  app.delete("/api/parent/accounts/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const branchId = getBranchId(req);

    const [existing] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, id));
    if (!existing || existing.branchId !== branchId) return res.status(404).json({ error: "Account not found" });

    await db.delete(parentStudentLinksTable).where(eq(parentStudentLinksTable.parentId, id));
    await db.delete(parentAccountsTable).where(eq(parentAccountsTable.id, id));
    res.json({ success: true });
  }));

  app.post("/api/parent/links", requireAdmin, asyncHandler(async (req, res) => {
    const { parentId, studentId, relation } = req.body;
    if (!parentId || !studentId) return res.status(400).json({ error: "parentId and studentId required" });
    const branchId = getBranchId(req);

    const [parentAccount] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, parseInt(String(parentId))));
    if (!parentAccount || parentAccount.branchId !== branchId) {
      return res.status(403).json({ error: "Parent account does not belong to your branch" });
    }

    const [student] = await db.select({ studentId: studentsTable.studentId, branchId: studentsTable.branchId })
      .from(studentsTable)
      .where(eq(studentsTable.studentId, String(studentId)));
    if (!student || student.branchId !== branchId) {
      return res.status(403).json({ error: "Student does not belong to your branch" });
    }

    const [link] = await db.insert(parentStudentLinksTable).values({
      parentId,
      studentId,
      relation: relation || "Parent",
      createdAt: new Date().toISOString(),
    }).returning();
    res.json(link);
  }));

  app.delete("/api/parent/links/:id", requireAdmin, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const branchId = getBranchId(req);

    const [link] = await db.select().from(parentStudentLinksTable).where(eq(parentStudentLinksTable.id, id));
    if (!link) return res.status(404).json({ error: "Link not found" });

    const [parentAccount] = await db.select().from(parentAccountsTable).where(eq(parentAccountsTable.id, link.parentId));
    if (!parentAccount || parentAccount.branchId !== branchId) {
      return res.status(403).json({ error: "This link does not belong to your branch" });
    }

    await db.delete(parentStudentLinksTable).where(eq(parentStudentLinksTable.id, id));
    res.json({ success: true });
  }));
}
