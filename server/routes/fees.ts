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
import {
  insertFeeStructureSchema,
  insertDiscountRuleSchema,
  insertLateFeeRuleSchema,
  insertInstallmentPlanSchema,
  insertChallanSchema,
  insertPaymentSchema,
  insertVendorSchema,
  insertVendorPaymentSchema,
  studentsTable,
  challansTable,
  notificationsTable,
  parentStudentLinksTable,
  parentNotificationsTable,
  vendorPaymentsTable,
} from "@shared/schema";
import { eq, and, inArray } from "drizzle-orm";

async function applyComputedLateFee(challans: any[], branchId: number): Promise<any[]> {
  const allRules = filterByBranch(await storage.getLateFeeRules(), branchId);
  const activeRule = allRules.find((r: any) => r.isActive !== false) || null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return challans.map((challan: any) => {
    if (challan.status === "Paid" || !challan.dueDate || !activeRule) {
      return { ...challan, computedLateFee: challan.lateFee || 0 };
    }
    const due = new Date(challan.dueDate);
    due.setHours(0, 0, 0, 0);
    if (today <= due) return { ...challan, computedLateFee: 0 };
    const daysOverdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) - (activeRule.gracePeriodDays || 0);
    if (daysOverdue <= 0) return { ...challan, computedLateFee: 0 };
    let computedLateFee = 0;
    if (activeRule.type === "Fixed") {
      computedLateFee = activeRule.value;
    } else if (activeRule.type === "Percentage") {
      computedLateFee = ((challan.totalAmount || 0) * activeRule.value) / 100;
    }
    if (activeRule.maxLateFee != null && activeRule.maxLateFee > 0) {
      computedLateFee = Math.min(computedLateFee, activeRule.maxLateFee);
    }
    return { ...challan, computedLateFee };
  });
}

export function registerFeesRoutes(app: Express) {
  app.get("/api/fee-structures", asyncHandler(async (req, res) => {
    const structures = filterByBranch(await storage.getFeeStructures(), getBranchId(req));
    res.json(structures);
  }));

  app.get("/api/fee-structures/:id", asyncHandler(async (req, res) => {
    const structure = await storage.getFeeStructure(req.params.id);
    if (!structure || !verifyBranch(structure, getBranchId(req))) return res.status(404).json({ error: "Fee structure not found" });
    res.json(structure);
  }));

  app.post("/api/fee-structures", asyncHandler(async (req, res) => {
    const parsed = insertFeeStructureSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const structure = await storage.createFeeStructure({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(structure);
  }));

  app.patch("/api/fee-structures/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getFeeStructure(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Fee structure not found" });
    const structure = await storage.updateFeeStructure(req.params.id, req.body);
    if (!structure) return res.status(404).json({ error: "Fee structure not found" });
    res.json(structure);
  }));

  app.delete("/api/fee-structures/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getFeeStructure(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Fee structure not found" });
    const success = await storage.deleteFeeStructure(req.params.id);
    if (!success) return res.status(404).json({ error: "Fee structure not found" });
    res.json({ success: true });
  }));

  app.get("/api/discount-rules", asyncHandler(async (req, res) => {
    const rules = filterByBranch(await storage.getDiscountRules(), getBranchId(req));
    res.json(rules);
  }));

  app.get("/api/discount-rules/:id", asyncHandler(async (req, res) => {
    const rule = await storage.getDiscountRule(req.params.id);
    if (!rule || !verifyBranch(rule, getBranchId(req))) return res.status(404).json({ error: "Discount rule not found" });
    res.json(rule);
  }));

  app.post("/api/discount-rules", asyncHandler(async (req, res) => {
    const parsed = insertDiscountRuleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const rule = await storage.createDiscountRule({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(rule);
  }));

  app.patch("/api/discount-rules/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDiscountRule(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Discount rule not found" });
    const rule = await storage.updateDiscountRule(req.params.id, req.body);
    if (!rule) return res.status(404).json({ error: "Discount rule not found" });
    res.json(rule);
  }));

  app.delete("/api/discount-rules/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDiscountRule(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Discount rule not found" });
    const success = await storage.deleteDiscountRule(req.params.id);
    if (!success) return res.status(404).json({ error: "Discount rule not found" });
    res.json({ success: true });
  }));

  app.get("/api/late-fee-rules", asyncHandler(async (req, res) => {
    const rules = filterByBranch(await storage.getLateFeeRules(), getBranchId(req));
    res.json(rules);
  }));

  app.get("/api/late-fee-rules/:id", asyncHandler(async (req, res) => {
    const rule = await storage.getLateFeeRule(req.params.id);
    if (!rule || !verifyBranch(rule, getBranchId(req))) return res.status(404).json({ error: "Late fee rule not found" });
    res.json(rule);
  }));

  app.post("/api/late-fee-rules", asyncHandler(async (req, res) => {
    const parsed = insertLateFeeRuleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const rule = await storage.createLateFeeRule({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(rule);
  }));

  app.patch("/api/late-fee-rules/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLateFeeRule(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Late fee rule not found" });
    const rule = await storage.updateLateFeeRule(req.params.id, req.body);
    if (!rule) return res.status(404).json({ error: "Late fee rule not found" });
    res.json(rule);
  }));

  app.delete("/api/late-fee-rules/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLateFeeRule(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Late fee rule not found" });
    const success = await storage.deleteLateFeeRule(req.params.id);
    if (!success) return res.status(404).json({ error: "Late fee rule not found" });
    res.json({ success: true });
  }));

  app.get("/api/installment-plans", asyncHandler(async (req, res) => {
    const plans = filterByBranch(await storage.getInstallmentPlans(), getBranchId(req));
    res.json(plans);
  }));

  app.get("/api/installment-plans/:id", asyncHandler(async (req, res) => {
    const plan = await storage.getInstallmentPlan(req.params.id);
    if (!plan || !verifyBranch(plan, getBranchId(req))) return res.status(404).json({ error: "Installment plan not found" });
    res.json(plan);
  }));

  app.post("/api/installment-plans", asyncHandler(async (req, res) => {
    const parsed = insertInstallmentPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const plan = await storage.createInstallmentPlan({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(plan);
  }));

  app.patch("/api/installment-plans/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getInstallmentPlan(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Installment plan not found" });
    const plan = await storage.updateInstallmentPlan(req.params.id, req.body);
    if (!plan) return res.status(404).json({ error: "Installment plan not found" });
    res.json(plan);
  }));

  app.delete("/api/installment-plans/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getInstallmentPlan(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Installment plan not found" });
    const success = await storage.deleteInstallmentPlan(req.params.id);
    if (!success) return res.status(404).json({ error: "Installment plan not found" });
    res.json({ success: true });
  }));

  app.get("/api/fee/defaulters", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { agingBucket, class: filterClass, search } = req.query as Record<string, string>;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const allChallans = filterByBranch(await storage.getChallans(), branchId);
    const overdueChallans = allChallans.filter(c =>
      (c.status === "Pending" || c.status === "Partial") && c.dueDate < todayStr
    );
    const defaulters = overdueChallans.map(c => {
      const due = new Date(c.dueDate);
      const daysOverdue = Math.floor(Math.abs(today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      const outstandingAmount = c.netAmount - c.paidAmount;
      const bucket = daysOverdue <= 30 ? "0-30" : daysOverdue <= 60 ? "31-60" : daysOverdue <= 90 ? "61-90" : "90+";
      return {
        studentId: c.studentId,
        studentName: c.studentName,
        class: (c as any).class,
        section: (c as any).section,
        challanNo: c.challanNo,
        period: c.period,
        dueDate: c.dueDate,
        daysOverdue,
        netAmount: c.netAmount,
        paidAmount: c.paidAmount,
        outstandingAmount,
        agingBucket: bucket,
        studentStatus: "Active",
        status: c.status,
      };
    });
    let filtered = defaulters;
    if (agingBucket && agingBucket !== "all") {
      const bucketMap: Record<string, string> = { "30": "0-30", "60": "31-60", "90": "61-90", "90plus": "90+" };
      const target = bucketMap[agingBucket] || agingBucket;
      filtered = filtered.filter(d => d.agingBucket === target);
    }
    if (filterClass) filtered = filtered.filter(d => d.class === filterClass);
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(d => d.studentName.toLowerCase().includes(s) || d.studentId.toLowerCase().includes(s));
    }
    filtered.sort((a, b) => b.daysOverdue - a.daysOverdue);
    const summary = {
      total_defaulters: defaulters.length,
      total_outstanding: defaulters.reduce((s, d) => s + d.outstandingAmount, 0),
      bucket_0_30: { count: defaulters.filter(d => d.agingBucket === "0-30").length, amount: defaulters.filter(d => d.agingBucket === "0-30").reduce((s, d) => s + d.outstandingAmount, 0) },
      bucket_31_60: { count: defaulters.filter(d => d.agingBucket === "31-60").length, amount: defaulters.filter(d => d.agingBucket === "31-60").reduce((s, d) => s + d.outstandingAmount, 0) },
      bucket_61_90: { count: defaulters.filter(d => d.agingBucket === "61-90").length, amount: defaulters.filter(d => d.agingBucket === "61-90").reduce((s, d) => s + d.outstandingAmount, 0) },
      bucket_90_plus: { count: defaulters.filter(d => d.agingBucket === "90+").length, amount: defaulters.filter(d => d.agingBucket === "90+").reduce((s, d) => s + d.outstandingAmount, 0) },
    };
    res.json({ summary, defaulters: filtered });
  }));

  app.get("/api/challans", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const challans = filterByBranch(await storage.getChallans(), branchId);
    res.json(await applyComputedLateFee(challans, branchId));
  }));

  app.get("/api/challans/bulk-preview", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const { feeStructureId, month, year, classFilter, sectionFilter } = req.query as Record<string, string>;
    if (!feeStructureId || !month || !year) {
      return res.status(400).json({ error: "feeStructureId, month, and year are required" });
    }
    const period = `${month} ${year}`;
    const conditions: any[] = [eq(studentsTable.branchId, branchId), eq(studentsTable.status, "Active")];
    if (classFilter) conditions.push(eq(studentsTable.class, classFilter));
    if (sectionFilter) conditions.push(eq(studentsTable.section, sectionFilter));
    const students = await db.select().from(studentsTable).where(and(...conditions));
    const existingChallans = await db.select({ studentId: challansTable.studentId }).from(challansTable)
      .where(and(eq(challansTable.branchId, branchId), eq(challansTable.period, period)));
    const existingIds = new Set(existingChallans.map(c => c.studentId));
    const studentsList = students.map(s => ({
      id: s.id, name: s.name, class: s.class, section: s.section, studentId: s.studentId,
      challanStatus: existingIds.has(s.studentId) ? "exists" : "will_create",
    }));
    res.json({
      totalStudents: students.length,
      willBeCreated: studentsList.filter(s => s.challanStatus === "will_create").length,
      alreadyExist: studentsList.filter(s => s.challanStatus === "exists").length,
      studentsList,
    });
  }));

  app.post("/api/challans/bulk", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const schoolId = getSchoolId(req);
    const { feeStructureId, month, year, classFilter, sectionFilter, dueDate } = req.body;
    if (!feeStructureId || !month || !year || !dueDate) {
      return res.status(400).json({ error: "feeStructureId, month, year, and dueDate are required" });
    }
    const period = `${month} ${year}`;
    const structure = await storage.getFeeStructure(String(feeStructureId));
    if (!structure) return res.status(404).json({ error: "Fee structure not found" });
    const conditions: any[] = [eq(studentsTable.branchId, branchId), eq(studentsTable.status, "Active")];
    if (classFilter) conditions.push(eq(studentsTable.class, classFilter));
    if (sectionFilter) conditions.push(eq(studentsTable.section, sectionFilter));
    const students = await db.select().from(studentsTable).where(and(...conditions));
    const existingChallans = await db.select({ studentId: challansTable.studentId }).from(challansTable)
      .where(and(eq(challansTable.branchId, branchId), eq(challansTable.period, period)));
    const existingIds = new Set(existingChallans.map(c => c.studentId));
    const toCreate = students.filter(s => !existingIds.has(s.studentId));
    const issueDate = new Date().toISOString().split("T")[0];
    let created = 0;
    for (const student of toCreate) {
      try {
        const net = (structure as any).totalAmount || 0;
        await storage.createChallan({
          studentId: student.studentId,
          studentName: student.name,
          class: student.class,
          section: student.section,
          academicSession: (structure as any).academicSession || String(year),
          period,
          feeStructureId: String(feeStructureId),
          feeHeads: ((structure as any).feeHeads || []).map((fh: any) => ({ name: fh.name, amount: fh.amount })),
          totalAmount: net,
          discountAmount: 0,
          lateFee: 0,
          adjustments: 0,
          netAmount: net,
          paidAmount: 0,
          balanceAmount: net,
          issueDate,
          dueDate,
          status: "Pending",
          branchId,
          schoolId,
        } as any);
        created++;
      } catch (err) {
        console.warn(`[BulkChallan] Failed for student ${student.studentId}:`, (err as Error).message);
      }
    }
    try {
      await db.insert(notificationsTable).values({
        type: "bulk_challan", title: "Bulk Challans Generated",
        message: `${created} challans created for ${period}. ${existingIds.size} skipped (already existed).`,
        module: "fee", priority: "medium", read: false, createdAt: new Date().toISOString(), branchId,
      });
    } catch { /* non-fatal */ }
    res.json({ totalStudents: students.length, created, skipped: existingIds.size });
  }));

  app.get("/api/challans/student/:studentId", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const challans = filterByBranch(await storage.getChallansByStudent(req.params.studentId), branchId);
    res.json(await applyComputedLateFee(challans, branchId));
  }));

  app.get("/api/challans/:id", asyncHandler(async (req, res) => {
    const challan = await storage.getChallan(req.params.id);
    if (!challan || !verifyBranch(challan, getBranchId(req))) return res.status(404).json({ error: "Challan not found" });
    const [withLateFee] = await applyComputedLateFee([challan], getBranchId(req));
    res.json(withLateFee);
  }));

  app.post("/api/challans", asyncHandler(async (req, res) => {
    const parsed = insertChallanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const challan = await storage.createChallan({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    try {
      const sId = parsed.data.studentId;
      if (sId) {
        const parentLinks = await db.select().from(parentStudentLinksTable).where(eq(parentStudentLinksTable.studentId, sId));
        for (const link of parentLinks) {
          await db.insert(parentNotificationsTable).values({
            parentId: link.parentId, studentId: sId, type: "fee_due",
            title: `Fee Challan: ${(challan as any).challanNo || "New"}`,
            body: `Amount: Rs. ${parsed.data.netAmount || parsed.data.totalAmount}. Due: ${parsed.data.dueDate || "N/A"}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch { /* non-fatal */ }
    try {
      if ((challan as any).netAmount > 0) {
        await (storage as any).createAutoPostedVoucher({
          type: "Journal",
          date: (challan as any).issueDate || new Date().toISOString().split("T")[0],
          debitAccountCode: "1003",
          creditAccountCode: "4001",
          amount: (challan as any).netAmount,
          narration: `Fee Challan raised — ${(challan as any).challanNo} — ${(challan as any).studentName} — ${(challan as any).period}`,
          reference: `AR-${(challan as any).challanNo}`,
          referenceType: "ChallanAR",
          createdBy: "system",
          branchId: getBranchId(req),
          sourceModule: "fee",
        });
      }
    } catch (e) {
      console.warn(`[AR] Auto-voucher for challan ${(challan as any).challanNo} failed (non-fatal):`, (e as Error).message);
    }
    res.json(challan);
  }));

  app.patch("/api/challans/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getChallan(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Challan not found" });
    const challan = await storage.updateChallan(req.params.id, req.body);
    if (!challan) return res.status(404).json({ error: "Challan not found" });
    res.json(challan);
  }));

  app.delete("/api/challans/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getChallan(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Challan not found" });
    const success = await storage.deleteChallan(req.params.id);
    if (!success) return res.status(404).json({ error: "Challan not found" });
    res.json({ success: true });
  }));

  app.get("/api/payments", asyncHandler(async (req, res) => {
    const payments = filterByBranch(await storage.getPayments(), getBranchId(req));
    res.json(payments);
  }));

  app.get("/api/payments/challan/:challanId", asyncHandler(async (req, res) => {
    const payments = filterByBranch(await storage.getPaymentsByChallan(req.params.challanId), getBranchId(req));
    res.json(payments);
  }));

  app.get("/api/payments/:id", asyncHandler(async (req, res) => {
    const payment = await storage.getPayment(req.params.id);
    if (!payment || !verifyBranch(payment, getBranchId(req))) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  }));

  app.post("/api/payments", asyncHandler(async (req, res) => {
    const parsed = insertPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const payment = await storage.createPayment({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });

    const challan = await storage.getChallan(parsed.data.challanId);
    if (challan && parsed.data.type === "Payment") {
      const newPaidAmount = challan.paidAmount + parsed.data.amount;
      const newBalance = challan.netAmount - newPaidAmount;
      const newStatus = newBalance <= 0 ? "Paid" : newBalance < challan.netAmount ? "Partial" : challan.status;
      await storage.updateChallan(challan.id, { paidAmount: newPaidAmount, balanceAmount: Math.max(0, newBalance), status: newStatus });
    }

    if (parsed.data.type === "Payment" && parsed.data.amount > 0) {
      try {
        const paymentModeToAccount: Record<string, string> = { "Cash": "1001", "Bank Transfer": "1002", "Cheque": "1002", "Online": "1002", "Card": "1002" };
        const debitAccountCode = paymentModeToAccount[parsed.data.paymentMode] || "1001";
        await (storage as any).createAutoPostedVoucher({
          type: "Receipt",
          date: parsed.data.paymentDate,
          debitAccountCode,
          creditAccountCode: "1003",
          amount: parsed.data.amount,
          narration: `Fee collection from ${parsed.data.studentName} - Receipt #${(payment as any).receiptNo}`,
          reference: (payment as any).receiptNo,
          referenceType: "FeeCollection",
          createdBy: parsed.data.receivedBy || "system",
          branchId: getBranchId(req),
          sourceModule: "fee",
        });
      } catch (voucherErr) {
        console.warn("[Fee] Auto-voucher posting failed (non-fatal):", (voucherErr as Error).message);
      }
    }

    try {
      const sId = challan?.studentId || parsed.data.studentId;
      if (sId) {
        const parentLinks = await db.select().from(parentStudentLinksTable).where(eq(parentStudentLinksTable.studentId, sId));
        for (const link of parentLinks) {
          await db.insert(parentNotificationsTable).values({
            parentId: link.parentId, studentId: sId, type: "fee_paid",
            title: `Fee Payment Received`,
            body: `Rs. ${parsed.data.amount} received — Receipt #${(payment as any).receiptNo}. Paid by: ${parsed.data.paymentMode || "Cash"}.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch { /* non-fatal */ }

    res.json(payment);
  }));

  app.patch("/api/payments/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getPayment(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Payment not found" });
    const payment = await storage.updatePayment(req.params.id, req.body);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    res.json(payment);
  }));

  app.delete("/api/payments/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getPayment(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Payment not found" });
    const success = await storage.deletePayment(req.params.id);
    if (!success) return res.status(404).json({ error: "Payment not found" });
    res.json({ success: true });
  }));

  app.get("/api/vendors", asyncHandler(async (req, res) => {
    const vendors = filterByBranch(await storage.getVendors(), getBranchId(req));
    res.json(vendors);
  }));

  app.get("/api/vendors/:id", asyncHandler(async (req, res) => {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor || !verifyBranch(vendor, getBranchId(req))) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  }));

  app.post("/api/vendors", asyncHandler(async (req, res) => {
    const parsed = insertVendorSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vendor = await storage.createVendor({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(vendor);
  }));

  app.patch("/api/vendors/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVendor(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Vendor not found" });
    const vendor = await storage.updateVendor(req.params.id, req.body);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  }));

  app.delete("/api/vendors/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVendor(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Vendor not found" });
    const success = await storage.deleteVendor(req.params.id);
    if (!success) return res.status(404).json({ error: "Vendor not found" });
    res.json({ success: true });
  }));

  app.get("/api/vendor-payments", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const rows = branchId
      ? await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.branchId, branchId))
      : await db.select().from(vendorPaymentsTable);
    res.json(rows);
  }));

  app.get("/api/vendors/:id/payments", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor || !verifyBranch(vendor, getBranchId(req))) return res.status(404).json({ error: "Vendor not found" });
    const rows = branchId
      ? await db.select().from(vendorPaymentsTable).where(and(eq(vendorPaymentsTable.vendorId, req.params.id), eq(vendorPaymentsTable.branchId, branchId)))
      : await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.vendorId, req.params.id));
    res.json(rows);
  }));

  app.get("/api/vendors/:id/balance", asyncHandler(async (req, res) => {
    const vendor = await storage.getVendor(req.params.id);
    if (!vendor || !verifyBranch(vendor, getBranchId(req))) return res.status(404).json({ error: "Vendor not found" });
    const payments = await db.select().from(vendorPaymentsTable).where(eq(vendorPaymentsTable.vendorId, req.params.id));
    const totalPaid = payments.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0);
    const creditLimit = parseFloat(String((vendor as any).creditLimit)) || 0;
    const outstanding = parseFloat(String((vendor as any).outstandingBalance)) || 0;
    res.json({ vendorId: req.params.id, vendorName: vendor.name, totalPaid, creditLimit, outstanding, payments });
  }));

  app.post("/api/vendor-payments", asyncHandler(async (req, res) => {
    const parsed = insertVendorPaymentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const branchId = getBranchId(req);
    const schoolId = getSchoolId(req);
    const data = parsed.data as any;
    const [vendorPayment] = await db.insert(vendorPaymentsTable).values({ ...data, branchId, schoolId, createdAt: new Date().toISOString() }).returning();
    try {
      await storage.createJournalEntry({
        voucherNo: `VP-${Date.now()}`,
        voucherType: "Payment",
        date: data.paymentDate || new Date().toISOString().split("T")[0],
        description: `Vendor payment: ${data.description || ""}`,
        branchId, schoolId,
        entries: [
          { accountCode: "2001", debit: 0, credit: parseFloat(String(data.amount)) || 0, description: "Accounts Payable" },
          { accountCode: "1001", debit: parseFloat(String(data.amount)) || 0, credit: 0, description: "Cash/Bank outflow" },
        ],
      } as any);
    } catch { /* non-fatal */ }
    res.status(201).json(vendorPayment);
  }));
}
