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
  insertAccountSchema,
  insertFinanceVoucherSchema,
  insertExpenseSchema,
  insertChartOfAccountsSchema,
  insertLedgerEntrySchema,
  insertJournalEntrySchema,
  insertVendorSchema,
  insertVendorPaymentSchema,
  paymentsTable,
  payrollsTable,
  salesTable,
  challansTable,
  chartOfAccountsTable,
  vendorPaymentsTable,
} from "@shared/schema";
import { checkAccountReferences } from "../validation";
import { eq, and, gte } from "drizzle-orm";

export function registerFinanceRoutes(app: Express) {
  app.get("/api/accounts", asyncHandler(async (req, res) => {
    const accounts = filterByBranch(await storage.getAccounts(), getBranchId(req));
    res.json(accounts);
  }));

  app.get("/api/accounts/:id", asyncHandler(async (req, res) => {
    const account = await storage.getAccount(req.params.id);
    if (!account || !verifyBranch(account, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(account);
  }));

  app.post("/api/accounts", asyncHandler(async (req, res) => {
    const parsed = insertAccountSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const account = await storage.createAccount({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(account);
  }));

  app.patch("/api/accounts/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getAccount(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertAccountSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const account = await storage.updateAccount(req.params.id, parsed.data);
    if (!account) return res.status(404).json({ error: "Not found" });
    res.json(account);
  }));

  app.delete("/api/accounts/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getAccount(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkAccountReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteAccount(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/finance-vouchers", asyncHandler(async (req, res) => {
    const vouchers = filterByBranch(await storage.getFinanceVouchers(), getBranchId(req));
    res.json(vouchers);
  }));

  app.get("/api/finance-vouchers/:id", asyncHandler(async (req, res) => {
    const voucher = await storage.getFinanceVoucher(req.params.id);
    if (!voucher || !verifyBranch(voucher, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(voucher);
  }));

  app.post("/api/finance-vouchers", asyncHandler(async (req, res) => {
    const parsed = insertFinanceVoucherSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const voucher = await storage.createFinanceVoucher({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(voucher);
  }));

  app.patch("/api/finance-vouchers/:id", async (req, res) => {
    try {
      const existing = await storage.getFinanceVoucher(req.params.id);
      if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
      if (existing.status === "Posted") return res.status(400).json({ error: "Cannot edit a Posted voucher" });
      if (existing.status === "Cancelled") return res.status(400).json({ error: "Cannot edit a Cancelled voucher" });
      const { id, ...updates } = req.body;
      const parsed = insertFinanceVoucherSchema.partial().safeParse(updates);
      if (!parsed.success) return res.status(400).json({ error: parsed.error });
      const voucher = await storage.updateFinanceVoucher(req.params.id, parsed.data);
      if (!voucher) return res.status(404).json({ error: "Not found" });
      res.json(voucher);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/finance-vouchers/:id", async (req, res) => {
    try {
      const existing = await storage.getFinanceVoucher(req.params.id);
      if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
      if (existing.status === "Posted") return res.status(400).json({ error: "Cannot delete a Posted voucher" });
      const deleted = await storage.deleteFinanceVoucher(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Not found" });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/finance-vouchers/:id/post", async (req, res) => {
    try {
      const existing = await storage.getFinanceVoucher(req.params.id);
      if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Voucher not found" });
      const postedBy = (req as any).user?.email || "system";
      const voucher = await storage.postFinanceVoucher(req.params.id, postedBy);
      if (!voucher) return res.status(404).json({ error: "Voucher not found" });
      res.json(voucher);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/finance-vouchers/:id/cancel", async (req, res) => {
    try {
      const existing = await storage.getFinanceVoucher(req.params.id);
      if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Voucher not found" });
      const cancelledBy = (req as any).user?.email || "system";
      const voucher = await storage.cancelFinanceVoucher(req.params.id, cancelledBy);
      if (!voucher) return res.status(404).json({ error: "Voucher not found" });
      res.json(voucher);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/finance/dashboard", async (req, res) => {
    try {
      const branchId = getBranchId(req);
      const { from, to } = req.query as { from?: string; to?: string };

      const [allPaymentsRaw, allSalesRaw, allPayrollsRaw, allCoaRaw] = await Promise.all([
        db.select().from(paymentsTable),
        db.select().from(salesTable),
        db.select().from(payrollsTable),
        db.select().from(chartOfAccountsTable),
      ]);

      const filterBranch = <T extends { branchId?: number | null }>(arr: T[]) =>
        branchId ? arr.filter(r => r.branchId === branchId) : arr;

      const filterDate = <T extends { paymentDate?: string | null; date?: string | null }>(arr: T[], dateKey: keyof T) =>
        arr.filter(r => {
          const d = r[dateKey] as string | null | undefined;
          if (!d) return true;
          if (from && d < from) return false;
          if (to && d > to) return false;
          return true;
        });

      const filteredPayments = filterDate(filterBranch(allPaymentsRaw), "paymentDate");
      const filteredSales = filterDate(filterBranch(allSalesRaw), "date");
      const filteredPayrolls = filterBranch(allPayrollsRaw);
      const filteredCoa = filterBranch(allCoaRaw);

      const totalIncome = filteredPayments.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0)
        + filteredSales.reduce((s, sale) => s + (parseFloat(String(sale.grandTotal)) || 0), 0);
      const totalExpenses = filteredPayrolls.reduce((s, p) => s + (parseFloat(String(p.netSalary)) || 0), 0);

      const assetAccounts = filteredCoa.filter(a => (a.accountType || "").toUpperCase().includes("ASSET"));
      const liabilityAccounts = filteredCoa.filter(a => (a.accountType || "").toUpperCase().includes("LIABILIT"));
      const totalAssets = assetAccounts.reduce((s, a) => s + (parseFloat(String((a as any).balance || (a as any).openingBalance)) || 0), 0);
      const totalLiabilities = liabilityAccounts.reduce((s, a) => s + (parseFloat(String((a as any).balance || (a as any).openingBalance)) || 0), 0);

      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          label: d.toLocaleString("default", { month: "short", year: "2-digit" }),
          ym: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        };
      });

      const trend = months.map(({ label, ym }) => {
        const mp = filteredPayments.filter(p => (p.paymentDate || "").startsWith(ym));
        const ms = filteredSales.filter(s => (s.date || "").startsWith(ym));
        const income = mp.reduce((s, p) => s + (parseFloat(String(p.amount)) || 0), 0)
          + ms.reduce((s, sale) => s + (parseFloat(String(sale.grandTotal)) || 0), 0);
        const expense = filteredPayrolls
          .filter(p => {
            const pm = (p.month || "").toLowerCase();
            const parts = pm.split(" ");
            if (parts.length < 2) return false;
            const mName = parts[0].substring(0, 3);
            const yr = parts[1];
            const parsed = new Date(`${mName} 1, ${yr}`);
            if (isNaN(parsed.getTime())) return false;
            return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}` === ym;
          })
          .reduce((s, p) => s + (parseFloat(String(p.netSalary)) || 0), 0);
        return { month: label, income: Math.round(income), expenses: Math.round(expense) };
      });

      res.json({
        totalAssets: Math.round(totalAssets),
        totalLiabilities: Math.round(totalLiabilities),
        totalIncome: Math.round(totalIncome),
        totalExpenses: Math.round(totalExpenses),
        netProfit: Math.round(totalIncome - totalExpenses),
        trend,
        dateRange: { from: from || null, to: to || null },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/finance/dashboard/extended", asyncHandler(async (req, res) => {
    const branchId = getBranchId(req);
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [allVouchers, allPayments, allPayrolls, allSales, allChallans] = await Promise.all([
      storage.getFinanceVouchers(),
      db.select({ amount: paymentsTable.amount, branchId: paymentsTable.branchId, paymentDate: paymentsTable.paymentDate })
        .from(paymentsTable).where(and(eq(paymentsTable.branchId, branchId), gte(paymentsTable.paymentDate, monthStart))),
      db.select({ netSalary: payrollsTable.netSalary, month: payrollsTable.month, status: payrollsTable.status, branchId: payrollsTable.branchId })
        .from(payrollsTable).where(eq(payrollsTable.branchId, branchId)),
      db.select({ grandTotal: salesTable.grandTotal, date: salesTable.date, branchId: salesTable.branchId })
        .from(salesTable).where(and(eq(salesTable.branchId, branchId), gte(salesTable.date, monthStart))),
      db.select({ balanceAmount: challansTable.balanceAmount, status: challansTable.status, branchId: challansTable.branchId })
        .from(challansTable).where(eq(challansTable.branchId, branchId)),
    ]);

    const unpostedVouchers = allVouchers
      .filter((v: any) => (!v.branchId || v.branchId === branchId) && v.status === "Draft").length;
    const thisMonthFeeIncome = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const thisMonthSalaryExpense = allPayrolls
      .filter((p: any) => {
        if (!p.month || p.status !== "Paid") return false;
        const parts = (p.month as string).trim().toLowerCase().split(" ");
        if (parts.length < 2) return false;
        const mName = parts[0].substring(0, 3);
        const yr = parts[1];
        const parsed = new Date(`${mName} 1, ${yr}`);
        if (isNaN(parsed.getTime())) return false;
        return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}` === currentMonth;
      })
      .reduce((s, p) => s + (p.netSalary || 0), 0);
    const thisMonthSalesIncome = allSales.reduce((s, sale) => s + (sale.grandTotal || 0), 0);

    let thisMonthHostelIncome = 0;
    try {
      const hostelFees = await storage.getHostelFees();
      thisMonthHostelIncome = hostelFees
        .filter((f: any) => (!f.branchId || f.branchId === branchId) && f.status === "Paid" && f.paidDate && f.paidDate.startsWith(currentMonth))
        .reduce((s: number, f: any) => s + (f.amount || 0), 0);
    } catch { /* non-fatal */ }

    const totalReceivable = allChallans
      .filter((c: any) => c.status === "Pending" || c.status === "Partial")
      .reduce((s, c) => s + (c.balanceAmount || 0), 0);

    res.json({ unpostedVouchers, thisMonthFeeIncome, thisMonthSalaryExpense, thisMonthSalesIncome, thisMonthHostelIncome, totalReceivable });
  }));

  app.get("/api/finance/reports/trial-balance", async (req, res) => {
    try {
      const entries = filterByBranch(await storage.getLedgerEntries(), getBranchId(req));
      const accountBalances: Record<string, { accountCode: string; accountName: string; debit: number; credit: number }> = {};
      for (const entry of entries) {
        if (!accountBalances[entry.accountId]) {
          accountBalances[entry.accountId] = {
            accountCode: entry.accountCode,
            accountName: entry.accountName,
            debit: 0,
            credit: 0,
          };
        }
        accountBalances[entry.accountId].debit += entry.debit;
        accountBalances[entry.accountId].credit += entry.credit;
      }
      const trialBalance = Object.entries(accountBalances).map(([accountId, data]) => ({
        accountId,
        accountCode: data.accountCode,
        accountName: data.accountName,
        totalDebit: data.debit,
        totalCredit: data.credit,
        balance: data.debit - data.credit,
      }));
      trialBalance.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      const totalDebit = trialBalance.reduce((s, r) => s + r.totalDebit, 0);
      const totalCredit = trialBalance.reduce((s, r) => s + r.totalCredit, 0);
      res.json({ accounts: trialBalance, totalDebit, totalCredit });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/expenses", asyncHandler(async (req, res) => {
    const expenses = filterByBranch(await storage.getExpenses(), getBranchId(req));
    res.json(expenses);
  }));

  app.get("/api/expenses/:id", asyncHandler(async (req, res) => {
    const expense = await storage.getExpense(req.params.id);
    if (!expense || !verifyBranch(expense, getBranchId(req))) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  }));

  app.post("/api/expenses", asyncHandler(async (req, res) => {
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const expense = await storage.createExpense({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(expense);
  }));

  app.patch("/api/expenses/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getExpense(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Expense not found" });
    const expense = await storage.updateExpense(req.params.id, req.body);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.json(expense);
  }));

  app.delete("/api/expenses/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getExpense(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Expense not found" });
    const success = await storage.deleteExpense(req.params.id);
    if (!success) return res.status(404).json({ error: "Expense not found" });
    res.json({ success: true });
  }));

  app.get("/api/chart-of-accounts", asyncHandler(async (req, res) => {
    const accounts = filterByBranch(await storage.getChartOfAccounts(), getBranchId(req));
    res.json(accounts);
  }));

  app.get("/api/chart-of-accounts/:id", asyncHandler(async (req, res) => {
    const account = await storage.getChartOfAccount(req.params.id);
    if (!account || !verifyBranch(account, getBranchId(req))) return res.status(404).json({ error: "Account not found" });
    res.json(account);
  }));

  app.post("/api/chart-of-accounts", asyncHandler(async (req, res) => {
    const parsed = insertChartOfAccountsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const account = await storage.createChartOfAccount({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(account);
  }));

  app.patch("/api/chart-of-accounts/:id", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const branchId = getBranchId(req);
    const [existing] = await db.select().from(chartOfAccountsTable).where(eq(chartOfAccountsTable.id, id));
    if (!existing || (branchId && existing.branchId !== branchId)) return res.status(404).json({ error: "Account not found" });
    const { accountName, accountType, description, openingBalance, currentBalance, isActive, parentAccountId, level } = req.body;
    const updates: any = {};
    if (accountName !== undefined) updates.accountName = accountName;
    if (accountType !== undefined) updates.accountType = accountType;
    if (description !== undefined) updates.description = description;
    if (openingBalance !== undefined) updates.openingBalance = parseFloat(openingBalance);
    if (currentBalance !== undefined) updates.currentBalance = parseFloat(currentBalance);
    if (isActive !== undefined) updates.isActive = isActive;
    if (parentAccountId !== undefined) updates.parentAccountId = parentAccountId;
    if (level !== undefined) updates.level = level;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "No fields to update" });
    const [updated] = await db.update(chartOfAccountsTable).set(updates).where(eq(chartOfAccountsTable.id, id)).returning();
    res.json(updated);
  }));

  app.patch("/api/chart-of-accounts/:id/opening-balance", asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const branchId = getBranchId(req);
    const [existing] = await db.select().from(chartOfAccountsTable).where(eq(chartOfAccountsTable.id, id));
    if (!existing || (branchId && existing.branchId !== branchId)) return res.status(404).json({ error: "Account not found" });
    const { openingBalance } = req.body;
    if (openingBalance === undefined) return res.status(400).json({ error: "openingBalance is required" });
    const [updated] = await db.update(chartOfAccountsTable)
      .set({ openingBalance: parseFloat(openingBalance), currentBalance: parseFloat(openingBalance) })
      .where(eq(chartOfAccountsTable.id, id))
      .returning();
    res.json(updated);
  }));

  app.delete("/api/chart-of-accounts/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getChartOfAccount(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Account not found" });
    const success = await storage.deleteChartOfAccount(req.params.id);
    if (!success) return res.status(404).json({ error: "Account not found" });
    res.json({ success: true });
  }));

  app.get("/api/ledger-entries", async (req, res) => {
    try {
      const branchId = getBranchId(req);
      const { accountId, fromDate, toDate, page, limit: limitStr } = req.query;
      let entries;
      if (accountId || fromDate || toDate) {
        entries = filterByBranch(await storage.getLedgerEntriesByAccountAndDate(
          accountId as string | undefined,
          fromDate as string | undefined,
          toDate as string | undefined,
        ), branchId);
      } else {
        entries = filterByBranch(await storage.getLedgerEntries(), branchId);
      }
      if (page) {
        const pageNum = Math.max(1, parseInt(String(page)));
        const limitNum = Math.min(500, Math.max(1, parseInt(String(limitStr || "100"))));
        const total = entries.length;
        const offset = (pageNum - 1) * limitNum;
        return res.json({ data: entries.slice(offset, offset + limitNum), total, page: pageNum, limit: limitNum });
      }
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/ledger-entries/:id", asyncHandler(async (req, res) => {
    const entry = await storage.getLedgerEntry(req.params.id);
    if (!entry || !verifyBranch(entry, getBranchId(req))) return res.status(404).json({ error: "Ledger entry not found" });
    res.json(entry);
  }));

  app.get("/api/ledger-entries/account/:accountId", asyncHandler(async (req, res) => {
    const entries = filterByBranch(await storage.getLedgerEntriesByAccount(req.params.accountId), getBranchId(req));
    res.json(entries);
  }));

  app.post("/api/ledger-entries", asyncHandler(async (req, res) => {
    const parsed = insertLedgerEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const entry = await storage.createLedgerEntry({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(entry);
  }));

  app.patch("/api/ledger-entries/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLedgerEntry(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Ledger entry not found" });
    const entry = await storage.updateLedgerEntry(req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: "Ledger entry not found" });
    res.json(entry);
  }));

  app.delete("/api/ledger-entries/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getLedgerEntry(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Ledger entry not found" });
    const success = await storage.deleteLedgerEntry(req.params.id);
    if (!success) return res.status(404).json({ error: "Ledger entry not found" });
    res.json({ success: true });
  }));

  app.get("/api/journal-entries", asyncHandler(async (req, res) => {
    const entries = filterByBranch(await storage.getJournalEntries(), getBranchId(req));
    res.json(entries);
  }));

  app.get("/api/journal-entries/:id", asyncHandler(async (req, res) => {
    const entry = await storage.getJournalEntry(req.params.id);
    if (!entry || !verifyBranch(entry, getBranchId(req))) return res.status(404).json({ error: "Journal entry not found" });
    res.json(entry);
  }));

  app.post("/api/journal-entries", asyncHandler(async (req, res) => {
    const parsed = insertJournalEntrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const entry = await storage.createJournalEntry({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.json(entry);
  }));

  app.patch("/api/journal-entries/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getJournalEntry(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Journal entry not found" });
    const entry = await storage.updateJournalEntry(req.params.id, req.body);
    if (!entry) return res.status(404).json({ error: "Journal entry not found" });
    res.json(entry);
  }));

  app.delete("/api/journal-entries/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getJournalEntry(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Journal entry not found" });
    const success = await storage.deleteJournalEntry(req.params.id);
    if (!success) return res.status(404).json({ error: "Journal entry not found" });
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

    const [vendorPayment] = await db.insert(vendorPaymentsTable).values({
      ...data,
      branchId,
      schoolId,
      createdAt: new Date().toISOString(),
    }).returning();

    const voucherNo = `VP-${Date.now()}`;
    try {
      await storage.createJournalEntry({
        voucherNo,
        voucherType: "Payment",
        date: data.paymentDate || new Date().toISOString().split("T")[0],
        description: `Vendor payment: ${data.description || ""}`,
        branchId,
        schoolId,
        entries: [
          { accountCode: "2001", debit: 0, credit: parseFloat(String(data.amount)) || 0, description: "Accounts Payable" },
          { accountCode: "1001", debit: parseFloat(String(data.amount)) || 0, credit: 0, description: "Cash/Bank outflow" },
        ],
      } as any);
    } catch { /* non-fatal */ }

    res.status(201).json(vendorPayment);
  }));
}
