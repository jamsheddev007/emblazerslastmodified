import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, seedAccountsForBranch } from "./db";
import {
  schoolsTable, branchesTable, moduleUsers, studentsTable, staffTable,
  feeVouchersTable, paymentsTable, attendanceRecordsTable, challansTable,
  adminPermissionsTable, activityLogsTable, reportCardSettingsTable, payrollsTable, salesTable
} from "@shared/schema";
import { eq, sql, count, and, gte, lte, desc, like, or } from "drizzle-orm";
import { getModuleFeatures, getAllActions, getDefaultPermissions, clearPermissionsCache } from "./permission-check";

const router = Router();

function getJwtSecret(): string {
  const secret = process.env.SUPER_ADMIN_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("SUPER_ADMIN_SECRET or JWT_SECRET must be set");
  }
  return secret;
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Super admin token required" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.role !== "superadmin") {
      return res.status(403).json({ error: "Super admin access required" });
    }
    (req as any).superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired super admin token" });
  }
}

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const superEmail = process.env.SUPER_ADMIN_EMAIL;
    const superHash = process.env.SUPER_ADMIN_PASSWORD_HASH?.trim();
    const superPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superEmail || (!superHash && !superPassword)) {
      console.error("SUPER_ADMIN credentials not configured in environment");
      return res.status(500).json({ error: "Server configuration error" });
    }

    if (email.trim().toLowerCase() !== superEmail.trim().toLowerCase()) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const hashMatch = superHash ? await bcrypt.compare(password, superHash) : false;
    const plainMatch = superPassword ? password === superPassword : false;
    const isMatch = hashMatch || plainMatch;
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: "0", role: "superadmin", email: superEmail },
      getJwtSecret(),
      { expiresIn: "8h" }
    );

    return res.json({ success: true, token, user: { email: superEmail, role: "superadmin" } });
  } catch (error) {
    console.error("Super admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/schools", requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const schools = await db.select().from(schoolsTable);
    return res.json(schools);
  } catch (error) {
    console.error("Get schools error:", error);
    return res.status(500).json({ error: "Failed to fetch schools" });
  }
});

router.post("/schools", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { name, logoUrl, subscriptionPlan, status } = req.body;
    if (!name) return res.status(400).json({ error: "School name is required" });

    const [school] = await db.insert(schoolsTable).values({
      name,
      logoUrl: logoUrl || null,
      subscriptionPlan: subscriptionPlan || "free",
      status: status || "active",
      createdAt: new Date().toISOString(),
    }).returning();

    return res.status(201).json(school);
  } catch (error) {
    console.error("Create school error:", error);
    return res.status(500).json({ error: "Failed to create school" });
  }
});

router.put("/schools/:id", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid school ID" });

    const { name, logoUrl, subscriptionPlan, status, expiryDate } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    if (subscriptionPlan !== undefined) updates.subscriptionPlan = subscriptionPlan;
    if (status !== undefined) updates.status = status;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updated] = await db.update(schoolsTable).set(updates).where(eq(schoolsTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "School not found" });

    return res.json(updated);
  } catch (error) {
    console.error("Update school error:", error);
    return res.status(500).json({ error: "Failed to update school" });
  }
});

router.get("/branches", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : null;

    if (schoolId && !isNaN(schoolId)) {
      const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, schoolId));
      return res.json(branches);
    }

    const branches = await db.select().from(branchesTable);
    return res.json(branches);
  } catch (error) {
    console.error("Get branches error:", error);
    return res.status(500).json({ error: "Failed to fetch branches" });
  }
});

router.post("/branches", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { schoolId, name, address, phone, status } = req.body;
    if (!schoolId || !name) return res.status(400).json({ error: "schoolId and name are required" });

    const [existing] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, schoolId));
    if (!existing) return res.status(404).json({ error: "School not found" });

    const [branch] = await db.insert(branchesTable).values({
      schoolId,
      name,
      address: address || null,
      phone: phone || null,
      status: status || "active",
      createdAt: new Date().toISOString(),
    }).returning();

    seedAccountsForBranch(branch.id).catch(e => console.warn("COA seeding failed:", e.message));

    return res.status(201).json(branch);
  } catch (error) {
    console.error("Create branch error:", error);
    return res.status(500).json({ error: "Failed to create branch" });
  }
});

router.put("/branches/:id", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid branch ID" });

    const { schoolId, name, address, phone, status } = req.body;
    const updates: any = {};
    if (schoolId !== undefined) updates.schoolId = schoolId;
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (phone !== undefined) updates.phone = phone;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const [updated] = await db.update(branchesTable).set(updates).where(eq(branchesTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "Branch not found" });

    return res.json(updated);
  } catch (error) {
    console.error("Update branch error:", error);
    return res.status(500).json({ error: "Failed to update branch" });
  }
});

router.delete("/schools/:id", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid school ID" });

    const [school] = await db.select().from(schoolsTable).where(eq(schoolsTable.id, id));
    if (!school) return res.status(404).json({ error: "School not found" });

    const branches = await db.select().from(branchesTable).where(eq(branchesTable.schoolId, id));
    const branchIds = branches.map(b => b.id);

    let deletedUsers = 0;
    let deletedPerms = 0;
    let deletedBranches = 0;

    await db.transaction(async (tx) => {
      for (const bid of branchIds) {
        const users = await tx.select().from(moduleUsers).where(eq(moduleUsers.branchId, bid));
        for (const u of users) {
          await tx.delete(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, u.id));
          deletedPerms++;
        }
        await tx.delete(moduleUsers).where(eq(moduleUsers.branchId, bid));
        deletedUsers += users.length;
        await tx.delete(branchesTable).where(eq(branchesTable.id, bid));
        deletedBranches++;
      }
      await tx.delete(schoolsTable).where(eq(schoolsTable.id, id));
    });

    return res.json({
      success: true,
      message: `School deleted with ${deletedBranches} branch(es), ${deletedUsers} admin(s), ${deletedPerms} permission record(s) removed.`,
    });
  } catch (error) {
    console.error("Delete school error:", error);
    return res.status(500).json({ error: "Failed to delete school" });
  }
});

router.delete("/branches/:id", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid branch ID" });

    const adminCount = await db.select({ count: count() }).from(moduleUsers).where(eq(moduleUsers.branchId, id));
    if (adminCount[0]?.count > 0) {
      return res.status(400).json({ error: "Cannot delete branch with assigned admins. Reassign or remove admins first." });
    }

    const [deleted] = await db.delete(branchesTable).where(eq(branchesTable.id, id)).returning();
    if (!deleted) return res.status(404).json({ error: "Branch not found" });

    return res.json({ success: true });
  } catch (error) {
    console.error("Delete branch error:", error);
    return res.status(500).json({ error: "Failed to delete branch" });
  }
});

router.get("/admins", requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const admins = await db
      .select({
        id: moduleUsers.id,
        module: moduleUsers.module,
        email: moduleUsers.email,
        name: moduleUsers.name,
        role: moduleUsers.role,
        branchId: moduleUsers.branchId,
        branchName: branchesTable.name,
        schoolId: branchesTable.schoolId,
        schoolName: schoolsTable.name,
      })
      .from(moduleUsers)
      .leftJoin(branchesTable, eq(moduleUsers.branchId, branchesTable.id))
      .leftJoin(schoolsTable, eq(branchesTable.schoolId, schoolsTable.id));

    return res.json(admins);
  } catch (error) {
    console.error("Get admins error:", error);
    return res.status(500).json({ error: "Failed to fetch admins" });
  }
});

router.post("/admins", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { module, email, password, name, branchId, schoolId } = req.body;
    if (!module || !email || !password || !name) {
      return res.status(400).json({ error: "module, email, password, and name are required" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [admin] = await db.insert(moduleUsers).values({
      module,
      email,
      passwordHash,
      name,
      role: "admin",
      branchId: branchId || null,
    }).returning();

    return res.status(201).json({ id: admin.id, module: admin.module, email: admin.email, name: admin.name, branchId: admin.branchId });
  } catch (error: any) {
    if (error?.constraint || error?.code === "23505") {
      return res.status(409).json({ error: "A user with this email already exists for this module" });
    }
    console.error("Create admin error:", error);
    return res.status(500).json({ error: "Failed to create admin" });
  }
});

router.put("/admins/:id/reset-password", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid admin ID" });

    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: "newPassword is required" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [updated] = await db.update(moduleUsers).set({ passwordHash }).where(eq(moduleUsers.id, id)).returning();

    if (!updated) return res.status(404).json({ error: "Admin user not found" });

    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
});

router.get("/stats", requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const [schoolCount] = await db.select({ total: count() }).from(schoolsTable);
    const [branchCount] = await db.select({ total: count() }).from(branchesTable);
    const [studentCount] = await db.select({ total: count() }).from(studentsTable);
    const [staffCount] = await db.select({ total: count() }).from(staffTable);
    const [moduleUserCount] = await db.select({ total: count() }).from(moduleUsers);

    return res.json({
      totalSchools: schoolCount.total,
      totalBranches: branchCount.total,
      totalStudents: studentCount.total,
      totalStaff: staffCount.total,
      totalModuleUsers: moduleUserCount.total,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/analytics", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : null;
    const range = (req.query.range as string) || "month";

    const now = new Date();
    let rangeStart: Date;
    switch (range) {
      case "week": rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7); break;
      case "quarter": rangeStart = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
      case "year": rangeStart = new Date(now.getFullYear(), 0, 1); break;
      default: rangeStart = new Date(now.getFullYear(), now.getMonth(), 1); break;
    }
    const rangeStartStr = rangeStart.toISOString().split("T")[0];

    const allStudents = await db.select().from(studentsTable);
    const allStaff = await db.select().from(staffTable);
    const allVouchers = await db.select().from(feeVouchersTable);
    const allPayments = await db.select().from(paymentsTable);
    const allAttendance = await db.select().from(attendanceRecordsTable);

    const applyBranch = <T extends { branchId?: number | null }>(arr: T[]) => branchId ? arr.filter(a => a.branchId === branchId) : arr;
    const students = applyBranch(allStudents);
    const staff = applyBranch(allStaff);
    const vouchers = applyBranch(allVouchers).filter(v => !v.dueDate || v.dueDate >= rangeStartStr);
    const payments = applyBranch(allPayments).filter(p => !p.paymentDate || p.paymentDate >= rangeStartStr);
    const attendance = applyBranch(allAttendance).filter(a => !a.date || a.date >= rangeStartStr);

    const totalRevenue = payments.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
    const totalBilled = vouchers.reduce((s, v) => s + (parseFloat(String(v.totalAmount)) || 0), 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;
    const activeStudents = students.filter(s => s.status === "Active");
    const activeStaff = staff.filter(s => s.status === "Active");

    const studentAttendance = attendance.filter(a => (a.targetType || "").toUpperCase() === "STUDENT");
    const presentCount = studentAttendance.filter(a => {
      const s = (a.status || "").toUpperCase();
      return s === "PRESENT" || s === "LATE";
    }).length;
    const attendanceRate = studentAttendance.length > 0 ? Math.round((presentCount / studentAttendance.length) * 100) : 0;

    const pendingVouchers = vouchers.filter(v => v.status === "Unpaid" || v.status === "Partial");
    const overdueAmount = pendingVouchers.reduce((s, v) => s + (parseFloat(String(v.totalAmount)) || 0), 0);

    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return { label: d.toLocaleString("default", { month: "short", year: "2-digit" }), ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` };
    });

    const allPaymentsForBranch = applyBranch(allPayments);
    const allVouchersForBranch = applyBranch(allVouchers);
    const allPayrollsData = branchId
      ? await db.select().from(payrollsTable).where(eq(payrollsTable.branchId, branchId))
      : await db.select().from(payrollsTable);
    const allSalesData = branchId
      ? await db.select().from(salesTable).where(eq(salesTable.branchId, branchId))
      : await db.select().from(salesTable);

    const feeCollectionTrend = months.map(({ label, ym }) => {
      const monthPayments = allPaymentsForBranch.filter(p => (p.paymentDate || "").startsWith(ym));
      const monthVouchers = allVouchersForBranch.filter(v => (v.dueDate || "").startsWith(ym));
      const collected = monthPayments.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
      const billed = monthVouchers.reduce((s, v) => s + (parseFloat(String(v.totalAmount)) || 0), 0);
      return { month: label, billed: Math.round(billed), collected: Math.round(collected) };
    });

    const classGroups: Record<string, { boys: number; girls: number }> = {};
    for (const s of activeStudents) {
      if (!classGroups[s.class]) classGroups[s.class] = { boys: 0, girls: 0 };
      if (s.gender === "Male") classGroups[s.class].boys++;
      else classGroups[s.class].girls++;
    }
    const studentsByClass = Object.entries(classGroups)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([cls, data]) => ({ class: cls, boys: data.boys, girls: data.girls, total: data.boys + data.girls }));

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const attendanceHeatmap = studentsByClass.slice(0, 10).map(sc => ({
      class: sc.class,
      dates: Array.from({ length: Math.min(daysInMonth, now.getDate()) }, (_, i) => {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
        const dayAttendance = studentAttendance.filter(a => a.date === dateStr && (a.className || "").toUpperCase() === sc.class.toUpperCase());
        if (dayAttendance.length === 0) return { date: dateStr, rate: -1 };
        const present = dayAttendance.filter(a => { const s = (a.status || "").toUpperCase(); return s === "PRESENT" || s === "LATE"; }).length;
        return { date: dateStr, rate: Math.round((present / dayAttendance.length) * 100) };
      }),
    }));

    const feeByClass: Record<string, { collected: number; pending: number }> = {};
    for (const v of vouchers) {
      const cls = v.class || "Unknown";
      if (!feeByClass[cls]) feeByClass[cls] = { collected: 0, pending: 0 };
      const amt = parseFloat(String(v.totalAmount)) || 0;
      if (v.status === "Paid") feeByClass[cls].collected += amt;
      else feeByClass[cls].pending += amt;
    }
    const feeByClassArr = Object.entries(feeByClass).map(([cls, d]) => ({ class: cls, ...d }));

    const deptGroups: Record<string, { count: number; totalSalary: number }> = {};
    for (const s of activeStaff) {
      const dept = s.department || "Other";
      if (!deptGroups[dept]) deptGroups[dept] = { count: 0, totalSalary: 0 };
      deptGroups[dept].count++;
      deptGroups[dept].totalSalary += parseFloat(String(s.basicSalary)) || 0;
    }
    const staffByDept = Object.entries(deptGroups).map(([dept, d]) => ({
      department: dept,
      count: d.count,
      avgSalary: d.count > 0 ? Math.round(d.totalSalary / d.count) : 0,
    }));

    const incomeVsExpense = months.slice(-6).map(({ label, ym }) => {
      const monthIncome = allPaymentsForBranch
        .filter(p => (p.paymentDate || "").startsWith(ym))
        .reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
      const monthSalesIncome = allSalesData
        .filter(s => (s.date || "").startsWith(ym))
        .reduce((s, sale) => s + (parseFloat(String(sale.grandTotal)) || 0), 0);
      const monthPayrollNames = allPayrollsData
        .filter(p => {
          const payMonth = (p.month || "").toLowerCase();
          const [, yearStr] = payMonth.split(" ");
          const monthName = payMonth.split(" ")[0].substring(0, 3);
          return `${new Date(`${monthName} 1, ${yearStr}`).getFullYear()}-${String(new Date(`${monthName} 1, ${yearStr}`).getMonth() + 1).padStart(2, "0")}` === ym;
        });
      const monthExpenses = monthPayrollNames.reduce((s, p) => s + (parseFloat(String(p.netSalary)) || 0), 0);
      const totalIncome = Math.round(monthIncome + monthSalesIncome);
      const totalExpenses = Math.round(monthExpenses);
      return { month: label, income: totalIncome, expenses: totalExpenses, profit: Math.max(0, totalIncome - totalExpenses) };
    });

    const defaulterMap: Record<string, { studentName: string; class: string; outstanding: number; monthsOverdue: number; lastPayment: string }> = {};
    for (const v of pendingVouchers) {
      const key = v.studentId || "unknown";
      if (!defaulterMap[key]) {
        const stu = students.find(s => s.studentId === v.studentId);
        defaulterMap[key] = {
          studentName: stu?.name || v.studentId || "Unknown",
          class: v.class || stu?.class || "-",
          outstanding: 0,
          monthsOverdue: 0,
          lastPayment: "-",
        };
      }
      defaulterMap[key].outstanding += parseFloat(String(v.totalAmount)) || 0;
      defaulterMap[key].monthsOverdue++;
    }
    const topDefaulters = Object.values(defaulterMap)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 10);

    const recentActivity: any[] = [];
    for (const p of payments.slice(-10)) {
      recentActivity.push({
        id: p.id,
        type: "payment",
        description: `Fee payment of PKR ${p.amount} received (${p.receiptNo || "N/A"})`,
        timestamp: p.paymentDate || new Date().toISOString().split("T")[0],
        branch: "Main Branch",
      });
    }
    for (const s of students.slice(-5)) {
      recentActivity.push({
        id: s.id,
        type: "admission",
        description: `New student ${s.name} admitted to ${s.class}`,
        timestamp: s.admissionDate || new Date().toISOString().split("T")[0],
        branch: "Main Branch",
      });
    }
    recentActivity.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

    return res.json({
      kpis: {
        totalRevenue,
        collectionRate,
        totalStudents: activeStudents.length,
        studentGrowth: 0,
        totalStaff: activeStaff.length,
        attendanceRate,
        overdueAmount,
      },
      feeCollectionTrend,
      studentsByClass,
      attendanceHeatmap,
      feeByClass: feeByClassArr,
      staffByDept,
      incomeVsExpense,
      topDefaulters,
      recentActivity: recentActivity.slice(0, 20),
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

router.get("/permissions/:moduleUserId", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const moduleUserId = parseInt(req.params.moduleUserId);
    const rows = await db.select().from(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, moduleUserId));

    const userRows = await db.select().from(moduleUsers).where(eq(moduleUsers.id, moduleUserId));
    if (userRows.length === 0) return res.status(404).json({ error: "Admin not found" });

    const user = userRows[0];
    const features = getModuleFeatures(user.module);
    const actions = getAllActions();

    if (rows.length === 0) {
      return res.json({
        moduleUserId,
        module: user.module,
        permissions: null,
        features,
        actions,
      });
    }

    return res.json({
      id: rows[0].id,
      moduleUserId,
      module: user.module,
      permissions: rows[0].permissions,
      features,
      actions,
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    return res.status(500).json({ error: "Failed to fetch permissions" });
  }
});

router.put("/permissions/:moduleUserId", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const moduleUserId = parseInt(req.params.moduleUserId);
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== "object") {
      return res.status(400).json({ error: "Invalid permissions object" });
    }

    const userRows = await db.select().from(moduleUsers).where(eq(moduleUsers.id, moduleUserId));
    if (userRows.length === 0) return res.status(404).json({ error: "Admin not found" });

    const user = userRows[0];
    const existing = await db.select().from(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, moduleUserId));

    if (existing.length > 0) {
      await db.update(adminPermissionsTable)
        .set({ permissions, updatedAt: new Date().toISOString() })
        .where(eq(adminPermissionsTable.moduleUserId, moduleUserId));
    } else {
      await db.insert(adminPermissionsTable).values({
        moduleUserId,
        module: user.module,
        branchId: user.branchId,
        permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    clearPermissionsCache(moduleUserId);
    return res.json({ success: true });
  } catch (error) {
    console.error("Save permissions error:", error);
    return res.status(500).json({ error: "Failed to save permissions" });
  }
});

router.delete("/permissions/:moduleUserId", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const moduleUserId = parseInt(req.params.moduleUserId);
    await db.delete(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, moduleUserId));
    clearPermissionsCache(moduleUserId);
    return res.json({ success: true });
  } catch (error) {
    console.error("Delete permissions error:", error);
    return res.status(500).json({ error: "Failed to delete permissions" });
  }
});

router.get("/permission-presets/:module", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const mod = req.params.module;
    return res.json({
      presets: {
        full_access: getDefaultPermissions(mod, "full_access"),
        view_only: getDefaultPermissions(mod, "view_only"),
        no_delete: getDefaultPermissions(mod, "no_delete"),
        data_entry: getDefaultPermissions(mod, "data_entry"),
      },
      features: getModuleFeatures(mod),
      actions: getAllActions(),
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to get presets" });
  }
});

router.get("/permissions-all", requireSuperAdmin, async (_req: Request, res: Response) => {
  try {
    const allPerms = await db.select().from(adminPermissionsTable);
    return res.json(allPerms);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch all permissions" });
  }
});

router.get("/audit-logs", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { module, action, search, page = "1", limit = "50" } = req.query;
    const pageNum = Math.max(1, parseInt(String(page)));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit))));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (module && module !== "all") conditions.push(eq(activityLogsTable.module, String(module)));
    if (action && action !== "all") conditions.push(eq(activityLogsTable.action, String(action)));
    if (search) {
      const searchStr = `%${String(search)}%`;
      conditions.push(
        or(
          like(activityLogsTable.userEmail, searchStr),
          like(activityLogsTable.entityName, searchStr),
          like(activityLogsTable.description, searchStr)
        )!
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, totalResult] = await Promise.all([
      db.select().from(activityLogsTable)
        .where(whereClause)
        .orderBy(desc(activityLogsTable.id))
        .limit(limitNum)
        .offset(offset),
      db.select({ count: count() }).from(activityLogsTable).where(whereClause),
    ]);

    return res.json({
      logs,
      total: totalResult[0]?.count || 0,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// ============ REPORT CARD SETTINGS ============

router.get("/report-card-settings", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    let rows;
    if (branchId) {
      rows = await db.select().from(reportCardSettingsTable).where(eq(reportCardSettingsTable.branchId, Number(branchId)));
    } else {
      rows = await db.select().from(reportCardSettingsTable);
    }
    if (rows.length === 0) {
      return res.json({});
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch report card settings" });
  }
});

router.post("/report-card-settings", requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const {
      schoolName, schoolAddress, schoolPhone, schoolEmail, schoolLogo,
      principalName, principalTitle, principalSignature, examinerTitle,
      gradeScale, passingPercentage,
      showAttendance, showRemarks, showPosition, showGrade, showPercentage, showSignatures,
      headerColor, footerText, branchId,
    } = req.body;

    const now = new Date().toISOString();
    const payload: any = {
      schoolName: schoolName ?? "",
      schoolAddress: schoolAddress ?? null,
      schoolPhone: schoolPhone ?? null,
      schoolEmail: schoolEmail ?? null,
      schoolLogo: schoolLogo ?? null,
      principalName: principalName ?? "",
      principalTitle: principalTitle ?? "Principal",
      principalSignature: principalSignature ?? null,
      examinerTitle: examinerTitle ?? "Class Teacher",
      gradingScale: [],
      gradeScale: gradeScale ?? "10point",
      passingPercentage: passingPercentage != null ? Number(passingPercentage) : 40,
      showAttendance: showAttendance !== false,
      showRemarks: showRemarks !== false,
      showPosition: showPosition !== false,
      showGrade: showGrade !== false,
      showPercentage: showPercentage !== false,
      showSignatures: showSignatures !== false,
      headerColor: headerColor ?? "#1e40af",
      footerText: footerText ?? null,
      remarkLabels: {},
      branchId: branchId != null ? Number(branchId) : null,
      updatedAt: now,
    };

    let existing: any[] = [];
    if (branchId != null) {
      existing = await db.select().from(reportCardSettingsTable).where(eq(reportCardSettingsTable.branchId, Number(branchId)));
    } else {
      existing = await db.select().from(reportCardSettingsTable).where(sql`branch_id IS NULL`);
    }

    let saved;
    if (existing.length > 0) {
      const updated = await db.update(reportCardSettingsTable).set(payload).where(eq(reportCardSettingsTable.id, existing[0].id)).returning();
      saved = updated[0];
    } else {
      const inserted = await db.insert(reportCardSettingsTable).values(payload).returning();
      saved = inserted[0];
    }

    return res.json(saved);
  } catch (error) {
    console.error("Failed to save report card settings:", error);
    return res.status(500).json({ error: "Failed to save report card settings" });
  }
});

export default router;
