import {
  type Student, type InsertStudent,
  type Staff, type InsertStaff,
  type Vacancy, type InsertVacancy,
  type Applicant, type InsertApplicant,
  type FeeVoucher, type InsertFeeVoucher,
  type Payroll, type InsertPayroll,
  type Account, type InsertAccount,
  type FinanceVoucher, type InsertFinanceVoucher,
  type Timetable, type InsertTimetable,
  type DateSheet, type InsertDateSheet,
  type Curriculum, type InsertCurriculum,
  type Exam, type InsertExam,
  type Result, type InsertResult,
  type PosItem, type InsertPosItem,
  type Sale, type InsertSale,
  type Book, type InsertBook,
  type LibraryMember, type InsertLibraryMember,
  type BookIssue, type InsertBookIssue,
  type BookCategory, type InsertBookCategory,
  type Route, type InsertRoute,
  type Vehicle, type InsertVehicle,
  type Driver, type InsertDriver,
  type StudentTransport, type InsertStudentTransport,
  type HostelRoom, type InsertHostelRoom,
  type HostelResident, type InsertHostelResident,
  type HostelFee, type InsertHostelFee,
  type Notification, type InsertNotification,
  type ActivityLog, type InsertActivityLog,
  type FeeStructure, type InsertFeeStructure,
  type DiscountRule, type InsertDiscountRule,
  type LateFeeRule, type InsertLateFeeRule,
  type InstallmentPlan, type InsertInstallmentPlan,
  type Challan, type InsertChallan,
  type Payment, type InsertPayment,
  type Vendor, type InsertVendor,
  type Expense, type InsertExpense,
  type ChartOfAccounts, type InsertChartOfAccounts,
  type LedgerEntry, type InsertLedgerEntry,
  type JournalEntry, type InsertJournalEntry,
  type AttendanceRecord, type InsertAttendanceRecord,
  type AttendanceSummary,
  type Question, type InsertQuestion,
  type Quiz, type InsertQuiz,
  type QuizAttempt, type InsertQuizAttempt,
  moduleUserCredentials,
  type ModuleType,
  type UserRole,
  studentsTable,
  staffTable,
  vacanciesTable,
  applicantsTable,
  feeVouchersTable,
  payrollsTable,
  accountsTable,
  financeVouchersTable,
  timetablesTable,
  dateSheetsTable,
  curriculumsTable,
  examsTable,
  examResultsTable,
  questionsTable,
  quizzesTable,
  quizAttemptsTable,
  posItemsTable,
  salesTable,
  booksTable,
  libraryMembersTable,
  bookIssuesTable,
  bookCategoriesTable,
  routesTable,
  vehiclesTable,
  driversTable,
  studentTransportsTable,
  hostelRoomsTable,
  hostelResidentsTable,
  hostelFeesTable,
  notificationsTable,
  activityLogsTable,
  feeStructuresTable,
  discountRulesTable,
  lateFeeRulesTable,
  installmentPlansTable,
  challansTable,
  paymentsTable,
  vendorsTable,
  expensesTable,
  chartOfAccountsTable,
  ledgerEntriesTable,
  journalEntriesTable,
  attendanceRecordsTable,
  counters,
  teacherAssignmentsTable,
  teacherContentsTable,
  teacherQuizzesTable,
  studentQuizAttemptsTable,
  studentPortalAccountsTable,
  teacherAuthPasswordsTable,
} from "@shared/schema";
import { type IStorage, type LoginResult } from "./storage";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, like, count, asc, isNull, or } from "drizzle-orm";

function toStr(id: number): string {
  return String(id);
}

function toDTO<T>(row: any): T {
  if (!row) return row;
  return { ...row, id: String(row.id) } as T;
}

function toDTOArray<T>(rows: any[]): T[] {
  return rows.map(r => toDTO<T>(r));
}

function parseId(id: string): number {
  const n = parseInt(id, 10);
  if (isNaN(n)) throw new Error(`Invalid ID: ${id}`);
  return n;
}

export class PgStorage implements IStorage {
  async validateLogin(module: ModuleType, email: string, password: string): Promise<LoginResult> {
    const creds = moduleUserCredentials[module];
    if (!creds) return { valid: false };
    if (email.toLowerCase() === creds.email.toLowerCase() && password === creds.password) {
      return { valid: true, role: creds.role as UserRole, name: creds.name };
    }
    return { valid: false };
  }

  async getStudents(): Promise<Student[]> {
    const rows = await db.select().from(studentsTable).orderBy(desc(studentsTable.id));
    return toDTOArray<Student>(rows);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [row] = await db.select().from(studentsTable).where(eq(studentsTable.id, parseId(id)));
    return row ? toDTO<Student>(row) : undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const classCode = student.class.replace(/class\s*/i, "C");
    const section = student.section.toUpperCase();
    const admissionYear = student.admissionDate
      ? new Date(student.admissionDate).getFullYear()
      : new Date().getFullYear();
    const prefix = `${classCode}-${section}-${admissionYear}-`;

    const existing = await db.select({ studentId: studentsTable.studentId })
      .from(studentsTable)
      .where(like(studentsTable.studentId, `${prefix}%`))
      .orderBy(desc(studentsTable.studentId))
      .limit(1);

    let nextSerial = 1;
    if (existing.length > 0 && existing[0].studentId) {
      const parts = existing[0].studentId.split("-");
      const lastSerial = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSerial)) nextSerial = lastSerial + 1;
    }

    const studentId = `${prefix}${String(nextSerial).padStart(4, "0")}`;

    const [dup] = await db.select({ id: studentsTable.id })
      .from(studentsTable)
      .where(eq(studentsTable.studentId, studentId));
    if (dup) {
      throw new Error(`Student code ${studentId} already exists`);
    }

    const [row] = await db.insert(studentsTable).values({ ...student, studentId }).returning();
    return toDTO<Student>(row);
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const { studentId, id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(studentsTable)
      .set(safeUpdates)
      .where(eq(studentsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Student>(row) : undefined;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(studentsTable).where(eq(studentsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getStaff(): Promise<Staff[]> {
    const rows = await db.select().from(staffTable).orderBy(desc(staffTable.id));
    return toDTOArray<Staff>(rows);
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    const [row] = await db.select().from(staffTable).where(eq(staffTable.id, parseId(id)));
    return row ? toDTO<Staff>(row) : undefined;
  }

  async createStaff(staff: InsertStaff): Promise<Staff> {
    const lastStaff = await db.select({ staffId: staffTable.staffId })
      .from(staffTable)
      .orderBy(desc(staffTable.staffId))
      .limit(1);

    let nextNum = 1;
    if (lastStaff.length > 0 && lastStaff[0].staffId) {
      const match = lastStaff[0].staffId.match(/STF(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const staffId = `STF${String(nextNum).padStart(4, "0")}`;

    const [row] = await db.insert(staffTable).values({ ...staff, staffId }).returning();
    return toDTO<Staff>(row);
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(staffTable)
      .set(safeUpdates)
      .where(eq(staffTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Staff>(row) : undefined;
  }

  async deleteStaff(id: string): Promise<boolean> {
    const result = await db.delete(staffTable).where(eq(staffTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getVacancies(): Promise<Vacancy[]> {
    const rows = await db.select().from(vacanciesTable).orderBy(desc(vacanciesTable.id));
    return toDTOArray<Vacancy>(rows);
  }

  async getVacancy(id: string): Promise<Vacancy | undefined> {
    const [row] = await db.select().from(vacanciesTable).where(eq(vacanciesTable.id, parseId(id)));
    return row ? toDTO<Vacancy>(row) : undefined;
  }

  async createVacancy(vacancy: InsertVacancy): Promise<Vacancy> {
    const [row] = await db.insert(vacanciesTable).values(vacancy).returning();
    return toDTO<Vacancy>(row);
  }

  async updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(vacanciesTable)
      .set(safeUpdates)
      .where(eq(vacanciesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Vacancy>(row) : undefined;
  }

  async deleteVacancy(id: string): Promise<boolean> {
    const result = await db.delete(vacanciesTable).where(eq(vacanciesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getApplicants(): Promise<Applicant[]> {
    const rows = await db.select().from(applicantsTable).orderBy(desc(applicantsTable.id));
    return toDTOArray<Applicant>(rows);
  }

  async getApplicant(id: string): Promise<Applicant | undefined> {
    const [row] = await db.select().from(applicantsTable).where(eq(applicantsTable.id, parseId(id)));
    return row ? toDTO<Applicant>(row) : undefined;
  }

  async createApplicant(applicant: InsertApplicant): Promise<Applicant> {
    const [row] = await db.insert(applicantsTable).values(applicant).returning();
    return toDTO<Applicant>(row);
  }

  async updateApplicant(id: string, updates: Partial<Applicant>): Promise<Applicant | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(applicantsTable)
      .set(safeUpdates)
      .where(eq(applicantsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Applicant>(row) : undefined;
  }

  async deleteApplicant(id: string): Promise<boolean> {
    const result = await db.delete(applicantsTable).where(eq(applicantsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getFeeVouchers(): Promise<FeeVoucher[]> {
    const rows = await db.select().from(feeVouchersTable).orderBy(desc(feeVouchersTable.id));
    return toDTOArray<FeeVoucher>(rows);
  }

  async getFeeVoucher(id: string): Promise<FeeVoucher | undefined> {
    const [row] = await db.select().from(feeVouchersTable).where(eq(feeVouchersTable.id, parseId(id)));
    return row ? toDTO<FeeVoucher>(row) : undefined;
  }

  async createFeeVoucher(voucher: InsertFeeVoucher): Promise<FeeVoucher> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(feeVouchersTable);
    const voucherId = `FV${String(Number(cnt) + 1).padStart(5, "0")}`;
    const [row] = await db.insert(feeVouchersTable).values({ ...voucher, voucherId }).returning();
    return toDTO<FeeVoucher>(row);
  }

  async updateFeeVoucher(id: string, updates: Partial<FeeVoucher>): Promise<FeeVoucher | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(feeVouchersTable)
      .set(safeUpdates)
      .where(eq(feeVouchersTable.id, parseId(id)))
      .returning();
    return row ? toDTO<FeeVoucher>(row) : undefined;
  }

  async deleteFeeVoucher(id: string): Promise<boolean> {
    const result = await db.delete(feeVouchersTable).where(eq(feeVouchersTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getPayrolls(): Promise<Payroll[]> {
    const rows = await db.select().from(payrollsTable).orderBy(desc(payrollsTable.id));
    return toDTOArray<Payroll>(rows);
  }

  async getPayroll(id: string): Promise<Payroll | undefined> {
    const [row] = await db.select().from(payrollsTable).where(eq(payrollsTable.id, parseId(id)));
    return row ? toDTO<Payroll>(row) : undefined;
  }

  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(payrollsTable);
    const payrollId = `PAY${String(Number(cnt) + 1).padStart(5, "0")}`;
    const [row] = await db.insert(payrollsTable).values({ ...payroll, staffId: payroll.staffId || payrollId }).returning();
    return toDTO<Payroll>(row);
  }

  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(payrollsTable)
      .set(safeUpdates)
      .where(eq(payrollsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Payroll>(row) : undefined;
  }

  async deletePayroll(id: string): Promise<boolean> {
    const result = await db.delete(payrollsTable).where(eq(payrollsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getAccounts(): Promise<Account[]> {
    const rows = await db.select().from(accountsTable).orderBy(asc(accountsTable.code));
    return toDTOArray<Account>(rows);
  }

  async getAccount(id: string): Promise<Account | undefined> {
    const [row] = await db.select().from(accountsTable).where(eq(accountsTable.id, parseId(id)));
    return row ? toDTO<Account>(row) : undefined;
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(accountsTable);
    const accountId = `ACC${String(Number(cnt) + 1).padStart(4, "0")}`;
    const [row] = await db.insert(accountsTable).values({ ...account, code: account.code || accountId }).returning();
    return toDTO<Account>(row);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(accountsTable)
      .set(safeUpdates)
      .where(eq(accountsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Account>(row) : undefined;
  }

  async deleteAccount(id: string): Promise<boolean> {
    const result = await db.delete(accountsTable).where(eq(accountsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getFinanceVouchers(): Promise<FinanceVoucher[]> {
    const rows = await db.select().from(financeVouchersTable).orderBy(desc(financeVouchersTable.id));
    return toDTOArray<FinanceVoucher>(rows);
  }

  async getFinanceVoucher(id: string): Promise<FinanceVoucher | undefined> {
    const [row] = await db.select().from(financeVouchersTable).where(eq(financeVouchersTable.id, parseId(id)));
    return row ? toDTO<FinanceVoucher>(row) : undefined;
  }

  async createFinanceVoucher(voucher: InsertFinanceVoucher): Promise<FinanceVoucher> {
    const lastVoucher = await db.select({ voucherId: financeVouchersTable.voucherId })
      .from(financeVouchersTable)
      .orderBy(desc(financeVouchersTable.voucherId))
      .limit(1);

    let nextNum = 1;
    if (lastVoucher.length > 0 && lastVoucher[0].voucherId) {
      const match = lastVoucher[0].voucherId.match(/VCH(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const voucherId = `VCH${String(nextNum).padStart(5, "0")}`;
    const voucherNumber = `VCH-${new Date().getFullYear()}-${String(nextNum).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();

    const [row] = await db.insert(financeVouchersTable)
      .values({ ...voucher, voucherId, voucherNumber, createdAt })
      .returning();
    return toDTO<FinanceVoucher>(row);
  }

  async updateFinanceVoucher(id: string, updates: Partial<FinanceVoucher>): Promise<FinanceVoucher | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(financeVouchersTable)
      .set(safeUpdates)
      .where(eq(financeVouchersTable.id, parseId(id)))
      .returning();
    return row ? toDTO<FinanceVoucher>(row) : undefined;
  }

  async deleteFinanceVoucher(id: string): Promise<boolean> {
    const result = await db.delete(financeVouchersTable).where(eq(financeVouchersTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async postFinanceVoucher(id: string, postedBy: string, overrideReferenceType?: string): Promise<FinanceVoucher | undefined> {
    const [voucher] = await db.select().from(financeVouchersTable).where(eq(financeVouchersTable.id, parseId(id)));
    if (!voucher) return undefined;
    if (voucher.status !== "Draft") {
      throw new Error(`Voucher is already ${voucher.status}. Only Draft vouchers can be posted.`);
    }
    if (voucher.totalDebit !== voucher.totalCredit) {
      throw new Error(`Total debit (${voucher.totalDebit}) must equal total credit (${voucher.totalCredit}).`);
    }
    const entries = (voucher.entries || []) as any[];
    if (entries.length === 0) {
      throw new Error("Voucher must have at least one entry.");
    }

    const result = await db.transaction(async (tx) => {
      const now = new Date().toISOString();
      for (const entry of entries) {
        const [account] = await tx.select().from(chartOfAccountsTable)
          .where(eq(chartOfAccountsTable.id, parseId(entry.accountId)));
        const accountCode = account?.accountCode || "";
        const accountName = entry.accountName || account?.accountName || "";

        const lastEntry = await tx.select({ entryNo: ledgerEntriesTable.entryNo })
          .from(ledgerEntriesTable)
          .orderBy(desc(ledgerEntriesTable.entryNo))
          .limit(1);

        let nextEntryNum = 1;
        if (lastEntry.length > 0 && lastEntry[0].entryNo) {
          const match = lastEntry[0].entryNo.match(/LE(\d+)/);
          if (match) nextEntryNum = parseInt(match[1], 10) + 1;
        }
        const entryNo = `LE${String(nextEntryNum).padStart(8, "0")}`;

        const existingBalance = await tx.select({ balance: ledgerEntriesTable.balance })
          .from(ledgerEntriesTable)
          .where(eq(ledgerEntriesTable.accountId, entry.accountId))
          .orderBy(desc(ledgerEntriesTable.id))
          .limit(1);

        const prevBalance = existingBalance.length > 0 ? existingBalance[0].balance : 0;
        const balance = prevBalance + entry.debit - entry.credit;

        await tx.insert(ledgerEntriesTable).values({
          entryNo,
          date: voucher.date,
          accountId: entry.accountId,
          accountCode,
          accountName,
          description: entry.description || voucher.narration,
          referenceType: overrideReferenceType || "Voucher",
          referenceId: String(voucher.id),
          referenceNo: voucher.voucherNumber,
          debit: entry.debit,
          credit: entry.credit,
          balance,
          createdBy: postedBy,
          createdAt: now,
        });
      }

      const [updated] = await tx.update(financeVouchersTable)
        .set({ status: "Posted", postedBy, postedAt: new Date().toISOString() })
        .where(eq(financeVouchersTable.id, parseId(id)))
        .returning();

      return updated;
    });

    return toDTO<FinanceVoucher>(result);
  }

  async cancelFinanceVoucher(id: string, cancelledBy: string): Promise<FinanceVoucher | undefined> {
    const [voucher] = await db.select().from(financeVouchersTable).where(eq(financeVouchersTable.id, parseId(id)));
    if (!voucher) return undefined;
    if (voucher.status !== "Posted") {
      throw new Error(`Only Posted vouchers can be cancelled. Current status: ${voucher.status}`);
    }

    const entries = (voucher.entries || []) as any[];
    const reversalEntries = entries.map((e: any) => ({
      accountId: e.accountId,
      accountName: e.accountName,
      debit: e.credit,
      credit: e.debit,
      description: `Reversal: ${e.description || ""}`,
    }));

    const reversalVoucher = await this.createFinanceVoucher({
      type: voucher.type as any,
      date: new Date().toISOString().split("T")[0],
      entries: reversalEntries,
      totalDebit: voucher.totalCredit,
      totalCredit: voucher.totalDebit,
      narration: `Reversal of ${voucher.voucherNumber}`,
      reference: voucher.voucherNumber,
      status: "Draft",
      createdBy: cancelledBy,
    });

    await this.postFinanceVoucher(reversalVoucher.id, cancelledBy);

    const now = new Date().toISOString();
    const [updated] = await db.update(financeVouchersTable)
      .set({ status: "Cancelled", cancelledBy, cancelledAt: now })
      .where(eq(financeVouchersTable.id, parseId(id)))
      .returning();

    return toDTO<FinanceVoucher>(updated);
  }

  async createAutoPostedVoucher(params: {
    type: "Receipt" | "Payment" | "Journal" | "Contra";
    date: string;
    debitAccountCode: string;
    creditAccountCode: string;
    amount: number;
    narration: string;
    reference?: string;
    referenceType: string;
    createdBy: string;
    branchId?: number;
    sourceModule?: "fee" | "payroll" | "pos" | "hostel" | null;
  }): Promise<void> {
    try {
      if (params.reference) {
        const [existing] = await db.select({ id: financeVouchersTable.id })
          .from(financeVouchersTable)
          .where(eq(financeVouchersTable.reference, params.reference));
        if (existing) {
          console.log(`Auto-voucher skipped: voucher already exists for reference ${params.reference}`);
          return;
        }
      }

      const branchFilter = (accountCode: string) =>
        params.branchId
          ? and(
              eq(chartOfAccountsTable.accountCode, accountCode),
              eq(chartOfAccountsTable.isActive, true),
              or(eq(chartOfAccountsTable.branchId, params.branchId), isNull(chartOfAccountsTable.branchId))
            )
          : and(eq(chartOfAccountsTable.accountCode, accountCode), eq(chartOfAccountsTable.isActive, true));

      const debitAccounts = await db.select().from(chartOfAccountsTable).where(branchFilter(params.debitAccountCode)).orderBy(desc(chartOfAccountsTable.branchId));
      const creditAccounts = await db.select().from(chartOfAccountsTable).where(branchFilter(params.creditAccountCode)).orderBy(desc(chartOfAccountsTable.branchId));
      const [debitAccount] = debitAccounts;
      const [creditAccount] = creditAccounts;

      if (!debitAccount || !creditAccount) {
        const missing = [
          !debitAccount ? params.debitAccountCode : null,
          !creditAccount ? params.creditAccountCode : null,
        ].filter(Boolean).join(", ");
        throw new Error(`Account(s) [${missing}] not found in Chart of Accounts for this branch. Please ensure accounts 1001, 1002, 4001, 5001 exist and are active.`);
      }

      const entries = [
        {
          accountId: String(debitAccount.id),
          accountName: debitAccount.accountName,
          debit: params.amount,
          credit: 0,
          description: params.narration,
        },
        {
          accountId: String(creditAccount.id),
          accountName: creditAccount.accountName,
          debit: 0,
          credit: params.amount,
          description: params.narration,
        },
      ];

      const voucher = await this.createFinanceVoucher({
        type: params.type,
        date: params.date,
        entries,
        totalDebit: params.amount,
        totalCredit: params.amount,
        narration: params.narration,
        reference: params.reference,
        status: "Draft",
        sourceModule: params.sourceModule ?? null,
        createdBy: params.createdBy,
      });

      await this.postFinanceVoucher(voucher.id, params.createdBy, params.referenceType);
    } catch (err) {
      console.error(`Failed to auto-create ${params.referenceType} voucher:`, err);
    }
  }

  async getFinanceDashboard(branchId: number = 1): Promise<any> {
    const accounts = await db.select().from(chartOfAccountsTable)
      .where(and(eq(chartOfAccountsTable.isActive, true), eq(chartOfAccountsTable.branchId, branchId)));

    const accountTypeMap = new Map<string, string>();
    for (const acc of accounts) {
      accountTypeMap.set(String(acc.id), acc.accountType);
    }

    const aggregated = await db.select({
      accountId: ledgerEntriesTable.accountId,
      totalDebit: sql<number>`COALESCE(SUM(${ledgerEntriesTable.debit}), 0)`,
      totalCredit: sql<number>`COALESCE(SUM(${ledgerEntriesTable.credit}), 0)`,
    }).from(ledgerEntriesTable)
      .where(eq(ledgerEntriesTable.branchId, branchId))
      .groupBy(ledgerEntriesTable.accountId);

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const row of aggregated) {
      const accountType = accountTypeMap.get(row.accountId);
      if (!accountType) continue;
      const debit = Number(row.totalDebit);
      const credit = Number(row.totalCredit);
      switch (accountType) {
        case "Asset": totalAssets += (debit - credit); break;
        case "Liability": totalLiabilities += (credit - debit); break;
        case "Income": totalIncome += (credit - debit); break;
        case "Expense": totalExpenses += (debit - credit); break;
      }
    }

    const recentVouchers = await db.select().from(financeVouchersTable)
      .where(eq(financeVouchersTable.branchId, branchId))
      .orderBy(desc(financeVouchersTable.id))
      .limit(10);

    const feePayments = await db.select().from(paymentsTable)
      .where(and(
        eq(paymentsTable.type, "Payment"),
        eq(paymentsTable.status, "Completed"),
        eq(paymentsTable.branchId, branchId)
      ));
    const totalFeeCollected = feePayments.reduce((sum, p) => sum + p.amount, 0);

    const paidPayrolls = await db.select().from(payrollsTable)
      .where(and(eq(payrollsTable.status, "Paid"), eq(payrollsTable.branchId, branchId)));
    const totalPayrollPaid = paidPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

    const recentFeePayments = await db.select().from(paymentsTable)
      .where(and(
        eq(paymentsTable.type, "Payment"),
        eq(paymentsTable.status, "Completed"),
        eq(paymentsTable.branchId, branchId)
      ))
      .orderBy(desc(paymentsTable.id))
      .limit(5);

    const recentPayrollPayments = await db.select().from(payrollsTable)
      .where(and(eq(payrollsTable.status, "Paid"), eq(payrollsTable.branchId, branchId)))
      .orderBy(desc(payrollsTable.id))
      .limit(5);

    return {
      totalAssets,
      totalLiabilities,
      totalIncome,
      totalExpenses,
      recentVouchers: toDTOArray<FinanceVoucher>(recentVouchers),
      totalFeeCollected,
      totalPayrollPaid,
      recentFeePayments: recentFeePayments.map((p: any) => ({
        id: String(p.id),
        receiptNo: p.receiptNo,
        studentName: p.studentName,
        amount: p.amount,
        paymentMode: p.paymentMode,
        paymentDate: p.paymentDate,
      })),
      recentPayrollPayments: recentPayrollPayments.map((p: any) => ({
        id: String(p.id),
        payrollId: p.staffId,
        staffName: p.staffName,
        netSalary: p.netSalary,
        month: p.month,
        paidDate: p.paidDate,
      })),
    };
  }

  async getFinanceDashboardExtended(branchId: number = 1): Promise<any> {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [unpostedResult] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(financeVouchersTable)
      .where(and(eq(financeVouchersTable.status, "Draft"), eq(financeVouchersTable.branchId, branchId)));
    const unpostedVouchers = Number(unpostedResult?.count ?? 0);

    const feeIncomeRows = await db.select({
      total: sql<number>`COALESCE(SUM(${ledgerEntriesTable.credit}), 0)`,
    }).from(ledgerEntriesTable)
      .where(and(
        eq(ledgerEntriesTable.accountCode, "4001"),
        eq(ledgerEntriesTable.branchId, branchId),
        sql`${ledgerEntriesTable.date} LIKE ${currentMonthPrefix + "%"}`
      ));
    const thisMonthFeeIncome = Number(feeIncomeRows[0]?.total ?? 0);

    const salaryExpenseRows = await db.select({
      total: sql<number>`COALESCE(SUM(${ledgerEntriesTable.debit}), 0)`,
    }).from(ledgerEntriesTable)
      .where(and(
        eq(ledgerEntriesTable.accountCode, "5001"),
        eq(ledgerEntriesTable.branchId, branchId),
        sql`${ledgerEntriesTable.date} LIKE ${currentMonthPrefix + "%"}`
      ));
    const thisMonthSalaryExpense = Number(salaryExpenseRows[0]?.total ?? 0);

    const salesIncomeRows = await db.select({
      total: sql<number>`COALESCE(SUM(${ledgerEntriesTable.credit}), 0)`,
    }).from(ledgerEntriesTable)
      .where(and(
        eq(ledgerEntriesTable.accountCode, "4003"),
        eq(ledgerEntriesTable.branchId, branchId),
        sql`${ledgerEntriesTable.date} LIKE ${currentMonthPrefix + "%"}`
      ));
    const thisMonthSalesIncome = Number(salesIncomeRows[0]?.total ?? 0);

    const hostelIncomeRows = await db.select({
      total: sql<number>`COALESCE(SUM(${ledgerEntriesTable.credit}), 0)`,
    }).from(ledgerEntriesTable)
      .where(and(
        eq(ledgerEntriesTable.accountCode, "4004"),
        eq(ledgerEntriesTable.branchId, branchId),
        sql`${ledgerEntriesTable.date} LIKE ${currentMonthPrefix + "%"}`
      ));
    const thisMonthHostelIncome = Number(hostelIncomeRows[0]?.total ?? 0);

    const receivableRows = await db.select({
      total: sql<number>`COALESCE(SUM(${challansTable.netAmount} - ${challansTable.paidAmount}), 0)`,
    }).from(challansTable)
      .where(and(
        eq(challansTable.branchId, branchId),
        sql`${challansTable.status} IN ('Pending', 'Partial')`
      ));
    const totalReceivable = Number(receivableRows[0]?.total ?? 0);

    return { unpostedVouchers, thisMonthFeeIncome, thisMonthSalaryExpense, thisMonthSalesIncome, thisMonthHostelIncome, totalReceivable };
  }

  async getTimetables(): Promise<Timetable[]> {
    const rows = await db.select().from(timetablesTable).orderBy(desc(timetablesTable.id));
    return toDTOArray<Timetable>(rows);
  }

  async getTimetable(id: string): Promise<Timetable | undefined> {
    const [row] = await db.select().from(timetablesTable).where(eq(timetablesTable.id, parseId(id)));
    return row ? toDTO<Timetable>(row) : undefined;
  }

  async createTimetable(timetable: InsertTimetable): Promise<Timetable> {
    const [existing] = await db.select().from(timetablesTable)
      .where(and(
        eq(timetablesTable.class, timetable.class),
        eq(timetablesTable.section, timetable.section)
      ));

    if (existing) {
      const existingSlots = (existing.slots || []) as any[];
      const newSlots = (timetable.slots || []) as any[];
      const slotMap = new Map();
      existingSlots.forEach((slot: any) => {
        const key = `${slot.day}-${slot.period}`;
        slotMap.set(key, slot);
      });
      newSlots.forEach((slot: any) => {
        const key = `${slot.day}-${slot.period}`;
        slotMap.set(key, slot);
      });

      const [updated] = await db.update(timetablesTable)
        .set({ slots: Array.from(slotMap.values()), updatedAt: timetable.updatedAt })
        .where(eq(timetablesTable.id, existing.id))
        .returning();
      return toDTO<Timetable>(updated);
    } else {
      const [row] = await db.insert(timetablesTable).values(timetable).returning();
      return toDTO<Timetable>(row);
    }
  }

  async updateTimetable(id: string, updates: Partial<Timetable>): Promise<Timetable | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(timetablesTable)
      .set(safeUpdates)
      .where(eq(timetablesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Timetable>(row) : undefined;
  }

  async deleteTimetable(id: string): Promise<boolean> {
    const result = await db.delete(timetablesTable).where(eq(timetablesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getDateSheets(): Promise<DateSheet[]> {
    const rows = await db.select().from(dateSheetsTable).orderBy(desc(dateSheetsTable.id));
    return toDTOArray<DateSheet>(rows);
  }

  async getDateSheet(id: string): Promise<DateSheet | undefined> {
    const [row] = await db.select().from(dateSheetsTable).where(eq(dateSheetsTable.id, parseId(id)));
    return row ? toDTO<DateSheet>(row) : undefined;
  }

  async createDateSheet(dateSheet: InsertDateSheet): Promise<DateSheet> {
    const [row] = await db.insert(dateSheetsTable).values(dateSheet).returning();
    return toDTO<DateSheet>(row);
  }

  async updateDateSheet(id: string, updates: Partial<DateSheet>): Promise<DateSheet | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(dateSheetsTable)
      .set(safeUpdates)
      .where(eq(dateSheetsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<DateSheet>(row) : undefined;
  }

  async deleteDateSheet(id: string): Promise<boolean> {
    const result = await db.delete(dateSheetsTable).where(eq(dateSheetsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getCurriculums(): Promise<Curriculum[]> {
    const rows = await db.select().from(curriculumsTable).orderBy(desc(curriculumsTable.id));
    return toDTOArray<Curriculum>(rows);
  }

  async getCurriculum(id: string): Promise<Curriculum | undefined> {
    const [row] = await db.select().from(curriculumsTable).where(eq(curriculumsTable.id, parseId(id)));
    return row ? toDTO<Curriculum>(row) : undefined;
  }

  async createCurriculum(curriculum: InsertCurriculum): Promise<Curriculum> {
    const [row] = await db.insert(curriculumsTable).values(curriculum).returning();
    return toDTO<Curriculum>(row);
  }

  async updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<Curriculum | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(curriculumsTable)
      .set(safeUpdates)
      .where(eq(curriculumsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Curriculum>(row) : undefined;
  }

  async deleteCurriculum(id: string): Promise<boolean> {
    const result = await db.delete(curriculumsTable).where(eq(curriculumsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getExams(): Promise<Exam[]> {
    const rows = await db.select().from(examsTable).orderBy(desc(examsTable.startDate));
    return toDTOArray<Exam>(rows);
  }

  async getExam(id: string): Promise<Exam | undefined> {
    const [row] = await db.select().from(examsTable).where(eq(examsTable.id, parseId(id)));
    return row ? toDTO<Exam>(row) : undefined;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [row] = await db.insert(examsTable).values(exam).returning();
    return toDTO<Exam>(row);
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(examsTable)
      .set(safeUpdates)
      .where(eq(examsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Exam>(row) : undefined;
  }

  async deleteExam(id: string): Promise<boolean> {
    const result = await db.delete(examsTable).where(eq(examsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getResults(): Promise<Result[]> {
    const rows = await db.select().from(examResultsTable).orderBy(desc(examResultsTable.id));
    return toDTOArray<Result>(rows);
  }

  async getResult(id: string): Promise<Result | undefined> {
    const [row] = await db.select().from(examResultsTable).where(eq(examResultsTable.id, parseId(id)));
    return row ? toDTO<Result>(row) : undefined;
  }

  async createResult(result: InsertResult): Promise<Result> {
    const [row] = await db.insert(examResultsTable).values(result).returning();
    return toDTO<Result>(row);
  }

  async updateResult(id: string, updates: Partial<Result>): Promise<Result | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(examResultsTable)
      .set(safeUpdates)
      .where(eq(examResultsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Result>(row) : undefined;
  }

  async deleteResult(id: string): Promise<boolean> {
    const result = await db.delete(examResultsTable).where(eq(examResultsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getQuestions(): Promise<Question[]> {
    const rows = await db.select().from(questionsTable).orderBy(desc(questionsTable.id));
    return toDTOArray<Question>(rows);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [row] = await db.select().from(questionsTable).where(eq(questionsTable.id, parseId(id)));
    return row ? toDTO<Question>(row) : undefined;
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [row] = await db.insert(questionsTable).values(question).returning();
    return toDTO<Question>(row);
  }

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(questionsTable)
      .set(safeUpdates)
      .where(eq(questionsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Question>(row) : undefined;
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const result = await db.delete(questionsTable).where(eq(questionsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getQuizzes(): Promise<Quiz[]> {
    const rows = await db.select().from(quizzesTable).orderBy(desc(quizzesTable.id));
    return toDTOArray<Quiz>(rows);
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [row] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, parseId(id)));
    return row ? toDTO<Quiz>(row) : undefined;
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const [row] = await db.insert(quizzesTable).values(quiz).returning();
    return toDTO<Quiz>(row);
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(quizzesTable)
      .set(safeUpdates)
      .where(eq(quizzesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Quiz>(row) : undefined;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await db.delete(quizzesTable).where(eq(quizzesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getQuizAttempts(): Promise<QuizAttempt[]> {
    const rows = await db.select().from(quizAttemptsTable).orderBy(desc(quizAttemptsTable.id));
    return toDTOArray<QuizAttempt>(rows);
  }

  async getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]> {
    const rows = await db.select().from(quizAttemptsTable)
      .where(eq(quizAttemptsTable.quizId, quizId))
      .orderBy(desc(quizAttemptsTable.score));
    return toDTOArray<QuizAttempt>(rows);
  }

  async getQuizAttempt(id: string): Promise<QuizAttempt | undefined> {
    const [row] = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.id, parseId(id)));
    return row ? toDTO<QuizAttempt>(row) : undefined;
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [row] = await db.insert(quizAttemptsTable).values(attempt).returning();
    return toDTO<QuizAttempt>(row);
  }

  async updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(quizAttemptsTable)
      .set(safeUpdates)
      .where(eq(quizAttemptsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<QuizAttempt>(row) : undefined;
  }

  async deleteQuizAttempt(id: string): Promise<boolean> {
    const result = await db.delete(quizAttemptsTable).where(eq(quizAttemptsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getPosItems(): Promise<PosItem[]> {
    const rows = await db.select().from(posItemsTable).orderBy(asc(posItemsTable.name));
    return toDTOArray<PosItem>(rows);
  }

  async getPosItem(id: string): Promise<PosItem | undefined> {
    const [row] = await db.select().from(posItemsTable).where(eq(posItemsTable.id, parseId(id)));
    return row ? toDTO<PosItem>(row) : undefined;
  }

  async createPosItem(item: InsertPosItem): Promise<PosItem> {
    const updated = await db.update(counters)
      .set({ value: sql`${counters.value} + 1` })
      .where(eq(counters.name, "pos_items"))
      .returning();

    let seq: number;
    if (updated.length === 0) {
      const [inserted] = await db.insert(counters).values({ name: "pos_items", value: 1 }).returning();
      seq = inserted.value;
    } else {
      seq = updated[0].value;
    }

    let itemCode = `ITEM${String(seq).padStart(3, "0")}`;
    const [dup] = await db.select({ id: posItemsTable.id }).from(posItemsTable)
      .where(eq(posItemsTable.itemCode, itemCode));

    if (dup) {
      const [maxItem] = await db.select({ itemCode: posItemsTable.itemCode })
        .from(posItemsTable)
        .orderBy(desc(posItemsTable.itemCode))
        .limit(1);
      if (maxItem) {
        const num = parseInt(maxItem.itemCode.replace("ITEM", "")) || 0;
        seq = num + 1;
        itemCode = `ITEM${String(seq).padStart(3, "0")}`;
        await db.update(counters).set({ value: seq }).where(eq(counters.name, "pos_items"));
      }
    }

    const [row] = await db.insert(posItemsTable).values({ ...item, itemCode }).returning();
    return toDTO<PosItem>(row);
  }

  async updatePosItem(id: string, updates: Partial<PosItem>): Promise<PosItem | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(posItemsTable)
      .set(safeUpdates)
      .where(eq(posItemsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<PosItem>(row) : undefined;
  }

  async deletePosItem(id: string): Promise<boolean> {
    const result = await db.delete(posItemsTable).where(eq(posItemsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getSales(): Promise<Sale[]> {
    const rows = await db.select().from(salesTable).orderBy(desc(salesTable.id));
    return toDTOArray<Sale>(rows);
  }

  async getSale(id: string): Promise<Sale | undefined> {
    const [row] = await db.select().from(salesTable).where(eq(salesTable.id, parseId(id)));
    return row ? toDTO<Sale>(row) : undefined;
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [row] = await db.insert(salesTable).values(sale).returning();
    return toDTO<Sale>(row);
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(salesTable)
      .set(safeUpdates)
      .where(eq(salesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Sale>(row) : undefined;
  }

  async deleteSale(id: string): Promise<boolean> {
    const result = await db.delete(salesTable).where(eq(salesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getBooks(): Promise<Book[]> {
    const rows = await db.select().from(booksTable).orderBy(asc(booksTable.title));
    return toDTOArray<Book>(rows).map(b => ({
      ...b,
      totalCopies: (b as any).totalCopies ?? 1,
      availableCopies: (b as any).availableCopies ?? 1,
    }));
  }

  async getBook(id: string): Promise<Book | undefined> {
    const [row] = await db.select().from(booksTable).where(eq(booksTable.id, parseId(id)));
    return row ? toDTO<Book>(row) : undefined;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [row] = await db.insert(booksTable).values(book).returning();
    return toDTO<Book>(row);
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(booksTable)
      .set(safeUpdates)
      .where(eq(booksTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Book>(row) : undefined;
  }

  async deleteBook(id: string): Promise<boolean> {
    const result = await db.delete(booksTable).where(eq(booksTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getBookCategories(): Promise<BookCategory[]> {
    const rows = await db.select().from(bookCategoriesTable).orderBy(asc(bookCategoriesTable.name));
    return toDTOArray<BookCategory>(rows);
  }

  async getBookCategory(id: string): Promise<BookCategory | undefined> {
    const [row] = await db.select().from(bookCategoriesTable).where(eq(bookCategoriesTable.id, parseId(id)));
    return row ? toDTO<BookCategory>(row) : undefined;
  }

  async createBookCategory(category: InsertBookCategory): Promise<BookCategory> {
    const [row] = await db.insert(bookCategoriesTable).values(category).returning();
    return toDTO<BookCategory>(row);
  }

  async updateBookCategory(id: string, updates: Partial<BookCategory>): Promise<BookCategory | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(bookCategoriesTable)
      .set(safeUpdates)
      .where(eq(bookCategoriesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<BookCategory>(row) : undefined;
  }

  async deleteBookCategory(id: string): Promise<boolean> {
    const result = await db.delete(bookCategoriesTable).where(eq(bookCategoriesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getLibraryMembers(): Promise<LibraryMember[]> {
    const rows = await db.select().from(libraryMembersTable).orderBy(asc(libraryMembersTable.name));
    return toDTOArray<LibraryMember>(rows);
  }

  async getLibraryMember(id: string): Promise<LibraryMember | undefined> {
    const [row] = await db.select().from(libraryMembersTable).where(eq(libraryMembersTable.id, parseId(id)));
    return row ? toDTO<LibraryMember>(row) : undefined;
  }

  async createLibraryMember(member: InsertLibraryMember): Promise<LibraryMember> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(libraryMembersTable);
    const memberId = `LM${String(Number(cnt) + 1).padStart(4, "0")}`;
    const [row] = await db.insert(libraryMembersTable).values({ ...member, memberId }).returning();
    return toDTO<LibraryMember>(row);
  }

  async updateLibraryMember(id: string, updates: Partial<LibraryMember>): Promise<LibraryMember | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(libraryMembersTable)
      .set(safeUpdates)
      .where(eq(libraryMembersTable.id, parseId(id)))
      .returning();
    return row ? toDTO<LibraryMember>(row) : undefined;
  }

  async deleteLibraryMember(id: string): Promise<boolean> {
    const result = await db.delete(libraryMembersTable).where(eq(libraryMembersTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getBookIssues(): Promise<BookIssue[]> {
    const rows = await db.select().from(bookIssuesTable).orderBy(desc(bookIssuesTable.issueDate));
    return toDTOArray<BookIssue>(rows);
  }

  async getBookIssue(id: string): Promise<BookIssue | undefined> {
    const [row] = await db.select().from(bookIssuesTable).where(eq(bookIssuesTable.id, parseId(id)));
    return row ? toDTO<BookIssue>(row) : undefined;
  }

  async createBookIssue(issue: InsertBookIssue): Promise<BookIssue> {
    const [row] = await db.insert(bookIssuesTable).values(issue).returning();
    return toDTO<BookIssue>(row);
  }

  async updateBookIssue(id: string, updates: Partial<BookIssue>): Promise<BookIssue | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(bookIssuesTable)
      .set(safeUpdates)
      .where(eq(bookIssuesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<BookIssue>(row) : undefined;
  }

  async deleteBookIssue(id: string): Promise<boolean> {
    const result = await db.delete(bookIssuesTable).where(eq(bookIssuesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getRoutes(): Promise<Route[]> {
    const rows = await db.select().from(routesTable).orderBy(asc(routesTable.routeName));
    return toDTOArray<Route>(rows);
  }

  async getRoute(id: string): Promise<Route | undefined> {
    const [row] = await db.select().from(routesTable).where(eq(routesTable.id, parseId(id)));
    return row ? toDTO<Route>(row) : undefined;
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const last = await db.select({ routeId: routesTable.routeId })
      .from(routesTable)
      .orderBy(desc(routesTable.routeId))
      .limit(1);

    const lastNum = last.length > 0 && last[0].routeId ? parseInt(last[0].routeId.replace("RT", "")) : 0;
    const routeId = `RT${String(lastNum + 1).padStart(3, "0")}`;
    const [row] = await db.insert(routesTable).values({ ...route, routeId }).returning();
    return toDTO<Route>(row);
  }

  async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(routesTable)
      .set(safeUpdates)
      .where(eq(routesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Route>(row) : undefined;
  }

  async deleteRoute(id: string): Promise<boolean> {
    const result = await db.delete(routesTable).where(eq(routesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getVehicles(): Promise<Vehicle[]> {
    const rows = await db.select().from(vehiclesTable).orderBy(asc(vehiclesTable.registrationNumber));
    return toDTOArray<Vehicle>(rows);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [row] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parseId(id)));
    return row ? toDTO<Vehicle>(row) : undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const last = await db.select({ vehicleId: vehiclesTable.vehicleId })
      .from(vehiclesTable)
      .orderBy(desc(vehiclesTable.vehicleId))
      .limit(1);

    const lastNum = last.length > 0 && last[0].vehicleId ? parseInt(last[0].vehicleId.replace("VH", "")) : 0;
    const vehicleId = `VH${String(lastNum + 1).padStart(3, "0")}`;
    const [row] = await db.insert(vehiclesTable).values({ ...vehicle, vehicleId }).returning();
    return toDTO<Vehicle>(row);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(vehiclesTable)
      .set(safeUpdates)
      .where(eq(vehiclesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Vehicle>(row) : undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const result = await db.delete(vehiclesTable).where(eq(vehiclesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getDrivers(): Promise<Driver[]> {
    const rows = await db.select().from(driversTable).orderBy(asc(driversTable.name));
    return toDTOArray<Driver>(rows);
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [row] = await db.select().from(driversTable).where(eq(driversTable.id, parseId(id)));
    return row ? toDTO<Driver>(row) : undefined;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const last = await db.select({ driverId: driversTable.driverId })
      .from(driversTable)
      .orderBy(desc(driversTable.driverId))
      .limit(1);

    const lastNum = last.length > 0 && last[0].driverId ? parseInt(last[0].driverId.replace("DR", "")) : 0;
    const driverId = `DR${String(lastNum + 1).padStart(3, "0")}`;
    const [row] = await db.insert(driversTable).values({ ...driver, driverId }).returning();
    return toDTO<Driver>(row);
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(driversTable)
      .set(safeUpdates)
      .where(eq(driversTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Driver>(row) : undefined;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await db.delete(driversTable).where(eq(driversTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getStudentTransports(): Promise<StudentTransport[]> {
    const rows = await db.select().from(studentTransportsTable).orderBy(desc(studentTransportsTable.id));
    return toDTOArray<StudentTransport>(rows);
  }

  async getStudentTransport(id: string): Promise<StudentTransport | undefined> {
    const [row] = await db.select().from(studentTransportsTable).where(eq(studentTransportsTable.id, parseId(id)));
    return row ? toDTO<StudentTransport>(row) : undefined;
  }

  async createStudentTransport(transport: InsertStudentTransport): Promise<StudentTransport> {
    const last = await db.select({ allocationId: studentTransportsTable.allocationId })
      .from(studentTransportsTable)
      .orderBy(desc(studentTransportsTable.allocationId))
      .limit(1);

    const lastNum = last.length > 0 && last[0].allocationId ? parseInt(last[0].allocationId.replace("TA", "")) : 0;
    const allocationId = `TA${String(lastNum + 1).padStart(4, "0")}`;
    const [row] = await db.insert(studentTransportsTable).values({ ...transport, allocationId }).returning();
    return toDTO<StudentTransport>(row);
  }

  async updateStudentTransport(id: string, updates: Partial<StudentTransport>): Promise<StudentTransport | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(studentTransportsTable)
      .set(safeUpdates)
      .where(eq(studentTransportsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<StudentTransport>(row) : undefined;
  }

  async deleteStudentTransport(id: string): Promise<boolean> {
    const result = await db.delete(studentTransportsTable).where(eq(studentTransportsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getHostelRooms(): Promise<HostelRoom[]> {
    const rows = await db.select().from(hostelRoomsTable).orderBy(asc(hostelRoomsTable.roomNumber));
    return toDTOArray<HostelRoom>(rows);
  }

  async getHostelRoom(id: string): Promise<HostelRoom | undefined> {
    const [row] = await db.select().from(hostelRoomsTable).where(eq(hostelRoomsTable.id, parseId(id)));
    return row ? toDTO<HostelRoom>(row) : undefined;
  }

  async createHostelRoom(room: InsertHostelRoom): Promise<HostelRoom> {
    const [row] = await db.insert(hostelRoomsTable).values(room).returning();
    return toDTO<HostelRoom>(row);
  }

  async updateHostelRoom(id: string, updates: Partial<HostelRoom>): Promise<HostelRoom | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(hostelRoomsTable)
      .set(safeUpdates)
      .where(eq(hostelRoomsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<HostelRoom>(row) : undefined;
  }

  async deleteHostelRoom(id: string): Promise<boolean> {
    const result = await db.delete(hostelRoomsTable).where(eq(hostelRoomsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getHostelResidents(): Promise<HostelResident[]> {
    const rows = await db.select().from(hostelResidentsTable).orderBy(desc(hostelResidentsTable.id));
    return toDTOArray<HostelResident>(rows);
  }

  async getHostelResident(id: string): Promise<HostelResident | undefined> {
    const [row] = await db.select().from(hostelResidentsTable).where(eq(hostelResidentsTable.id, parseId(id)));
    return row ? toDTO<HostelResident>(row) : undefined;
  }

  async createHostelResident(resident: InsertHostelResident): Promise<HostelResident> {
    const [row] = await db.insert(hostelResidentsTable).values(resident).returning();
    return toDTO<HostelResident>(row);
  }

  async updateHostelResident(id: string, updates: Partial<HostelResident>): Promise<HostelResident | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(hostelResidentsTable)
      .set(safeUpdates)
      .where(eq(hostelResidentsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<HostelResident>(row) : undefined;
  }

  async deleteHostelResident(id: string): Promise<boolean> {
    const result = await db.delete(hostelResidentsTable).where(eq(hostelResidentsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getHostelFees(): Promise<HostelFee[]> {
    const rows = await db.select().from(hostelFeesTable).orderBy(desc(hostelFeesTable.id));
    return toDTOArray<HostelFee>(rows);
  }

  async getHostelFee(id: string): Promise<HostelFee | undefined> {
    const [row] = await db.select().from(hostelFeesTable).where(eq(hostelFeesTable.id, parseId(id)));
    return row ? toDTO<HostelFee>(row) : undefined;
  }

  async createHostelFee(fee: InsertHostelFee): Promise<HostelFee> {
    const [row] = await db.insert(hostelFeesTable).values(fee).returning();
    return toDTO<HostelFee>(row);
  }

  async updateHostelFee(id: string, updates: Partial<HostelFee>): Promise<HostelFee | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(hostelFeesTable)
      .set(safeUpdates)
      .where(eq(hostelFeesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<HostelFee>(row) : undefined;
  }

  async deleteHostelFee(id: string): Promise<boolean> {
    const result = await db.delete(hostelFeesTable).where(eq(hostelFeesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getNotifications(module?: string): Promise<Notification[]> {
    let rows;
    if (module) {
      rows = await db.select().from(notificationsTable)
        .where(eq(notificationsTable.module, module))
        .orderBy(desc(notificationsTable.id));
    } else {
      rows = await db.select().from(notificationsTable)
        .orderBy(desc(notificationsTable.id));
    }
    return toDTOArray<Notification>(rows);
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [row] = await db.select().from(notificationsTable).where(eq(notificationsTable.id, parseId(id)));
    return row ? toDTO<Notification>(row) : undefined;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(notificationsTable)
      .values({ ...notification, read: notification.read ?? false, createdAt })
      .returning();
    return toDTO<Notification>(row);
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const [row] = await db.update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Notification>(row) : undefined;
  }

  async markAllNotificationsRead(module?: string): Promise<void> {
    if (module) {
      await db.update(notificationsTable)
        .set({ read: true })
        .where(eq(notificationsTable.module, module));
    } else {
      await db.update(notificationsTable)
        .set({ read: true });
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    const result = await db.delete(notificationsTable).where(eq(notificationsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getUnreadNotificationCount(module?: string): Promise<number> {
    if (module) {
      const [{ cnt }] = await db.select({ cnt: count() }).from(notificationsTable)
        .where(and(
          eq(notificationsTable.read, false),
          eq(notificationsTable.module, module)
        ));
      return Number(cnt);
    } else {
      const [{ cnt }] = await db.select({ cnt: count() }).from(notificationsTable)
        .where(eq(notificationsTable.read, false));
      return Number(cnt);
    }
  }

  async getActivityLogs(module?: string): Promise<ActivityLog[]> {
    let rows;
    if (module) {
      rows = await db.select().from(activityLogsTable)
        .where(eq(activityLogsTable.module, module))
        .orderBy(desc(activityLogsTable.id))
        .limit(100);
    } else {
      rows = await db.select().from(activityLogsTable)
        .orderBy(desc(activityLogsTable.id))
        .limit(100);
    }
    return toDTOArray<ActivityLog>(rows);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(activityLogsTable).values({ ...log, createdAt }).returning();
    return toDTO<ActivityLog>(row);
  }

  async getFeeStructures(): Promise<FeeStructure[]> {
    const rows = await db.select().from(feeStructuresTable).orderBy(desc(feeStructuresTable.id));
    return toDTOArray<FeeStructure>(rows);
  }

  async getFeeStructure(id: string): Promise<FeeStructure | undefined> {
    const [row] = await db.select().from(feeStructuresTable).where(eq(feeStructuresTable.id, parseId(id)));
    return row ? toDTO<FeeStructure>(row) : undefined;
  }

  async createFeeStructure(structure: InsertFeeStructure): Promise<FeeStructure> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(feeStructuresTable);
    const structureId = `FS${String(Number(cnt) + 1).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(feeStructuresTable)
      .values({ ...structure, structureId, createdAt })
      .returning();
    return toDTO<FeeStructure>(row);
  }

  async updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(feeStructuresTable)
      .set(safeUpdates)
      .where(eq(feeStructuresTable.id, parseId(id)))
      .returning();
    return row ? toDTO<FeeStructure>(row) : undefined;
  }

  async deleteFeeStructure(id: string): Promise<boolean> {
    const result = await db.delete(feeStructuresTable).where(eq(feeStructuresTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getDiscountRules(): Promise<DiscountRule[]> {
    const rows = await db.select().from(discountRulesTable).orderBy(asc(discountRulesTable.name));
    return toDTOArray<DiscountRule>(rows);
  }

  async getDiscountRule(id: string): Promise<DiscountRule | undefined> {
    const [row] = await db.select().from(discountRulesTable).where(eq(discountRulesTable.id, parseId(id)));
    return row ? toDTO<DiscountRule>(row) : undefined;
  }

  async createDiscountRule(rule: InsertDiscountRule): Promise<DiscountRule> {
    const [row] = await db.insert(discountRulesTable).values(rule).returning();
    return toDTO<DiscountRule>(row);
  }

  async updateDiscountRule(id: string, updates: Partial<DiscountRule>): Promise<DiscountRule | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(discountRulesTable)
      .set(safeUpdates)
      .where(eq(discountRulesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<DiscountRule>(row) : undefined;
  }

  async deleteDiscountRule(id: string): Promise<boolean> {
    const result = await db.delete(discountRulesTable).where(eq(discountRulesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getLateFeeRules(): Promise<LateFeeRule[]> {
    const rows = await db.select().from(lateFeeRulesTable).orderBy(asc(lateFeeRulesTable.name));
    return toDTOArray<LateFeeRule>(rows);
  }

  async getLateFeeRule(id: string): Promise<LateFeeRule | undefined> {
    const [row] = await db.select().from(lateFeeRulesTable).where(eq(lateFeeRulesTable.id, parseId(id)));
    return row ? toDTO<LateFeeRule>(row) : undefined;
  }

  async createLateFeeRule(rule: InsertLateFeeRule): Promise<LateFeeRule> {
    const [row] = await db.insert(lateFeeRulesTable).values(rule).returning();
    return toDTO<LateFeeRule>(row);
  }

  async updateLateFeeRule(id: string, updates: Partial<LateFeeRule>): Promise<LateFeeRule | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(lateFeeRulesTable)
      .set(safeUpdates)
      .where(eq(lateFeeRulesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<LateFeeRule>(row) : undefined;
  }

  async deleteLateFeeRule(id: string): Promise<boolean> {
    const result = await db.delete(lateFeeRulesTable).where(eq(lateFeeRulesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getInstallmentPlans(): Promise<InstallmentPlan[]> {
    const rows = await db.select().from(installmentPlansTable).orderBy(asc(installmentPlansTable.name));
    return toDTOArray<InstallmentPlan>(rows);
  }

  async getInstallmentPlan(id: string): Promise<InstallmentPlan | undefined> {
    const [row] = await db.select().from(installmentPlansTable).where(eq(installmentPlansTable.id, parseId(id)));
    return row ? toDTO<InstallmentPlan>(row) : undefined;
  }

  async createInstallmentPlan(plan: InsertInstallmentPlan): Promise<InstallmentPlan> {
    const [row] = await db.insert(installmentPlansTable).values(plan).returning();
    return toDTO<InstallmentPlan>(row);
  }

  async updateInstallmentPlan(id: string, updates: Partial<InstallmentPlan>): Promise<InstallmentPlan | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(installmentPlansTable)
      .set(safeUpdates)
      .where(eq(installmentPlansTable.id, parseId(id)))
      .returning();
    return row ? toDTO<InstallmentPlan>(row) : undefined;
  }

  async deleteInstallmentPlan(id: string): Promise<boolean> {
    const result = await db.delete(installmentPlansTable).where(eq(installmentPlansTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getChallans(): Promise<Challan[]> {
    const rows = await db.select().from(challansTable).orderBy(desc(challansTable.id));
    return toDTOArray<Challan>(rows);
  }

  async getChallan(id: string): Promise<Challan | undefined> {
    const [row] = await db.select().from(challansTable).where(eq(challansTable.id, parseId(id)));
    return row ? toDTO<Challan>(row) : undefined;
  }

  async getChallansByStudent(studentId: string): Promise<Challan[]> {
    const rows = await db.select().from(challansTable)
      .where(eq(challansTable.studentId, studentId))
      .orderBy(desc(challansTable.id));
    return toDTOArray<Challan>(rows);
  }

  async createChallan(challan: InsertChallan): Promise<Challan> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(challansTable);
    const challanNo = `CHN${String(Number(cnt) + 1).padStart(6, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(challansTable).values({ ...challan, challanNo, createdAt }).returning();
    return toDTO<Challan>(row);
  }

  async updateChallan(id: string, updates: Partial<Challan>): Promise<Challan | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(challansTable)
      .set(safeUpdates)
      .where(eq(challansTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Challan>(row) : undefined;
  }

  async deleteChallan(id: string): Promise<boolean> {
    const result = await db.delete(challansTable).where(eq(challansTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getPayments(): Promise<Payment[]> {
    const rows = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.id));
    return toDTOArray<Payment>(rows);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const [row] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, parseId(id)));
    return row ? toDTO<Payment>(row) : undefined;
  }

  async getPaymentsByChallan(challanId: string): Promise<Payment[]> {
    const rows = await db.select().from(paymentsTable)
      .where(eq(paymentsTable.challanId, challanId))
      .orderBy(desc(paymentsTable.id));
    return toDTOArray<Payment>(rows);
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(paymentsTable);
    const receiptNo = `RCP${String(Number(cnt) + 1).padStart(6, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(paymentsTable).values({ ...payment, receiptNo, createdAt }).returning();
    return toDTO<Payment>(row);
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(paymentsTable)
      .set(safeUpdates)
      .where(eq(paymentsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Payment>(row) : undefined;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(paymentsTable).where(eq(paymentsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getVendors(): Promise<Vendor[]> {
    const rows = await db.select().from(vendorsTable).orderBy(asc(vendorsTable.name));
    return toDTOArray<Vendor>(rows);
  }

  async getVendor(id: string): Promise<Vendor | undefined> {
    const [row] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, parseId(id)));
    return row ? toDTO<Vendor>(row) : undefined;
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const lastVendor = await db.select({ vendorId: vendorsTable.vendorId })
      .from(vendorsTable)
      .orderBy(desc(vendorsTable.vendorId))
      .limit(1);

    let nextNum = 1;
    if (lastVendor.length > 0 && lastVendor[0].vendorId) {
      const match = lastVendor[0].vendorId.match(/VND(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const vendorId = `VND${String(nextNum).padStart(4, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(vendorsTable).values({ ...vendor, vendorId, createdAt }).returning();
    return toDTO<Vendor>(row);
  }

  async updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(vendorsTable)
      .set(safeUpdates)
      .where(eq(vendorsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Vendor>(row) : undefined;
  }

  async deleteVendor(id: string): Promise<boolean> {
    const result = await db.delete(vendorsTable).where(eq(vendorsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getExpenses(): Promise<Expense[]> {
    const rows = await db.select().from(expensesTable).orderBy(desc(expensesTable.id));
    return toDTOArray<Expense>(rows);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    const [row] = await db.select().from(expensesTable).where(eq(expensesTable.id, parseId(id)));
    return row ? toDTO<Expense>(row) : undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const lastExpense = await db.select({ expenseId: expensesTable.expenseId })
      .from(expensesTable)
      .orderBy(desc(expensesTable.expenseId))
      .limit(1);

    let nextNum = 1;
    if (lastExpense.length > 0 && lastExpense[0].expenseId) {
      const match = lastExpense[0].expenseId.match(/EXP(\d+)/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    const expenseId = `EXP${String(nextNum).padStart(6, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(expensesTable).values({ ...expense, expenseId, createdAt }).returning();
    const createdExpense = toDTO<Expense>(row);

    if (expense.status === "Paid") {
      try {
        const categoryToAccountCode: Record<string, string> = {
          "Utilities": "5002",
          "Supplies": "5004",
          "Maintenance": "5003",
          "Salary": "5001",
          "Transport": "5005",
          "Events": "5006",
          "Marketing": "5007",
          "IT": "5008",
          "Other": "5009",
        };
        const paymentModeToAccountCode: Record<string, string> = {
          "Cash": "1001",
          "Bank Transfer": "1002",
          "Cheque": "1002",
          "Online": "1002",
        };

        const expenseAccountCode = categoryToAccountCode[expense.category] || "5009";
        const creditAccountCode = paymentModeToAccountCode[expense.paymentMode] || "1001";

        const [expenseAccount] = await db.select().from(chartOfAccountsTable)
          .where(eq(chartOfAccountsTable.accountCode, expenseAccountCode));
        const [creditAccount] = await db.select().from(chartOfAccountsTable)
          .where(eq(chartOfAccountsTable.accountCode, creditAccountCode));

        if (expenseAccount && creditAccount) {
          const entries = [
            {
              accountId: String(expenseAccount.id),
              accountName: expenseAccount.accountName,
              debit: expense.amount,
              credit: 0,
              description: expense.description,
            },
            {
              accountId: String(creditAccount.id),
              accountName: creditAccount.accountName,
              debit: 0,
              credit: expense.amount,
              description: expense.description,
            },
          ];

          const voucher = await this.createFinanceVoucher({
            type: "Payment",
            date: expense.date,
            entries,
            totalDebit: expense.amount,
            totalCredit: expense.amount,
            narration: `Expense: ${expense.description} (${expense.category})`,
            reference: expenseId,
            status: "Draft",
            createdBy: expense.paidBy || "system",
          });

          await this.postFinanceVoucher(voucher.id, expense.paidBy || "system");
        }
      } catch (err) {
        console.error("Failed to auto-create voucher for paid expense:", err);
      }
    }

    return createdExpense;
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(expensesTable)
      .set(safeUpdates)
      .where(eq(expensesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<Expense>(row) : undefined;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await db.delete(expensesTable).where(eq(expensesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getChartOfAccounts(): Promise<ChartOfAccounts[]> {
    const rows = await db.select().from(chartOfAccountsTable).orderBy(asc(chartOfAccountsTable.accountCode));
    return toDTOArray<ChartOfAccounts>(rows);
  }

  async getChartOfAccount(id: string): Promise<ChartOfAccounts | undefined> {
    const [row] = await db.select().from(chartOfAccountsTable).where(eq(chartOfAccountsTable.id, parseId(id)));
    return row ? toDTO<ChartOfAccounts>(row) : undefined;
  }

  async createChartOfAccount(account: InsertChartOfAccounts): Promise<ChartOfAccounts> {
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(chartOfAccountsTable).values({ ...account, createdAt }).returning();
    return toDTO<ChartOfAccounts>(row);
  }

  async updateChartOfAccount(id: string, updates: Partial<ChartOfAccounts>): Promise<ChartOfAccounts | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(chartOfAccountsTable)
      .set(safeUpdates)
      .where(eq(chartOfAccountsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<ChartOfAccounts>(row) : undefined;
  }

  async deleteChartOfAccount(id: string): Promise<boolean> {
    const result = await db.delete(chartOfAccountsTable).where(eq(chartOfAccountsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getLedgerEntries(): Promise<LedgerEntry[]> {
    const rows = await db.select().from(ledgerEntriesTable).orderBy(desc(ledgerEntriesTable.date), desc(ledgerEntriesTable.id));
    return toDTOArray<LedgerEntry>(rows);
  }

  async getLedgerEntry(id: string): Promise<LedgerEntry | undefined> {
    const [row] = await db.select().from(ledgerEntriesTable).where(eq(ledgerEntriesTable.id, parseId(id)));
    return row ? toDTO<LedgerEntry>(row) : undefined;
  }

  async getLedgerEntriesByAccount(accountId: string): Promise<LedgerEntry[]> {
    const rows = await db.select().from(ledgerEntriesTable)
      .where(eq(ledgerEntriesTable.accountId, accountId))
      .orderBy(desc(ledgerEntriesTable.date), desc(ledgerEntriesTable.id));
    return toDTOArray<LedgerEntry>(rows);
  }

  async getLedgerEntriesByAccountAndDate(accountId?: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]> {
    const conditions = [];
    if (accountId) conditions.push(eq(ledgerEntriesTable.accountId, accountId));
    if (fromDate) conditions.push(gte(ledgerEntriesTable.date, fromDate));
    if (toDate) conditions.push(lte(ledgerEntriesTable.date, toDate));

    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(ledgerEntriesTable)
        .where(and(...conditions))
        .orderBy(desc(ledgerEntriesTable.date), desc(ledgerEntriesTable.id));
    } else {
      rows = await db.select().from(ledgerEntriesTable)
        .orderBy(desc(ledgerEntriesTable.date), desc(ledgerEntriesTable.id));
    }
    return toDTOArray<LedgerEntry>(rows);
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(ledgerEntriesTable);
    const entryNo = `LE${String(Number(cnt) + 1).padStart(8, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(ledgerEntriesTable).values({ ...entry, entryNo, createdAt }).returning();
    return toDTO<LedgerEntry>(row);
  }

  async updateLedgerEntry(id: string, updates: Partial<LedgerEntry>): Promise<LedgerEntry | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(ledgerEntriesTable)
      .set(safeUpdates)
      .where(eq(ledgerEntriesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<LedgerEntry>(row) : undefined;
  }

  async deleteLedgerEntry(id: string): Promise<boolean> {
    const result = await db.delete(ledgerEntriesTable).where(eq(ledgerEntriesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getJournalEntries(): Promise<JournalEntry[]> {
    const rows = await db.select().from(journalEntriesTable).orderBy(desc(journalEntriesTable.date), desc(journalEntriesTable.id));
    return toDTOArray<JournalEntry>(rows);
  }

  async getJournalEntry(id: string): Promise<JournalEntry | undefined> {
    const [row] = await db.select().from(journalEntriesTable).where(eq(journalEntriesTable.id, parseId(id)));
    return row ? toDTO<JournalEntry>(row) : undefined;
  }

  async createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry> {
    const [{ cnt }] = await db.select({ cnt: count() }).from(journalEntriesTable);
    const journalNo = `JE${String(Number(cnt) + 1).padStart(6, "0")}`;
    const createdAt = new Date().toISOString();
    const [row] = await db.insert(journalEntriesTable).values({ ...entry, journalNo, createdAt }).returning();
    return toDTO<JournalEntry>(row);
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(journalEntriesTable)
      .set(safeUpdates)
      .where(eq(journalEntriesTable.id, parseId(id)))
      .returning();
    return row ? toDTO<JournalEntry>(row) : undefined;
  }

  async deleteJournalEntry(id: string): Promise<boolean> {
    const result = await db.delete(journalEntriesTable).where(eq(journalEntriesTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getAttendanceRecords(filters?: { date?: string; targetType?: string; className?: string; section?: string }): Promise<AttendanceRecord[]> {
    const conditions = [];
    if (filters?.date) conditions.push(eq(attendanceRecordsTable.date, filters.date));
    if (filters?.targetType) conditions.push(eq(attendanceRecordsTable.targetType, filters.targetType));
    if (filters?.className) conditions.push(eq(attendanceRecordsTable.className, filters.className));
    if (filters?.section) conditions.push(eq(attendanceRecordsTable.section, filters.section));

    let rows;
    if (conditions.length > 0) {
      rows = await db.select().from(attendanceRecordsTable)
        .where(and(...conditions))
        .orderBy(desc(attendanceRecordsTable.id));
    } else {
      rows = await db.select().from(attendanceRecordsTable)
        .orderBy(desc(attendanceRecordsTable.id));
    }
    return toDTOArray<AttendanceRecord>(rows);
  }

  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    const [row] = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.id, parseId(id)));
    return row ? toDTO<AttendanceRecord>(row) : undefined;
  }

  async upsertAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const now = new Date().toISOString();
    const conditions = [eq(attendanceRecordsTable.date, record.date)];

    if (record.targetType === "STUDENT" && record.studentId) {
      conditions.push(eq(attendanceRecordsTable.studentId, record.studentId));
    } else if (record.staffId) {
      conditions.push(eq(attendanceRecordsTable.staffId, record.staffId));
    }

    const [existing] = await db.select().from(attendanceRecordsTable)
      .where(and(...conditions));

    if (existing) {
      const updateData: any = { ...record, updatedAt: now };
      if (record.targetType === "STUDENT") {
        delete updateData.staffId;
      } else {
        delete updateData.studentId;
      }
      delete updateData.markedAt;
      const [row] = await db.update(attendanceRecordsTable)
        .set(updateData)
        .where(eq(attendanceRecordsTable.id, existing.id))
        .returning();
      return toDTO<AttendanceRecord>(row);
    } else {
      const insertData: any = { ...record, markedAt: now };
      if (record.targetType === "STUDENT") {
        delete insertData.staffId;
      } else {
        delete insertData.studentId;
      }
      const [row] = await db.insert(attendanceRecordsTable).values(insertData).returning();
      return toDTO<AttendanceRecord>(row);
    }
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const { id: _id, ...safeUpdates } = updates as any;
    const [row] = await db.update(attendanceRecordsTable)
      .set(safeUpdates)
      .where(eq(attendanceRecordsTable.id, parseId(id)))
      .returning();
    return row ? toDTO<AttendanceRecord>(row) : undefined;
  }

  async deleteAttendanceRecord(id: string): Promise<boolean> {
    const result = await db.delete(attendanceRecordsTable).where(eq(attendanceRecordsTable.id, parseId(id))).returning();
    return result.length > 0;
  }

  async getAttendanceSummary(date: string, targetType?: string): Promise<AttendanceSummary> {
    const conditions = [eq(attendanceRecordsTable.date, date)];
    if (targetType) conditions.push(eq(attendanceRecordsTable.targetType, targetType));

    const rows = await db.select().from(attendanceRecordsTable)
      .where(and(...conditions));

    return {
      date,
      total: rows.length,
      present: rows.filter(r => r.status === "PRESENT").length,
      absent: rows.filter(r => r.status === "ABSENT").length,
      leave: rows.filter(r => r.status === "LEAVE").length,
    };
  }

  async getAttendanceReport(filters: { targetType: string; startDate: string; endDate: string; className?: string; section?: string }): Promise<AttendanceRecord[]> {
    const conditions = [
      eq(attendanceRecordsTable.targetType, filters.targetType),
      gte(attendanceRecordsTable.date, filters.startDate),
      lte(attendanceRecordsTable.date, filters.endDate),
    ];
    if (filters.className) conditions.push(eq(attendanceRecordsTable.className, filters.className));
    if (filters.section) conditions.push(eq(attendanceRecordsTable.section, filters.section));

    const rows = await db.select().from(attendanceRecordsTable)
      .where(and(...conditions))
      .orderBy(desc(attendanceRecordsTable.date));
    return toDTOArray<AttendanceRecord>(rows);
  }
}
