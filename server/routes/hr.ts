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
} from "../lib/route-helpers";
import { requireHrModuleWrite } from "../middleware/module-auth";
import {
  insertStaffSchema,
  insertVacancySchema,
  insertApplicantSchema,
  insertFeeVoucherSchema,
  insertPayrollSchema,
  staffTable,
  attendanceRecordsTable,
  payrollsTable,
  staffDocumentsTable,
  leaveApplicationsTable,
  notificationsTable,
} from "@shared/schema";
import { checkStaffReferences, checkVacancyReferences } from "../validation";
import { eq, and, gte, lte, desc, count } from "drizzle-orm";

async function getPresentDaysForMonth(staffId: string, monthString: string, branchId: number): Promise<number> {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const parts = monthString.trim().split(" ");
  if (parts.length !== 2) return 0;
  const [monthName, yearStr] = parts;
  const monthIndex = monthNames.indexOf(monthName);
  const yearNum = parseInt(yearStr, 10);
  if (monthIndex === -1 || isNaN(yearNum)) return 0;
  const mm = String(monthIndex + 1).padStart(2, "0");
  const startDate = `${yearNum}-${mm}-01`;
  const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
  const endDate = `${yearNum}-${mm}-${String(lastDay).padStart(2, "0")}`;
  const result = await db.select({ total: count() }).from(attendanceRecordsTable).where(
    and(
      eq(attendanceRecordsTable.targetType, "staff"),
      eq(attendanceRecordsTable.staffId, staffId),
      gte(attendanceRecordsTable.date, startDate),
      lte(attendanceRecordsTable.date, endDate),
      eq(attendanceRecordsTable.status, "Present"),
      eq(attendanceRecordsTable.branchId, branchId)
    )
  );
  return Number(result[0]?.total ?? 0);
}

async function getLateDaysForMonth(staffId: string, monthString: string, branchId: number): Promise<number> {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const parts = monthString.trim().split(" ");
  if (parts.length !== 2) return 0;
  const [monthName, yearStr] = parts;
  const monthIndex = monthNames.indexOf(monthName);
  const yearNum = parseInt(yearStr, 10);
  if (monthIndex === -1 || isNaN(yearNum)) return 0;
  const mm = String(monthIndex + 1).padStart(2, "0");
  const startDate = `${yearNum}-${mm}-01`;
  const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
  const endDate = `${yearNum}-${mm}-${String(lastDay).padStart(2, "0")}`;
  const result = await db.select({ total: count() }).from(attendanceRecordsTable).where(
    and(
      eq(attendanceRecordsTable.targetType, "staff"),
      eq(attendanceRecordsTable.staffId, staffId),
      gte(attendanceRecordsTable.date, startDate),
      lte(attendanceRecordsTable.date, endDate),
      eq(attendanceRecordsTable.status, "Late"),
      eq(attendanceRecordsTable.branchId, branchId)
    )
  );
  return Number(result[0]?.total ?? 0);
}

async function getAbsentDaysForMonth(staffId: string, monthString: string, branchId: number): Promise<number> {
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const parts = monthString.trim().split(" ");
  if (parts.length !== 2) return 0;
  const [monthName, yearStr] = parts;
  const monthIndex = monthNames.indexOf(monthName);
  const yearNum = parseInt(yearStr, 10);
  if (monthIndex === -1 || isNaN(yearNum)) return 0;
  const mm = String(monthIndex + 1).padStart(2, "0");
  const startDate = `${yearNum}-${mm}-01`;
  const lastDay = new Date(yearNum, monthIndex + 1, 0).getDate();
  const endDate = `${yearNum}-${mm}-${String(lastDay).padStart(2, "0")}`;
  const result = await db.select({ total: count() }).from(attendanceRecordsTable).where(
    and(
      eq(attendanceRecordsTable.targetType, "staff"),
      eq(attendanceRecordsTable.staffId, staffId),
      gte(attendanceRecordsTable.date, startDate),
      lte(attendanceRecordsTable.date, endDate),
      eq(attendanceRecordsTable.status, "Absent"),
      eq(attendanceRecordsTable.branchId, branchId)
    )
  );
  return Number(result[0]?.total ?? 0);
}

export function registerHrRoutes(app: Express) {
  app.get("/api/staff", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    let staff = filterByBranch(await storage.getStaff(), branchId);
    const stripPassword = (s: any) => { const { portalPassword, portalPasswordHash, ...rest } = s; return rest; };
    const { query, page, limit: limitStr } = req.query;

    if (query && typeof query === "string") {
      const searchLower = query.toLowerCase().trim();
      staff = staff.filter(member => {
        const staffIdMatch = member.staffId?.toLowerCase().includes(searchLower);
        const nameMatch = member.name?.toLowerCase().includes(searchLower);
        return staffIdMatch || nameMatch;
      });
    }

    if (page) {
      const pageNum = Math.max(1, parseInt(String(page)));
      const limitNum = Math.min(500, Math.max(1, parseInt(String(limitStr || "100"))));
      const total = staff.length;
      const offset = (pageNum - 1) * limitNum;
      return res.json({ data: staff.slice(offset, offset + limitNum).map(stripPassword), total, page: pageNum, limit: limitNum });
    }

    res.json(staff.map(stripPassword));
  }));

  app.get("/api/staff/:id", asyncHandler(async (req, res) => {
    const member = await storage.getStaffMember(req.params.id);
    if (!member || !verifyBranch(member, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { portalPassword, portalPasswordHash, ...safe } = member as any;
    res.json(safe);
  }));

  app.post("/api/staff", requireHrModuleWrite, asyncHandler(async (req, res) => {
    const parsed = insertStaffSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const staffData: any = { ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) };
    if (staffData.portalPassword) {
      staffData.portalPasswordHash = await bcrypt.hash(staffData.portalPassword, 10);
      delete staffData.portalPassword;
    }
    const member = await storage.createStaff(staffData);
    res.status(201).json(member);
  }));

  app.patch("/api/staff/:id", requireHrModuleWrite, asyncHandler(async (req, res) => {
    const existing = await storage.getStaffMember(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertStaffSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const patchData: any = { ...parsed.data };
    if (patchData.portalPassword) {
      patchData.portalPasswordHash = await bcrypt.hash(patchData.portalPassword, 10);
      delete patchData.portalPassword;
    }
    const member = await storage.updateStaff(req.params.id, patchData);
    if (!member) return res.status(404).json({ error: "Not found" });
    const { portalPassword, portalPasswordHash, ...safe } = member as any;
    res.json(safe);
  }));

  app.delete("/api/staff/:id", requireHrModuleWrite, asyncHandler(async (req, res) => {
    const existing = await storage.getStaffMember(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkStaffReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteStaff(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/vacancies", asyncHandler(async (req, res) => {
    const vacancies = filterByBranch(await storage.getVacancies(), getBranchId(req));
    res.json(vacancies);
  }));

  app.get("/api/vacancies/:id", asyncHandler(async (req, res) => {
    const vacancy = await storage.getVacancy(req.params.id);
    if (!vacancy || !verifyBranch(vacancy, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(vacancy);
  }));

  app.post("/api/vacancies", asyncHandler(async (req, res) => {
    const parsed = insertVacancySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vacancy = await storage.createVacancy({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(vacancy);
  }));

  app.patch("/api/vacancies/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVacancy(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertVacancySchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vacancy = await storage.updateVacancy(req.params.id, parsed.data);
    if (!vacancy) return res.status(404).json({ error: "Not found" });
    res.json(vacancy);
  }));

  app.delete("/api/vacancies/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVacancy(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkVacancyReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteVacancy(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/applicants", asyncHandler(async (req, res) => {
    const applicants = filterByBranch(await storage.getApplicants(), getBranchId(req));
    res.json(applicants);
  }));

  app.get("/api/applicants/:id", asyncHandler(async (req, res) => {
    const applicant = await storage.getApplicant(req.params.id);
    if (!applicant || !verifyBranch(applicant, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(applicant);
  }));

  app.post("/api/applicants", asyncHandler(async (req, res) => {
    const parsed = insertApplicantSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const applicant = await storage.createApplicant({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(applicant);
  }));

  app.patch("/api/applicants/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getApplicant(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertApplicantSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const applicant = await storage.updateApplicant(req.params.id, parsed.data);
    if (!applicant) return res.status(404).json({ error: "Not found" });
    res.json(applicant);
  }));

  app.delete("/api/applicants/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getApplicant(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteApplicant(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/fee-vouchers", asyncHandler(async (req, res) => {
    const vouchers = filterByBranch(await storage.getFeeVouchers(), getBranchId(req));
    res.json(vouchers);
  }));

  app.get("/api/fee-vouchers/:id", asyncHandler(async (req, res) => {
    const voucher = await storage.getFeeVoucher(req.params.id);
    if (!voucher || !verifyBranch(voucher, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(voucher);
  }));

  app.post("/api/fee-vouchers", asyncHandler(async (req, res) => {
    const parsed = insertFeeVoucherSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const voucher = await storage.createFeeVoucher({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(voucher);
  }));

  app.patch("/api/fee-vouchers/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getFeeVoucher(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertFeeVoucherSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const voucher = await storage.updateFeeVoucher(req.params.id, parsed.data);
    if (!voucher) return res.status(404).json({ error: "Not found" });
    res.json(voucher);
  }));

  app.delete("/api/fee-vouchers/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getFeeVoucher(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteFeeVoucher(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/payrolls", asyncHandler(async (req, res) => {
    const payrolls = filterByBranch(await storage.getPayrolls(), getBranchId(req));
    res.json(payrolls);
  }));

  app.get("/api/payrolls/attendance-preview", asyncHandler(async (req, res) => {
    const WORKING_DAYS_PER_MONTH = 26;
    const { staffId, month } = req.query as { staffId?: string; month?: string };
    if (!staffId || !month) return res.status(400).json({ error: "staffId and month are required" });
    const branchId = getBranchId(req);
    const absentDays = await getAbsentDaysForMonth(staffId, month, branchId);
    const allStaff = await storage.getStaff();
    const staffMember = allStaff.find(s => s.staffId === staffId || String(s.id) === staffId);
    if (!staffMember || !verifyBranch(staffMember, branchId)) return res.status(404).json({ error: "Staff not found" });
    const basicSalary = staffMember.basicSalary ?? 0;
    const dailyRate = Math.round(basicSalary / WORKING_DAYS_PER_MONTH);
    const absentDeduction = Math.round(dailyRate * absentDays);
    res.json({ absentDays, dailyRate, absentDeduction, workingDaysConvention: WORKING_DAYS_PER_MONTH });
  }));

  app.get("/api/payrolls/:id", asyncHandler(async (req, res) => {
    const payroll = await storage.getPayroll(req.params.id);
    if (!payroll || !verifyBranch(payroll, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(payroll);
  }));

  app.post("/api/payrolls", async (req, res) => {
    try {
      const parsed = insertPayrollSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const branchId = getBranchId(req);
      if (parsed.data.staffId) {
        const allStaff = await storage.getStaff();
        const staffMember = allStaff.find(s => s.staffId === parsed.data.staffId);
        if (staffMember && staffMember.status === "Terminated") {
          return res.status(400).json({ error: "Cannot generate payroll for a terminated staff member." });
        }
      }
      const WORKING_DAYS_PER_MONTH = 26;
      const [absentDays, presentDays, lateDays] = parsed.data.staffId && parsed.data.month
        ? await Promise.all([
            getAbsentDaysForMonth(String(parsed.data.staffId), parsed.data.month, branchId),
            getPresentDaysForMonth(String(parsed.data.staffId), parsed.data.month, branchId),
            getLateDaysForMonth(String(parsed.data.staffId), parsed.data.month, branchId),
          ])
        : [0, 0, 0];
      const updatedDeductions: { name: string; amount: number }[] = [...((parsed.data.deductions as { name: string; amount: number }[]) || [])];
      if (absentDays > 0) {
        const dailyRate = Math.round((parsed.data.basicSalary ?? 0) / WORKING_DAYS_PER_MONTH);
        const absentDeduction = Math.round(dailyRate * absentDays);
        updatedDeductions.push({ name: `Absent Deduction (${absentDays} days)`, amount: absentDeduction });
      }
      const totalAllowances = ((parsed.data.allowances as { name: string; amount: number }[]) || []).reduce((s, a) => s + (a.amount || 0), 0);
      const totalDeductions = updatedDeductions.reduce((s, d) => s + (d.amount || 0), 0);
      const grossSalary = (parsed.data.basicSalary ?? 0) + totalAllowances;
      let netSalary = grossSalary - totalDeductions;
      let warning: string | undefined;
      if (netSalary < 0) {
        netSalary = 0;
        warning = "Net salary capped at 0 due to deductions exceeding gross salary";
      }
      const payroll = await storage.createPayroll({
        ...parsed.data,
        deductions: updatedDeductions,
        grossSalary,
        netSalary,
        branchId,
        schoolId: getSchoolId(req),
      });
      const payrollResponse = { ...payroll, attendancePresent: presentDays, attendanceAbsent: absentDays, attendanceLate: lateDays };
      res.status(201).json(warning ? { ...payrollResponse, warning } : payrollResponse);
    } catch (error) {
      console.error("Failed to create payroll:", error);
      res.status(500).json({ error: "Failed to create payroll" });
    }
  });

  app.patch("/api/payrolls/:id", asyncHandler(async (req, res) => {
    const { id, ...updates } = req.body;
    const existingPayroll = await storage.getPayroll(req.params.id);
    if (!existingPayroll || !verifyBranch(existingPayroll, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const parsed = insertPayrollSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const payroll = await storage.updatePayroll(req.params.id, parsed.data);
    if (!payroll) return res.status(404).json({ error: "Not found" });
    if (existingPayroll.status !== "Paid" && payroll.status === "Paid" && payroll.netSalary > 0) {
      try {
        const paidDate = payroll.paidDate || new Date().toISOString().split("T")[0];
        await (storage as any).createAutoPostedVoucher({
          type: "Payment",
          date: paidDate,
          debitAccountCode: "5001",
          creditAccountCode: "1001",
          amount: payroll.netSalary,
          narration: `Salary payment to ${payroll.staffName} for ${payroll.month}`,
          reference: `PAY-${payroll.id}`,
          referenceType: "SalaryPayment",
          createdBy: (req as any).user?.email || "system",
          branchId: getBranchId(req),
          sourceModule: "payroll",
        });
      } catch (voucherErr) {
        console.warn("[Payroll] Auto-voucher posting failed (non-fatal):", (voucherErr as Error).message);
      }
    }
    res.json(payroll);
  }));

  app.delete("/api/payrolls/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getPayroll(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deletePayroll(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.post("/api/staff-portal/login", loginLimiter, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: "Server configuration error" });

    const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.portalEmail, email));
    if (!staffMember) return res.status(401).json({ error: "Employee account not found. Contact HR admin." });
    if (!staffMember.portalPasswordHash) return res.status(401).json({ error: "Portal access not configured. Contact HR admin." });

    const isValid = await bcrypt.compare(password, staffMember.portalPasswordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid password" });
    if (staffMember.status === "Terminated") return res.status(403).json({ error: "Account is disabled. Contact HR admin." });

    const token = jwt.sign(
      { userId: String(staffMember.id), email: staffMember.portalEmail, role: "staff", module: "hr", staffId: staffMember.staffId, staffName: staffMember.name, designation: staffMember.designation, department: staffMember.department, campus: staffMember.campus, branchId: staffMember.branchId || 1, schoolId: 1 },
      jwtSecret,
      { expiresIn: "3d" }
    );

    return res.json({
      success: true,
      token,
      module: "hr",
      user: {
        email: staffMember.portalEmail,
        role: "staff",
        name: staffMember.name,
        staffId: staffMember.staffId,
        designation: staffMember.designation,
        department: staffMember.department,
        campus: staffMember.campus,
      },
    });
  }));

  app.get("/api/staff-portal/dashboard", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: "Not authenticated as staff" });

    const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(user.userId)));
    if (!staffMember) return res.status(404).json({ error: "Staff record not found" });

    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    let presentThisMonth = 0;
    let absentThisMonth = 0;
    try {
      const records = await db.select().from(attendanceRecordsTable).where(and(eq(attendanceRecordsTable.staffId, user.staffId), gte(attendanceRecordsTable.date, startOfMonth), lte(attendanceRecordsTable.date, endOfMonth)));
      presentThisMonth = records.filter((r: any) => r.status?.toUpperCase() === "PRESENT").length;
      absentThisMonth = records.filter((r: any) => r.status?.toUpperCase() === "ABSENT").length;
    } catch {}

    let latestNetSalary = 0;
    try {
      const payrolls = await db.select().from(payrollsTable).where(eq(payrollsTable.staffId, user.staffId)).orderBy(desc(payrollsTable.id)).limit(1);
      if (payrolls.length > 0) latestNetSalary = payrolls[0].netSalary;
    } catch {}

    const joiningDate = staffMember.joiningDate ? new Date(staffMember.joiningDate) : now;
    const daysSinceJoining = Math.floor((now.getTime() - joiningDate.getTime()) / (1000 * 60 * 60 * 24));

    res.json({
      profile: {
        name: staffMember.name,
        staffId: staffMember.staffId,
        designation: staffMember.designation,
        department: staffMember.department,
        campus: staffMember.campus,
      },
      presentThisMonth,
      absentThisMonth,
      latestNetSalary,
      daysSinceJoining: Math.max(0, daysSinceJoining),
    });
  }));

  app.get("/api/staff-portal/profile", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: "Not authenticated as staff" });

    const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(user.userId)));
    if (!staffMember) return res.status(404).json({ error: "Staff record not found" });

    res.json({
      personal: {
        name: staffMember.name,
        gender: staffMember.gender,
        dob: staffMember.dob,
        email: staffMember.email,
        phone: staffMember.phone,
        address: staffMember.address,
        photo: staffMember.photo,
      },
      job: {
        staffId: staffMember.staffId,
        designation: staffMember.designation,
        department: staffMember.department,
        employmentType: staffMember.employmentType,
        campus: staffMember.campus,
        joiningDate: staffMember.joiningDate,
        status: staffMember.status,
      },
      salary: {
        basicSalary: staffMember.basicSalary,
        paymentMode: staffMember.paymentMode,
      },
    });
  }));

  app.get("/api/staff-portal/attendance", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as staff" });

    const { month, year } = req.query;
    let records;
    let startDate: string | null = null;
    let endDate: string | null = null;

    if (month && String(month).includes("-")) {
      const [y, m] = String(month).split("-");
      startDate = `${y}-${m}-01`;
      endDate = `${y}-${m}-31`;
    } else if (month && year) {
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      endDate = `${year}-${String(month).padStart(2, "0")}-31`;
    }

    if (startDate && endDate) {
      records = await db.select().from(attendanceRecordsTable).where(and(eq(attendanceRecordsTable.staffId, user.staffId), gte(attendanceRecordsTable.date, startDate), lte(attendanceRecordsTable.date, endDate))).orderBy(desc(attendanceRecordsTable.date));
    } else {
      records = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.staffId, user.staffId)).orderBy(desc(attendanceRecordsTable.date));
    }

    const mapped = records.map((r: any) => ({
      id: String(r.id),
      date: r.date,
      status: r.status,
      remarks: r.remarks || "",
      markedAt: r.markedAt,
    }));

    const totalPresent = mapped.filter(r => r.status?.toUpperCase() === "PRESENT").length;
    const totalAbsent = mapped.filter(r => r.status?.toUpperCase() === "ABSENT").length;
    const totalLeave = mapped.filter(r => r.status?.toUpperCase() === "LEAVE").length;
    const total = mapped.length;
    const attendancePercentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

    res.json({
      records: mapped,
      summary: { totalPresent, totalAbsent, totalLeave, total, attendancePercentage },
    });
  }));

  app.get("/api/staff-portal/salary", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as staff" });

    const payrolls = await db.select().from(payrollsTable).where(eq(payrollsTable.staffId, user.staffId)).orderBy(desc(payrollsTable.id));

    const mapped = payrolls.map((p: any) => ({
      id: String(p.id),
      month: p.month,
      basicSalary: p.basicSalary,
      allowances: p.allowances || [],
      deductions: p.deductions || [],
      grossSalary: p.grossSalary,
      netSalary: p.netSalary,
      status: p.status,
      paidDate: p.paidDate,
    }));

    res.json(mapped);
  }));

  app.get("/api/staff-portal/documents", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.staffId) return res.status(401).json({ error: "Not authenticated as staff" });

    const docs = await db.select().from(staffDocumentsTable).where(eq(staffDocumentsTable.staffId, user.staffId)).orderBy(desc(staffDocumentsTable.id));

    const mapped = docs.map((d: any) => ({
      id: String(d.id),
      documentName: d.documentName,
      documentType: d.documentType,
      fileUrl: d.fileUrl,
      uploadedAt: d.uploadedAt,
    }));

    res.json(mapped);
  }));

  app.get("/api/leave-applications/balance/:staffId", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const staffId = parseInt(req.params.staffId);
    const year = new Date().getFullYear().toString();
    const leaves = await db.select().from(leaveApplicationsTable).where(
      and(eq(leaveApplicationsTable.branchId, branchId), eq(leaveApplicationsTable.staffId, staffId), eq(leaveApplicationsTable.status, "approved"))
    );
    const thisYear = leaves.filter(l => l.startDate.startsWith(year));
    const sickUsed = thisYear.filter(l => l.leaveType === "sick").reduce((s, l) => s + l.totalDays, 0);
    const casualUsed = thisYear.filter(l => l.leaveType === "casual").reduce((s, l) => s + l.totalDays, 0);
    const annualUsed = thisYear.filter(l => l.leaveType === "annual").reduce((s, l) => s + l.totalDays, 0);
    const emergencyUsed = thisYear.filter(l => l.leaveType === "emergency").reduce((s, l) => s + l.totalDays, 0);
    res.json({ sickUsed, casualUsed, annualUsed, emergencyUsed, sickTotal: 10, casualTotal: 10, annualTotal: 21, emergencyTotal: 5 });
  }));

  app.get("/api/leave-applications/staff/:staffId", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const staffId = parseInt(req.params.staffId);
    const leaves = await db.select().from(leaveApplicationsTable)
      .where(and(eq(leaveApplicationsTable.branchId, branchId), eq(leaveApplicationsTable.staffId, staffId)))
      .orderBy(desc(leaveApplicationsTable.id));
    res.json(leaves);
  }));

  app.get("/api/leave-applications", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { status } = req.query as { status?: string };
    const conditions: any[] = [eq(leaveApplicationsTable.branchId, branchId)];
    if (status && status !== "all") conditions.push(eq(leaveApplicationsTable.status, status));
    const leaves = await db.select({
      id: leaveApplicationsTable.id,
      staffId: leaveApplicationsTable.staffId,
      leaveType: leaveApplicationsTable.leaveType,
      startDate: leaveApplicationsTable.startDate,
      endDate: leaveApplicationsTable.endDate,
      totalDays: leaveApplicationsTable.totalDays,
      reason: leaveApplicationsTable.reason,
      status: leaveApplicationsTable.status,
      approvedBy: leaveApplicationsTable.approvedBy,
      approvedAt: leaveApplicationsTable.approvedAt,
      rejectionReason: leaveApplicationsTable.rejectionReason,
      branchId: leaveApplicationsTable.branchId,
      createdAt: leaveApplicationsTable.createdAt,
      staffName: staffTable.name,
      staffDesignation: staffTable.designation,
    }).from(leaveApplicationsTable)
      .leftJoin(staffTable, eq(leaveApplicationsTable.staffId, staffTable.id))
      .where(and(...conditions))
      .orderBy(desc(leaveApplicationsTable.id));
    res.json(leaves);
  }));

  app.post("/api/leave-applications", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { staffId, leaveType, startDate, endDate, reason } = req.body;
    if (!staffId || !leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: "staffId, leaveType, startDate, endDate, reason are required" });
    }
    const totalDays = Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, parseInt(String(staffId))));
    const now = new Date().toISOString();
    const [leave] = await db.insert(leaveApplicationsTable).values({
      staffId: parseInt(String(staffId)), leaveType, startDate, endDate, totalDays, reason, status: "pending", branchId, createdAt: now,
    }).returning();
    try {
      await db.insert(notificationsTable).values({ type: "leave_application", title: "Leave Application Submitted", message: `Leave application submitted by ${staff?.name || `Staff #${staffId}`} for ${totalDays} days from ${startDate}`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(leave);
  }));

  app.patch("/api/leave-applications/:id/approve", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const id = parseInt(req.params.id);
    const { approvedBy } = req.body;
    const now = new Date().toISOString();
    const [existing] = await db.select().from(leaveApplicationsTable).where(and(eq(leaveApplicationsTable.id, id), eq(leaveApplicationsTable.branchId, branchId)));
    if (!existing) return res.status(404).json({ error: "Leave application not found" });
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, existing.staffId));
    const [updated] = await db.update(leaveApplicationsTable).set({ status: "approved", approvedBy: approvedBy ? parseInt(String(approvedBy)) : null, approvedAt: now }).where(eq(leaveApplicationsTable.id, id)).returning();
    try {
      await db.insert(notificationsTable).values({ type: "leave_approved", title: "Leave Application Approved", message: `Leave application approved for ${staff?.name || `Staff #${existing.staffId}`} — ${existing.totalDays} days ${existing.leaveType} leave`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(updated);
  }));

  app.patch("/api/leave-applications/:id/reject", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const id = parseInt(req.params.id);
    const { rejectionReason } = req.body;
    const now = new Date().toISOString();
    const [existing] = await db.select().from(leaveApplicationsTable).where(and(eq(leaveApplicationsTable.id, id), eq(leaveApplicationsTable.branchId, branchId)));
    if (!existing) return res.status(404).json({ error: "Leave application not found" });
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, existing.staffId));
    const [updated] = await db.update(leaveApplicationsTable).set({ status: "rejected", rejectionReason: rejectionReason || "No reason provided" }).where(eq(leaveApplicationsTable.id, id)).returning();
    try {
      await db.insert(notificationsTable).values({ type: "leave_rejected", title: "Leave Application Rejected", message: `Leave application rejected for ${staff?.name || `Staff #${existing.staffId}`}`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(updated);
  }));

  app.get("/api/staff-portal/leave-applications", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: "Not authenticated as staff" });
    const staffIdInt = parseInt(user.userId);
    const leaves = await db.select().from(leaveApplicationsTable).where(eq(leaveApplicationsTable.staffId, staffIdInt)).orderBy(desc(leaveApplicationsTable.id));
    res.json(leaves);
  }));

  app.post("/api/staff-portal/leave-applications", asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.userId) return res.status(401).json({ error: "Not authenticated as staff" });
    const staffIdInt = parseInt(user.userId);
    const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, staffIdInt));
    if (!staffMember) return res.status(404).json({ error: "Staff record not found" });
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !reason) return res.status(400).json({ error: "leaveType, startDate, endDate, reason are required" });
    const totalDays = Math.max(1, Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1);
    const now = new Date().toISOString();
    const branchId = staffMember.branchId || getBranchId(req);
    const [leave] = await db.insert(leaveApplicationsTable).values({
      staffId: staffIdInt, leaveType, startDate, endDate, totalDays, reason, status: "pending", branchId, createdAt: now,
    }).returning();
    try {
      await db.insert(notificationsTable).values({ type: "leave_application", title: "Leave Application Submitted", message: `Leave application submitted by ${staffMember.name} for ${totalDays} days from ${startDate}`, module: "hr", priority: "medium", read: false, createdAt: now, branchId });
    } catch { /* non-fatal */ }
    res.json(leave);
  }));
}
