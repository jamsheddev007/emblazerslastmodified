import { z } from "zod";
import { pgTable, text, serial, integer, real, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";

// ============== MULTI-TENANT TABLES ==============

export const schoolsTable = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  subscriptionPlan: text("subscription_plan").notNull().default("free"),
  status: text("status").notNull().default("active"),
  expiryDate: text("expiry_date"),
  createdAt: text("created_at"),
});

export const branchesTable = pgTable("branches", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull(),
  name: text("name").notNull(),
  address: text("address"),
  phone: text("phone"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at"),
});

// ============== DRIZZLE TABLE DEFINITIONS ==============

export const moduleUsers = pgTable("module_users", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Admin"),
  role: text("role").notNull().default("admin"),
  branchId: integer("branch_id"),
});

export const adminPermissionsTable = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  moduleUserId: integer("module_user_id").notNull(),
  module: text("module").notNull(),
  branchId: integer("branch_id"),
  permissions: jsonb("permissions").notNull().default({}),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const counters = pgTable("counters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: integer("value").notNull().default(0),
});

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  dob: text("dob").notNull(),
  parentName: text("parent_name").notNull(),
  parentContact: text("parent_contact").notNull(),
  parentEmail: text("parent_email"),
  fatherCnic: text("father_cnic"),
  motherCnic: text("mother_cnic"),
  address: text("address").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  previousSchool: text("previous_school"),
  previousClass: text("previous_class"),
  admissionDate: text("admission_date").notNull(),
  status: text("status").notNull().default("Active"),
  photo: text("photo"),
  notes: text("notes"),
  bform: text("bform").notNull(),
  branchId: integer("branch_id"),
});

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull().unique(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  dob: text("dob").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  campus: text("campus").notNull(),
  employmentType: text("employment_type").notNull(),
  status: text("status").notNull().default("Active"),
  joiningDate: text("joining_date").notNull(),
  basicSalary: real("basic_salary").notNull(),
  paymentMode: text("payment_mode").notNull(),
  photo: text("photo"),
  portalEmail: text("portal_email"),
  portalPasswordHash: text("portal_password_hash"),
  branchId: integer("branch_id"),
});

export const staffDocumentsTable = pgTable("staff_documents", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: text("uploaded_at"),
  branchId: integer("branch_id"),
});

export const vacanciesTable = pgTable("vacancies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  designation: text("designation").notNull(),
  positions: integer("positions").notNull(),
  employmentType: text("employment_type").notNull(),
  salaryRange: text("salary_range"),
  qualifications: text("qualifications").notNull(),
  experience: text("experience").notNull(),
  description: text("description").notNull(),
  lastDate: text("last_date").notNull(),
  status: text("status").notNull().default("Open"),
  branchId: integer("branch_id"),
});

export const applicantsTable = pgTable("applicants", {
  id: serial("id").primaryKey(),
  vacancyId: text("vacancy_id").notNull(),
  vacancyTitle: text("vacancy_title").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  cnic: text("cnic").notNull(),
  address: text("address"),
  qualification: text("qualification").notNull(),
  experience: text("experience").notNull(),
  expectedSalary: real("expected_salary"),
  appliedDate: text("applied_date").notNull(),
  status: text("status").notNull().default("New"),
  branchId: integer("branch_id"),
});

export const feeVouchersTable = pgTable("fee_vouchers", {
  id: serial("id").primaryKey(),
  voucherId: text("voucher_id").notNull().unique(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  month: text("month").notNull(),
  feeHeads: jsonb("fee_heads").notNull().default([]),
  totalAmount: real("total_amount").notNull(),
  discount: real("discount").notNull().default(0),
  fine: real("fine").notNull().default(0),
  netAmount: real("net_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("Unpaid"),
  paymentHistory: jsonb("payment_history").notNull().default([]),
  branchId: integer("branch_id"),
});

export const payrollsTable = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  month: text("month").notNull(),
  basicSalary: real("basic_salary").notNull(),
  allowances: jsonb("allowances").notNull().default([]),
  deductions: jsonb("deductions").notNull().default([]),
  grossSalary: real("gross_salary").notNull(),
  netSalary: real("net_salary").notNull(),
  status: text("status").notNull().default("Unpaid"),
  paidDate: text("paid_date"),
  branchId: integer("branch_id"),
});

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  balance: real("balance").notNull().default(0),
  branchId: integer("branch_id"),
});

export const financeVouchersTable = pgTable("finance_vouchers", {
  id: serial("id").primaryKey(),
  voucherId: text("voucher_id").notNull().unique(),
  voucherNumber: text("voucher_number").notNull(),
  type: text("type").notNull(),
  date: text("date").notNull(),
  entries: jsonb("entries").notNull().default([]),
  totalDebit: real("total_debit").notNull(),
  totalCredit: real("total_credit").notNull(),
  narration: text("narration").notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("Draft"),
  sourceModule: text("source_module"),
  createdBy: text("created_by").notNull(),
  postedBy: text("posted_by"),
  postedAt: text("posted_at"),
  cancelledBy: text("cancelled_by"),
  cancelledAt: text("cancelled_at"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const feeStructuresTable = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  structureId: text("structure_id").notNull().unique(),
  name: text("name").notNull(),
  academicSession: text("academic_session").notNull(),
  class: text("class").notNull(),
  description: text("description"),
  feeHeads: jsonb("fee_heads").notNull().default([]),
  totalAmount: real("total_amount").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const discountRulesTable = pgTable("discount_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: real("value").notNull(),
  category: text("category").notNull(),
  applicableClasses: jsonb("applicable_classes"),
  applicableFeeHeads: jsonb("applicable_fee_heads"),
  validFrom: text("valid_from").notNull(),
  validTo: text("valid_to"),
  isActive: boolean("is_active").notNull().default(true),
  branchId: integer("branch_id"),
});

export const lateFeeRulesTable = pgTable("late_fee_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  value: real("value").notNull(),
  gracePeriodDays: integer("grace_period_days").notNull(),
  maxLateFee: real("max_late_fee"),
  applicableClasses: jsonb("applicable_classes"),
  isActive: boolean("is_active").notNull().default(true),
  branchId: integer("branch_id"),
});

export const installmentPlansTable = pgTable("installment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  numberOfInstallments: integer("number_of_installments").notNull(),
  installments: jsonb("installments").notNull().default([]),
  applicableClasses: jsonb("applicable_classes"),
  isActive: boolean("is_active").notNull().default(true),
  branchId: integer("branch_id"),
});

export const challansTable = pgTable("challans", {
  id: serial("id").primaryKey(),
  challanNo: text("challan_no").notNull().unique(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  academicSession: text("academic_session").notNull(),
  period: text("period").notNull(),
  feeStructureId: text("fee_structure_id"),
  feeHeads: jsonb("fee_heads").notNull().default([]),
  totalAmount: real("total_amount").notNull(),
  discountId: text("discount_id"),
  discountName: text("discount_name"),
  discountAmount: real("discount_amount").notNull().default(0),
  lateFee: real("late_fee").notNull().default(0),
  adjustments: real("adjustments").notNull().default(0),
  netAmount: real("net_amount").notNull(),
  paidAmount: real("paid_amount").notNull().default(0),
  balanceAmount: real("balance_amount").notNull(),
  dueDate: text("due_date").notNull(),
  issueDate: text("issue_date").notNull(),
  status: text("status").notNull().default("Pending"),
  installmentPlanId: text("installment_plan_id"),
  installmentNumber: integer("installment_number"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  receiptNo: text("receipt_no").notNull().unique(),
  challanId: text("challan_id").notNull(),
  challanNo: text("challan_no").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  amount: real("amount").notNull(),
  paymentMode: text("payment_mode").notNull(),
  transactionRef: text("transaction_ref"),
  bankName: text("bank_name"),
  chequeNo: text("cheque_no"),
  chequeDate: text("cheque_date"),
  paymentDate: text("payment_date").notNull(),
  receivedBy: text("received_by").notNull(),
  notes: text("notes"),
  type: text("type").notNull().default("Payment"),
  status: text("status").notNull().default("Completed"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const vendorsTable = pgTable("vendors", {
  id: serial("id").primaryKey(),
  vendorId: text("vendor_id").notNull().unique(),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address").notNull(),
  category: text("category").notNull(),
  bankName: text("bank_name"),
  accountNo: text("account_no"),
  taxId: text("tax_id"),
  status: text("status").notNull().default("Active"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const vendorPaymentsTable = pgTable("vendor_payments", {
  id: serial("id").primaryKey(),
  vendorId: text("vendor_id").notNull(),
  vendorName: text("vendor_name").notNull(),
  amount: real("amount").notNull(),
  description: text("description").notNull(),
  paymentDate: text("payment_date").notNull(),
  voucherId: text("voucher_id"),
  branchId: integer("branch_id"),
  createdAt: text("created_at").notNull(),
});

export const expensesTable = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseId: text("expense_id").notNull().unique(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description").notNull(),
  vendorId: text("vendor_id"),
  vendorName: text("vendor_name"),
  amount: real("amount").notNull(),
  paymentMode: text("payment_mode").notNull(),
  transactionRef: text("transaction_ref"),
  invoiceNo: text("invoice_no"),
  invoiceDate: text("invoice_date"),
  accountId: text("account_id"),
  accountName: text("account_name"),
  status: text("status").notNull().default("Pending"),
  approvedBy: text("approved_by"),
  paidBy: text("paid_by"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const chartOfAccountsTable = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  accountCode: text("account_code").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(),
  parentAccountId: text("parent_account_id"),
  level: integer("level").notNull().default(1),
  description: text("description"),
  openingBalance: real("opening_balance").notNull().default(0),
  currentBalance: real("current_balance").notNull().default(0),
  isSystemAccount: boolean("is_system_account").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  entryNo: text("entry_no").notNull().unique(),
  date: text("date").notNull(),
  accountId: text("account_id").notNull(),
  accountCode: text("account_code").notNull(),
  accountName: text("account_name").notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type").notNull(),
  referenceId: text("reference_id"),
  referenceNo: text("reference_no"),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  balance: real("balance").notNull().default(0),
  createdBy: text("created_by"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const journalEntriesTable = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  journalNo: text("journal_no").notNull().unique(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  entries: jsonb("entries").notNull().default([]),
  totalDebit: real("total_debit").notNull(),
  totalCredit: real("total_credit").notNull(),
  status: text("status").notNull().default("Draft"),
  createdBy: text("created_by"),
  approvedBy: text("approved_by"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
});

export const attendanceRecordsTable = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  targetType: text("target_type").notNull(),
  studentId: text("student_id"),
  staffId: text("staff_id"),
  entityName: text("entity_name").notNull(),
  className: text("class_name"),
  section: text("section"),
  status: text("status").notNull(),
  markedBy: text("marked_by"),
  remarks: text("remarks"),
  markedAt: text("marked_at"),
  updatedAt: text("updated_at"),
  branchId: integer("branch_id"),
});

export const timetablesTable = pgTable("timetables", {
  id: serial("id").primaryKey(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  slots: jsonb("slots").notNull().default([]),
  updatedAt: text("updated_at").notNull(),
  branchId: integer("branch_id"),
});

export const dateSheetsTable = pgTable("date_sheets", {
  id: serial("id").primaryKey(),
  examName: text("exam_name").notNull(),
  examType: text("exam_type").notNull(),
  class: text("class").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  entries: jsonb("entries").notNull().default([]),
  branchId: integer("branch_id"),
});

export const curriculumsTable = pgTable("curriculums", {
  id: serial("id").primaryKey(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  topics: jsonb("topics").notNull().default([]),
  assignedTeachers: jsonb("assigned_teachers").notNull().default([]),
  branchId: integer("branch_id"),
});

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  term: text("term").notNull(),
  classRange: text("class_range").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  branchId: integer("branch_id"),
});

export const examResultsTable = pgTable("exam_results", {
  id: serial("id").primaryKey(),
  examId: text("exam_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  section: text("section"),
  subject: text("subject").notNull(),
  marksObtained: real("marks_obtained").notNull(),
  maxMarks: real("max_marks").notNull(),
  grade: text("grade").notNull(),
  status: text("status").default("pending"),
  enteredBy: text("entered_by"),
  enteredAt: text("entered_at"),
  verifiedBy: text("verified_by"),
  verifiedAt: text("verified_at"),
  branchId: integer("branch_id"),
});

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  class: text("class").notNull(),
  type: text("type").notNull(),
  prompt: text("prompt").notNull(),
  options: jsonb("options"),
  correctAnswer: text("correct_answer").notNull(),
  marks: integer("marks").notNull().default(1),
  difficulty: text("difficulty"),
  branchId: integer("branch_id"),
});

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  class: text("class").notNull(),
  section: text("section"),
  subject: text("subject").notNull(),
  term: text("term"),
  totalMarks: real("total_marks").notNull(),
  timeLimit: integer("time_limit"),
  questions: jsonb("questions").notNull().default([]),
  assignedBy: text("assigned_by"),
  status: text("status").notNull().default("Draft"),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: text("quiz_id").notNull(),
  quizTitle: text("quiz_title").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  section: text("section"),
  answers: jsonb("answers").notNull().default([]),
  score: real("score").notNull(),
  maxScore: real("max_score").notNull(),
  autoGraded: boolean("auto_graded").notNull().default(true),
  status: text("status").notNull().default("Submitted"),
  submittedAt: text("submitted_at"),
  branchId: integer("branch_id"),
});

export const posItemsTable = pgTable("pos_items", {
  id: serial("id").primaryKey(),
  itemCode: text("item_code").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: real("price").notNull(),
  stock: integer("stock").notNull().default(0),
  branchId: integer("branch_id"),
});

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNo: text("invoice_no").notNull().unique(),
  date: text("date").notNull(),
  customer: text("customer").notNull(),
  items: jsonb("items").notNull().default([]),
  grandTotal: real("grand_total").notNull(),
  branchId: integer("branch_id"),
});

export const bookCategoriesTable = pgTable("book_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  accessionNo: text("accession_no").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  isbn: text("isbn").notNull(),
  edition: text("edition"),
  publisher: text("publisher"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  status: text("status").notNull().default("Available"),
  branchId: integer("branch_id"),
});

export const libraryMembersTable = pgTable("library_members", {
  id: serial("id").primaryKey(),
  memberId: text("member_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  contact: text("contact").notNull(),
  referenceId: text("reference_id").notNull(),
  branchId: integer("branch_id"),
});

export const bookIssuesTable = pgTable("book_issues", {
  id: serial("id").primaryKey(),
  bookId: text("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  accessionNo: text("accession_no").notNull(),
  memberId: text("member_id").notNull(),
  memberName: text("member_name").notNull(),
  memberType: text("member_type").notNull(),
  class: text("class"),
  section: text("section"),
  issueDate: text("issue_date").notNull(),
  dueDate: text("due_date").notNull(),
  returnDate: text("return_date"),
  fine: real("fine").notNull().default(0),
  finePaid: boolean("fine_paid").notNull().default(false),
  status: text("status").notNull().default("Issued"),
  branchId: integer("branch_id"),
});

export const routesTable = pgTable("routes", {
  id: serial("id").primaryKey(),
  routeId: text("route_id"),
  routeCode: text("route_code").notNull(),
  routeName: text("route_name").notNull(),
  stops: jsonb("stops").notNull().default([]),
  branchId: integer("branch_id"),
});

export const vehiclesTable = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleId: text("vehicle_id"),
  registrationNumber: text("registration_number").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity").notNull(),
  model: text("model").notNull(),
  make: text("make").notNull(),
  year: integer("year").notNull(),
  driverId: text("driver_id"),
  driverName: text("driver_name"),
  routeId: text("route_id"),
  routeName: text("route_name"),
  status: text("status").notNull().default("Active"),
  insuranceExpiry: text("insurance_expiry").notNull(),
  fitnessExpiry: text("fitness_expiry").notNull(),
  branchId: integer("branch_id"),
});

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  driverId: text("driver_id"),
  name: text("name").notNull(),
  cnic: text("cnic").notNull(),
  contact: text("contact").notNull(),
  address: text("address"),
  licenseNumber: text("license_number").notNull(),
  licenseExpiry: text("license_expiry").notNull(),
  experience: integer("experience").notNull(),
  vehicleId: text("vehicle_id"),
  routeId: text("route_id"),
  salary: real("salary").notNull(),
  status: text("status").notNull().default("Active"),
  branchId: integer("branch_id"),
});

export const studentTransportsTable = pgTable("student_transports", {
  id: serial("id").primaryKey(),
  allocationId: text("allocation_id"),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  section: text("section").notNull(),
  routeId: text("route_id").notNull(),
  routeName: text("route_name").notNull(),
  stopName: text("stop_name").notNull(),
  pickupTime: text("pickup_time").notNull(),
  dropTime: text("drop_time").notNull(),
  monthlyFee: real("monthly_fee").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  vehicleId: text("vehicle_id"),
  status: text("status").notNull().default("Active"),
  branchId: integer("branch_id"),
});

export const hostelRoomsTable = pgTable("hostel_rooms", {
  id: serial("id").primaryKey(),
  hostelName: text("hostel_name").notNull(),
  roomNumber: text("room_number").notNull(),
  bedCount: integer("bed_count").notNull(),
  occupiedBeds: integer("occupied_beds").notNull().default(0),
  status: text("status").notNull().default("Available"),
  branchId: integer("branch_id"),
});

export const hostelResidentsTable = pgTable("hostel_residents", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  class: text("class").notNull(),
  roomId: text("room_id").notNull(),
  roomNumber: text("room_number").notNull(),
  bedNumber: integer("bed_number").notNull(),
  joinDate: text("join_date").notNull(),
  status: text("status").notNull().default("Active"),
  branchId: integer("branch_id"),
});

export const hostelFeesTable = pgTable("hostel_fees", {
  id: serial("id").primaryKey(),
  residentId: text("resident_id").notNull(),
  studentName: text("student_name").notNull(),
  month: text("month").notNull(),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("Unpaid"),
  paidDate: text("paid_date"),
  branchId: integer("branch_id"),
});

export const teacherAssignmentsTable = pgTable("teacher_assignments", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  staffName: text("staff_name").notNull(),
  staffEmail: text("staff_email").notNull(),
  className: text("class_name").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  assignedBy: text("assigned_by").notNull(),
  dateAssigned: text("date_assigned"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const teacherContentsTable = pgTable("teacher_contents", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  className: text("class_name").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  contentType: text("content_type").notNull(),
  fileData: text("file_data").notNull().default(""),
  fileName: text("file_name").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const teacherQuizzesTable = pgTable("teacher_quizzes", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  className: text("class_name").notNull(),
  section: text("section").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  instructions: text("instructions").notNull().default(""),
  timeLimitMinutes: integer("time_limit_minutes").notNull().default(30),
  startDateTime: text("start_date_time").notNull(),
  endDateTime: text("end_date_time").notNull(),
  passingMarks: real("passing_marks").notNull(),
  totalMarks: real("total_marks").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  questions: jsonb("questions").notNull().default([]),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const studentQuizAttemptsTable = pgTable("student_quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: text("quiz_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  className: text("class_name").notNull(),
  section: text("section").notNull(),
  answers: jsonb("answers").notNull().default([]),
  totalMarksObtained: real("total_marks_obtained").notNull().default(0),
  totalMarks: real("total_marks").notNull(),
  percentage: real("percentage").notNull().default(0),
  grade: text("grade").notNull().default("F"),
  isPassed: boolean("is_passed").notNull().default(false),
  timeTakenMinutes: real("time_taken_minutes").notNull().default(0),
  submittedAt: text("submitted_at"),
  branchId: integer("branch_id"),
});

export const studentPortalAccountsTable = pgTable("student_portal_accounts", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  studentName: text("student_name").notNull(),
  className: text("class_name").notNull(),
  section: text("section").notNull(),
  passwordHash: text("password_hash").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isFirstLogin: boolean("is_first_login").notNull().default(true),
  lastLogin: text("last_login"),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const teacherAuthPasswordsTable = pgTable("teacher_auth_passwords", {
  id: serial("id").primaryKey(),
  staffId: text("staff_id").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  module: text("module").notNull(),
  priority: text("priority").notNull().default("medium"),
  read: boolean("read").notNull().default(false),
  link: text("link"),
  createdAt: text("created_at").notNull(),
  metadata: jsonb("metadata"),
  branchId: integer("branch_id"),
});

export const activityLogsTable = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  module: text("module").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  entityName: text("entity_name"),
  description: text("description").notNull(),
  userId: text("user_id"),
  userEmail: text("user_email"),
  metadata: jsonb("metadata"),
  createdAt: text("created_at").notNull(),
  branchId: integer("branch_id"),
  ipAddress: text("ip_address"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
});

// ============== PARENT PORTAL TABLES ==============

export const parentAccountsTable = pgTable("parent_accounts", {
  id: serial("id").primaryKey(),
  cnic: text("cnic").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  isActive: boolean("is_active").notNull().default(true),
  isFirstLogin: boolean("is_first_login").notNull().default(true),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const parentStudentLinksTable = pgTable("parent_student_links", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  studentId: text("student_id").notNull(),
  relation: text("relation").notNull().default("Parent"),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const parentMessagesTable = pgTable("parent_messages", {
  id: serial("id").primaryKey(),
  senderRole: text("sender_role").notNull(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  studentId: text("student_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

export const parentNotificationsTable = pgTable("parent_notifications", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  studentId: text("student_id"),
  type: text("type"),
  title: text("title"),
  body: text("body"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: text("created_at"),
  branchId: integer("branch_id"),
});

// ============== MULTI-TENANT SCHEMAS ==============

export const schoolSchema = z.object({
  id: z.number(),
  name: z.string(),
  logoUrl: z.string().optional(),
  subscriptionPlan: z.string(),
  status: z.string(),
  expiryDate: z.string().optional().nullable(),
  createdAt: z.string().optional(),
});
export const insertSchoolSchema = schoolSchema.omit({ id: true, createdAt: true });
export type School = z.infer<typeof schoolSchema>;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;

export const branchSchema = z.object({
  id: z.number(),
  schoolId: z.number(),
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.string(),
  createdAt: z.string().optional(),
});
export const insertBranchSchema = branchSchema.omit({ id: true, createdAt: true });
export type Branch = z.infer<typeof branchSchema>;
export type InsertBranch = z.infer<typeof insertBranchSchema>;

// ============== MODULE CREDENTIALS ==============
export const moduleCredentials = {
  student: { email: "student@emblazers.com", password: "12345678" },
  hr: { email: "hr@emblazers.com", password: "12345678" },
  fee: { email: "fee@emblazers.com", password: "12345678" },
  payroll: { email: "payroll@emblazers.com", password: "12345678" },
  finance: { email: "finance@emblazers.com", password: "12345678" },
  attendance: { email: "attendance@emblazers.com", password: "12345678" },
  timetable: { email: "timetable@emblazers.com", password: "12345678" },
  datesheet: { email: "datesheet@emblazers.com", password: "12345678" },
  curriculum: { email: "admin@emblazers.com", password: "12345678" },
  pos: { email: "pos@emblazers.com", password: "12345678" },
  library: { email: "library@emblazers.com", password: "12345678" },
  transport: { email: "transport@emblazers.com", password: "12345678" },
  hostel: { email: "hostel@emblazers.com", password: "12345678" },
  reports: { email: "reports@emblazers.com", password: "12345678" },
} as const;

export type ModuleType = keyof typeof moduleCredentials | "parent";

// ============== STUDENT MODULE ==============
export const studentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  name: z.string().min(1, "Full name is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  parentName: z.string().min(1, "Parent/guardian name is required"),
  parentContact: z.string().min(1, "Contact number is required"),
  parentEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  fatherCnic: z.string().optional(),
  motherCnic: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  class: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  admissionDate: z.string().min(1, "Admission date is required"),
  status: z.enum(["Active", "Inactive", "Alumni", "Left"]),
  photo: z.string().optional(),
  notes: z.string().optional(),
  bform: z.string().min(1, "B-Form number is required"),
});

export const insertStudentSchema = studentSchema
  .omit({ id: true, studentId: true })
  .refine((data) => data.fatherCnic || data.motherCnic, {
    message: "At least one parent's CNIC (Father's or Mother's) is required",
    path: ["fatherCnic"],
  });

export type Student = z.infer<typeof studentSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

// ============== STAFF / HR MODULE ==============
export const staffSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  name: z.string().min(1, "Full name is required"),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().min(1, "Department is required"),
  campus: z.string().min(1, "Campus is required"),
  employmentType: z.enum(["Full-time", "Part-time", "Contract"]),
  status: z.enum(["Active", "Probation", "On Leave", "Terminated"]),
  joiningDate: z.string().min(1, "Joining date is required"),
  basicSalary: z.number().min(1, "Basic salary must be greater than 0"),
  paymentMode: z.enum(["Bank Transfer", "Cash", "Cheque"]),
  photo: z.string().optional(),
  portalEmail: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  portalPassword: z.string().optional(),
});

export const insertStaffSchema = staffSchema.omit({ id: true, staffId: true });
export type Staff = z.infer<typeof staffSchema>;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export const vacancySchema = z.object({
  id: z.string(),
  title: z.string(),
  department: z.string(),
  designation: z.string(),
  positions: z.number(),
  employmentType: z.enum(["Permanent", "Contract", "Visiting"]),
  salaryRange: z.string().optional(),
  qualifications: z.string(),
  experience: z.string(),
  description: z.string(),
  lastDate: z.string(),
  status: z.enum(["Open", "Closed", "On Hold"]),
});

export const insertVacancySchema = vacancySchema.omit({ id: true });
export type Vacancy = z.infer<typeof vacancySchema>;
export type InsertVacancy = z.infer<typeof insertVacancySchema>;

export const applicantSchema = z.object({
  id: z.string(),
  vacancyId: z.string(),
  vacancyTitle: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  cnic: z.string(),
  address: z.string().optional(),
  qualification: z.string(),
  experience: z.string(),
  expectedSalary: z.number().optional(),
  appliedDate: z.string(),
  status: z.enum(["New", "Shortlisted", "Interviewed", "Offered", "Hired", "Rejected"]),
});

export const insertApplicantSchema = applicantSchema.omit({ id: true });
export type Applicant = z.infer<typeof applicantSchema>;
export type InsertApplicant = z.infer<typeof insertApplicantSchema>;

// ============== FEE MODULE ==============
export const feeHeadSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

export const feeVoucherSchema = z.object({
  id: z.string(),
  voucherId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  section: z.string(),
  month: z.string(),
  feeHeads: z.array(feeHeadSchema),
  totalAmount: z.number(),
  discount: z.number(),
  fine: z.number(),
  netAmount: z.number(),
  paidAmount: z.number(),
  dueDate: z.string(),
  status: z.enum(["Paid", "Unpaid", "Partial"]),
  paymentHistory: z.array(z.object({
    date: z.string(),
    amount: z.number(),
    method: z.string(),
  })),
});

export const insertFeeVoucherSchema = feeVoucherSchema.omit({ id: true, voucherId: true });
export type FeeVoucher = z.infer<typeof feeVoucherSchema>;
export type InsertFeeVoucher = z.infer<typeof insertFeeVoucherSchema>;

// ============== PAYROLL MODULE ==============
export const payrollSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  staffName: z.string(),
  designation: z.string(),
  department: z.string(),
  month: z.string(),
  basicSalary: z.number(),
  allowances: z.array(z.object({ name: z.string(), amount: z.number() })),
  deductions: z.array(z.object({ name: z.string(), amount: z.number() })),
  grossSalary: z.number(),
  netSalary: z.number(),
  status: z.enum(["Paid", "Unpaid"]),
  paidDate: z.string().optional(),
});

export const insertPayrollSchema = payrollSchema.omit({ id: true });
export type Payroll = z.infer<typeof payrollSchema>;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

// ============== FINANCE MODULE ==============
export const accountSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
  balance: z.number(),
});

export const insertAccountSchema = accountSchema.omit({ id: true });
export type Account = z.infer<typeof accountSchema>;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export const voucherEntrySchema = z.object({
  accountId: z.string(),
  accountName: z.string(),
  debit: z.number(),
  credit: z.number(),
  description: z.string().optional(),
});

export const financeVoucherSchema = z.object({
  id: z.string(),
  voucherId: z.string(),
  voucherNumber: z.string(),
  type: z.enum(["Receipt", "Payment", "Journal", "Contra"]),
  date: z.string(),
  entries: z.array(voucherEntrySchema),
  totalDebit: z.number(),
  totalCredit: z.number(),
  narration: z.string(),
  reference: z.string().optional(),
  status: z.enum(["Draft", "Posted", "Cancelled"]),
  sourceModule: z.string().optional().nullable(),
  createdBy: z.string(),
  postedBy: z.string().optional(),
  postedAt: z.string().optional(),
  cancelledBy: z.string().optional(),
  cancelledAt: z.string().optional(),
  createdAt: z.string(),
});

export const insertFinanceVoucherSchema = financeVoucherSchema.omit({ id: true, voucherId: true, voucherNumber: true, createdAt: true });
export type FinanceVoucher = z.infer<typeof financeVoucherSchema>;
export type InsertFinanceVoucher = z.infer<typeof insertFinanceVoucherSchema>;

// ============== FEE STRUCTURE & CHALLAN SYSTEM ==============
export const feeStructureSchema = z.object({
  id: z.string(),
  structureId: z.string(),
  name: z.string(),
  academicSession: z.string(),
  class: z.string(),
  description: z.string().optional(),
  feeHeads: z.array(z.object({
    name: z.string(),
    amount: z.number(),
    frequency: z.enum(["Monthly", "Quarterly", "Half-Yearly", "Yearly", "One-Time"]),
    optional: z.boolean().optional(),
  })),
  totalAmount: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const insertFeeStructureSchema = feeStructureSchema.omit({ id: true, structureId: true, createdAt: true });
export type FeeStructure = z.infer<typeof feeStructureSchema>;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;

export const discountRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Percentage", "Fixed"]),
  value: z.number(),
  category: z.enum(["Sibling", "Merit", "Staff Child", "Scholarship", "Early Bird", "Other"]),
  applicableClasses: z.array(z.string()).optional(),
  applicableFeeHeads: z.array(z.string()).optional(),
  validFrom: z.string(),
  validTo: z.string().optional(),
  isActive: z.boolean(),
});

export const insertDiscountRuleSchema = discountRuleSchema.omit({ id: true });
export type DiscountRule = z.infer<typeof discountRuleSchema>;
export type InsertDiscountRule = z.infer<typeof insertDiscountRuleSchema>;

export const lateFeeRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["Fixed", "Percentage", "Daily"]),
  value: z.number(),
  gracePeriodDays: z.number(),
  maxLateFee: z.number().optional(),
  applicableClasses: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

export const insertLateFeeRuleSchema = lateFeeRuleSchema.omit({ id: true });
export type LateFeeRule = z.infer<typeof lateFeeRuleSchema>;
export type InsertLateFeeRule = z.infer<typeof insertLateFeeRuleSchema>;

export const installmentPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  numberOfInstallments: z.number(),
  installments: z.array(z.object({
    installmentNumber: z.number(),
    percentage: z.number(),
    dueDate: z.string(),
  })),
  applicableClasses: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

export const insertInstallmentPlanSchema = installmentPlanSchema.omit({ id: true });
export type InstallmentPlan = z.infer<typeof installmentPlanSchema>;
export type InsertInstallmentPlan = z.infer<typeof insertInstallmentPlanSchema>;

export const challanSchema = z.object({
  id: z.string(),
  challanNo: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  section: z.string(),
  academicSession: z.string(),
  period: z.string(),
  feeStructureId: z.string().optional(),
  feeHeads: z.array(z.object({
    name: z.string(),
    amount: z.number(),
  })),
  totalAmount: z.number(),
  discountId: z.string().optional(),
  discountName: z.string().optional(),
  discountAmount: z.number(),
  lateFee: z.number(),
  adjustments: z.number(),
  netAmount: z.number(),
  paidAmount: z.number(),
  balanceAmount: z.number(),
  dueDate: z.string(),
  issueDate: z.string(),
  status: z.enum(["Pending", "Partial", "Paid", "Overdue", "Cancelled"]),
  installmentPlanId: z.string().optional(),
  installmentNumber: z.number().optional(),
  createdAt: z.string(),
});

export const insertChallanSchema = challanSchema.omit({ id: true, challanNo: true, createdAt: true });
export type Challan = z.infer<typeof challanSchema>;
export type InsertChallan = z.infer<typeof insertChallanSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  receiptNo: z.string(),
  challanId: z.string(),
  challanNo: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  amount: z.number(),
  paymentMode: z.enum(["Cash", "Bank Transfer", "Cheque", "Online", "Card"]),
  transactionRef: z.string().optional(),
  bankName: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().optional(),
  paymentDate: z.string(),
  receivedBy: z.string(),
  notes: z.string().optional(),
  type: z.enum(["Payment", "Refund", "Adjustment"]),
  status: z.enum(["Completed", "Pending", "Cancelled", "Bounced"]),
  createdAt: z.string(),
});

export const insertPaymentSchema = paymentSchema.omit({ id: true, receiptNo: true, createdAt: true });
export type Payment = z.infer<typeof paymentSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// ============== EXPENSES & VENDOR MANAGEMENT ==============
export const vendorSchema = z.object({
  id: z.string(),
  vendorId: z.string(),
  name: z.string(),
  contactPerson: z.string().optional(),
  phone: z.string(),
  email: z.string().optional(),
  address: z.string(),
  category: z.enum(["Supplier", "Contractor", "Service Provider", "Utility", "Other"]),
  bankName: z.string().optional(),
  accountNo: z.string().optional(),
  taxId: z.string().optional(),
  status: z.enum(["Active", "Inactive"]),
  createdAt: z.string(),
});

export const insertVendorSchema = vendorSchema.omit({ id: true, vendorId: true, createdAt: true });
export type Vendor = z.infer<typeof vendorSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export const vendorPaymentSchema = z.object({
  id: z.number(),
  vendorId: z.string(),
  vendorName: z.string(),
  amount: z.number(),
  description: z.string(),
  paymentDate: z.string(),
  voucherId: z.string().optional().nullable(),
  branchId: z.number().optional().nullable(),
  createdAt: z.string(),
});
export const insertVendorPaymentSchema = vendorPaymentSchema.omit({ id: true, createdAt: true, voucherId: true });
export type VendorPayment = z.infer<typeof vendorPaymentSchema>;
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;

export const expenseSchema = z.object({
  id: z.string(),
  expenseId: z.string(),
  date: z.string(),
  category: z.enum(["Utilities", "Supplies", "Maintenance", "Salary", "Transport", "Events", "Marketing", "IT", "Other"]),
  subcategory: z.string().optional(),
  description: z.string(),
  vendorId: z.string().optional(),
  vendorName: z.string().optional(),
  amount: z.number(),
  paymentMode: z.enum(["Cash", "Bank Transfer", "Cheque", "Online"]),
  transactionRef: z.string().optional(),
  invoiceNo: z.string().optional(),
  invoiceDate: z.string().optional(),
  accountId: z.string().optional(),
  accountName: z.string().optional(),
  status: z.enum(["Pending", "Approved", "Paid", "Cancelled"]),
  approvedBy: z.string().optional(),
  paidBy: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  createdAt: z.string(),
});

export const insertExpenseSchema = expenseSchema.omit({ id: true, expenseId: true, createdAt: true });
export type Expense = z.infer<typeof expenseSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// ============== CHART OF ACCOUNTS & LEDGER ==============
export const chartOfAccountsSchema = z.object({
  id: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
  parentAccountId: z.string().optional(),
  level: z.number(),
  description: z.string().optional(),
  openingBalance: z.number(),
  currentBalance: z.number(),
  isSystemAccount: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const insertChartOfAccountsSchema = chartOfAccountsSchema.omit({ id: true, createdAt: true });
export type ChartOfAccounts = z.infer<typeof chartOfAccountsSchema>;
export type InsertChartOfAccounts = z.infer<typeof insertChartOfAccountsSchema>;

export const ledgerEntrySchema = z.object({
  id: z.string(),
  entryNo: z.string(),
  date: z.string(),
  accountId: z.string(),
  accountCode: z.string(),
  accountName: z.string(),
  description: z.string(),
  referenceType: z.enum(["Challan", "Payment", "Expense", "Payroll", "Journal", "Opening", "Voucher", "FeeCollection", "SalaryPayment"]),
  referenceId: z.string().optional(),
  referenceNo: z.string().optional(),
  debit: z.number(),
  credit: z.number(),
  balance: z.number(),
  createdBy: z.string().optional(),
  createdAt: z.string(),
});

export const insertLedgerEntrySchema = ledgerEntrySchema.omit({ id: true, entryNo: true, createdAt: true });
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

export const journalEntrySchema = z.object({
  id: z.string(),
  journalNo: z.string(),
  date: z.string(),
  description: z.string(),
  entries: z.array(z.object({
    accountId: z.string(),
    accountCode: z.string(),
    accountName: z.string(),
    debit: z.number(),
    credit: z.number(),
  })),
  totalDebit: z.number(),
  totalCredit: z.number(),
  status: z.enum(["Draft", "Posted", "Reversed"]),
  createdBy: z.string().optional(),
  approvedBy: z.string().optional(),
  createdAt: z.string(),
});

export const insertJournalEntrySchema = journalEntrySchema.omit({ id: true, journalNo: true, createdAt: true });
export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

// ============== ATTENDANCE MODULE ==============
export const attendanceTargetType = z.enum(["STUDENT", "STAFF"]);
export type AttendanceTargetType = z.infer<typeof attendanceTargetType>;

export const attendanceStatus = z.enum(["PRESENT", "ABSENT", "LEAVE"]);
export type AttendanceStatus = z.infer<typeof attendanceStatus>;

export const attendanceRecordSchema = z.object({
  id: z.string(),
  date: z.string(),
  targetType: attendanceTargetType,
  studentId: z.string().nullable().optional(),
  staffId: z.string().nullable().optional(),
  entityName: z.string(),
  className: z.string().nullable().optional(),
  section: z.string().nullable().optional(),
  status: attendanceStatus,
  markedBy: z.string().optional(),
  remarks: z.string().optional(),
  markedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const insertAttendanceRecordSchema = attendanceRecordSchema.omit({ id: true, markedAt: true, updatedAt: true });
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;

export const attendanceSummarySchema = z.object({
  date: z.string(),
  total: z.number(),
  present: z.number(),
  absent: z.number(),
  leave: z.number(),
});
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;

// ============== TIMETABLE MODULE ==============
export const timetableSlotSchema = z.object({
  day: z.string(),
  period: z.number(),
  subject: z.string(),
  teacherId: z.string(),
  teacherName: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export const timetableSchema = z.object({
  id: z.string(),
  class: z.string(),
  section: z.string(),
  slots: z.array(timetableSlotSchema),
  updatedAt: z.string(),
});

export const insertTimetableSchema = timetableSchema.omit({ id: true });
export type Timetable = z.infer<typeof timetableSchema>;
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type TimetableSlot = z.infer<typeof timetableSlotSchema>;

// ============== DATE SHEET MODULE ==============
export const examEntrySchema = z.object({
  subject: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string(),
  invigilatorId: z.string(),
  invigilatorName: z.string(),
});

export const dateSheetSchema = z.object({
  id: z.string(),
  examName: z.string(),
  examType: z.enum(["Monthly", "Term", "Mid-Term", "Final", "Quiz", "Test", "Annual"]),
  class: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  entries: z.array(examEntrySchema),
});

export const insertDateSheetSchema = dateSheetSchema.omit({ id: true });
export type DateSheet = z.infer<typeof dateSheetSchema>;
export type InsertDateSheet = z.infer<typeof insertDateSheetSchema>;
export type ExamEntry = z.infer<typeof examEntrySchema>;

// ============== CURRICULUM & EXAM MODULE ==============
export const syllabusTopicSchema = z.object({
  topic: z.string(),
  status: z.enum(["Not Started", "In Progress", "Completed"]),
});

export const curriculumSchema = z.object({
  id: z.string(),
  class: z.string(),
  subject: z.string(),
  topics: z.array(syllabusTopicSchema),
  assignedTeachers: z.array(z.object({
    teacherId: z.string(),
    teacherName: z.string(),
    assignedAt: z.string().optional(),
  })).optional().default([]),
});

export const insertCurriculumSchema = curriculumSchema.omit({ id: true });
export type Curriculum = z.infer<typeof curriculumSchema>;
export type InsertCurriculum = z.infer<typeof insertCurriculumSchema>;

export const examSchema = z.object({
  id: z.string(),
  name: z.string(),
  term: z.string(),
  classRange: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const insertExamSchema = examSchema.omit({ id: true });
export type Exam = z.infer<typeof examSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;

export const resultSchema = z.object({
  id: z.string(),
  examId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  section: z.string().nullable().optional(),
  subject: z.string(),
  marksObtained: z.number(),
  maxMarks: z.number(),
  grade: z.string(),
  status: z.string().nullable().optional(),
  enteredBy: z.string().nullable().optional(),
  enteredAt: z.string().nullable().optional(),
  verifiedBy: z.string().nullable().optional(),
  verifiedAt: z.string().nullable().optional(),
});

export const insertResultSchema = resultSchema.omit({ id: true });
export type Result = z.infer<typeof resultSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;

// ============== QUIZ MODULE (within Curriculum) ==============
export const questionSchema = z.object({
  id: z.string(),
  subject: z.string(),
  class: z.string(),
  type: z.enum(["MCQ", "TrueFalse", "ShortAnswer"]),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  marks: z.number().default(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
});

export const insertQuestionSchema = questionSchema.omit({ id: true });
export type Question = z.infer<typeof questionSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export const quizQuestionRefSchema = z.object({
  questionId: z.string(),
  marks: z.number(),
});

export const quizSchema = z.object({
  id: z.string(),
  title: z.string(),
  class: z.string(),
  section: z.string().optional(),
  subject: z.string(),
  term: z.string().optional(),
  totalMarks: z.number(),
  timeLimit: z.number().optional(),
  questions: z.array(quizQuestionRefSchema),
  assignedBy: z.string().optional(),
  status: z.enum(["Draft", "Published", "Closed"]),
  createdAt: z.string().optional(),
});

export const insertQuizSchema = quizSchema.omit({ id: true });
export type Quiz = z.infer<typeof quizSchema>;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

export const quizAttemptSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  quizTitle: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  section: z.string().optional(),
  answers: z.array(quizAnswerSchema),
  score: z.number(),
  maxScore: z.number(),
  autoGraded: z.boolean().default(true),
  status: z.enum(["Submitted", "Graded"]),
  submittedAt: z.string().optional(),
});

export const insertQuizAttemptSchema = quizAttemptSchema.omit({ id: true });
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;

// ============== POS MODULE ==============
export const posItemSchema = z.object({
  id: z.string(),
  itemCode: z.string(),
  name: z.string(),
  category: z.enum(["Uniforms", "Books", "Stationery", "Other"]),
  price: z.number(),
  stock: z.number(),
});

export const insertPosItemSchema = posItemSchema.omit({ id: true }).extend({ itemCode: z.string().optional() });
export type PosItem = z.infer<typeof posItemSchema>;
export type InsertPosItem = z.infer<typeof insertPosItemSchema>;

export const saleItemSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number(),
  price: z.number(),
  total: z.number(),
});

export const saleSchema = z.object({
  id: z.string(),
  invoiceNo: z.string(),
  date: z.string(),
  customer: z.string(),
  items: z.array(saleItemSchema),
  grandTotal: z.number(),
});

export const insertSaleSchema = saleSchema.omit({ id: true });
export type Sale = z.infer<typeof saleSchema>;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;

// ============== LIBRARY MODULE ==============
export const bookCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  isDefault: z.boolean().default(false),
  createdAt: z.string().optional(),
});

export const insertBookCategorySchema = bookCategorySchema.omit({ id: true });
export type BookCategory = z.infer<typeof bookCategorySchema>;
export type InsertBookCategory = z.infer<typeof insertBookCategorySchema>;

export const bookSchema = z.object({
  id: z.string(),
  accessionNo: z.string(),
  title: z.string(),
  author: z.string(),
  category: z.string(),
  isbn: z.string(),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  totalCopies: z.number().default(1),
  availableCopies: z.number().default(1),
  status: z.enum(["Available", "Issued", "Out of Stock"]),
});

export const insertBookSchema = bookSchema.omit({ id: true });
export type Book = z.infer<typeof bookSchema>;
export type InsertBook = z.infer<typeof insertBookSchema>;

export const libraryMemberSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  name: z.string(),
  type: z.enum(["Student", "Staff"]),
  contact: z.string(),
  referenceId: z.string(),
});

export const insertLibraryMemberSchema = libraryMemberSchema.omit({ id: true, memberId: true });
export type LibraryMember = z.infer<typeof libraryMemberSchema>;
export type InsertLibraryMember = z.infer<typeof insertLibraryMemberSchema>;

export const bookIssueSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  bookTitle: z.string(),
  accessionNo: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  memberType: z.enum(["Student", "Staff"]),
  class: z.string().optional(),
  section: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string(),
  returnDate: z.string().optional(),
  fine: z.number().default(0),
  finePaid: z.boolean().default(false),
  status: z.enum(["Issued", "Returned", "Overdue"]),
});

export const insertBookIssueSchema = bookIssueSchema.omit({ id: true });
export type BookIssue = z.infer<typeof bookIssueSchema>;
export type InsertBookIssue = z.infer<typeof insertBookIssueSchema>;

// ============== TRANSPORT MODULE ==============
export const routeSchema = z.object({
  id: z.string(),
  routeId: z.string().optional(),
  routeCode: z.string(),
  routeName: z.string(),
  stops: z.array(z.string()),
});

export const insertRouteSchema = routeSchema.omit({ id: true, routeId: true });
export type Route = z.infer<typeof routeSchema>;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export const vehicleSchema = z.object({
  id: z.string(),
  vehicleId: z.string().optional(),
  registrationNumber: z.string(),
  type: z.enum(["Bus", "Van", "Coaster", "Car"]),
  capacity: z.number(),
  model: z.string(),
  make: z.string(),
  year: z.number(),
  driverId: z.string().optional(),
  driverName: z.string().optional(),
  routeId: z.string().optional(),
  routeName: z.string().optional(),
  status: z.enum(["Active", "Under Maintenance", "Inactive"]).default("Active"),
  insuranceExpiry: z.string(),
  fitnessExpiry: z.string(),
});

export const insertVehicleSchema = vehicleSchema.omit({ id: true, vehicleId: true });
export type Vehicle = z.infer<typeof vehicleSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export const driverSchema = z.object({
  id: z.string(),
  driverId: z.string().optional(),
  name: z.string(),
  cnic: z.string(),
  contact: z.string(),
  address: z.string().optional(),
  licenseNumber: z.string(),
  licenseExpiry: z.string(),
  experience: z.number(),
  vehicleId: z.string().optional(),
  routeId: z.string().optional(),
  salary: z.number(),
  status: z.enum(["Active", "On Leave", "Inactive"]).default("Active"),
});

export const insertDriverSchema = driverSchema.omit({ id: true, driverId: true });
export type Driver = z.infer<typeof driverSchema>;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export const studentTransportSchema = z.object({
  id: z.string(),
  allocationId: z.string().optional(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  section: z.string(),
  routeId: z.string(),
  routeName: z.string(),
  stopName: z.string(),
  pickupTime: z.string(),
  dropTime: z.string(),
  monthlyFee: z.number(),
  startDate: z.string(),
  endDate: z.string().optional(),
  vehicleId: z.string().optional(),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

export const insertStudentTransportSchema = studentTransportSchema.omit({ id: true, allocationId: true });
export type StudentTransport = z.infer<typeof studentTransportSchema>;
export type InsertStudentTransport = z.infer<typeof insertStudentTransportSchema>;

// ============== HOSTEL MODULE ==============
export const hostelRoomSchema = z.object({
  id: z.string(),
  hostelName: z.string(),
  roomNumber: z.string(),
  bedCount: z.number(),
  occupiedBeds: z.number(),
  status: z.enum(["Available", "Full", "Maintenance"]),
});

export const insertHostelRoomSchema = hostelRoomSchema.omit({ id: true });
export type HostelRoom = z.infer<typeof hostelRoomSchema>;
export type InsertHostelRoom = z.infer<typeof insertHostelRoomSchema>;

export const hostelResidentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  class: z.string(),
  roomId: z.string(),
  roomNumber: z.string(),
  bedNumber: z.number(),
  joinDate: z.string(),
  status: z.enum(["Active", "Left"]),
});

export const insertHostelResidentSchema = hostelResidentSchema.omit({ id: true });
export type HostelResident = z.infer<typeof hostelResidentSchema>;
export type InsertHostelResident = z.infer<typeof insertHostelResidentSchema>;

export const hostelFeeSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  studentName: z.string(),
  month: z.string(),
  amount: z.number(),
  status: z.enum(["Paid", "Unpaid"]),
  paidDate: z.string().optional(),
});

export const insertHostelFeeSchema = hostelFeeSchema.omit({ id: true });
export type HostelFee = z.infer<typeof hostelFeeSchema>;
export type InsertHostelFee = z.infer<typeof insertHostelFeeSchema>;

// ============== TEACHER ASSIGNMENTS ==============
export const teacherAssignmentSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  staffName: z.string(),
  staffEmail: z.string(),
  className: z.string(),
  section: z.string(),
  subject: z.string(),
  assignedBy: z.string(),
  dateAssigned: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().optional(),
});
export const insertTeacherAssignmentSchema = teacherAssignmentSchema.omit({ id: true, createdAt: true });
export type TeacherAssignment = z.infer<typeof teacherAssignmentSchema>;
export type InsertTeacherAssignment = z.infer<typeof insertTeacherAssignmentSchema>;

// ============== TEACHER CONTENT ==============
export const teacherContentSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  teacherName: z.string(),
  className: z.string(),
  section: z.string(),
  subject: z.string(),
  title: z.string(),
  description: z.string().default(""),
  contentType: z.enum(["pdf", "image", "note", "link"]),
  fileData: z.string().default(""),
  fileName: z.string().default(""),
  isPublished: z.boolean().default(false),
  createdAt: z.string().optional(),
});
export const insertTeacherContentSchema = teacherContentSchema.omit({ id: true, createdAt: true });
export type TeacherContent = z.infer<typeof teacherContentSchema>;
export type InsertTeacherContent = z.infer<typeof insertTeacherContentSchema>;

// ============== TEACHER QUIZZES ==============
export const teacherQuizQuestionSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(["mcq", "truefalse", "short"]),
  options: z.array(z.string()).default([]),
  correctAnswer: z.string(),
  marks: z.number().default(1),
});

export const teacherQuizSchema = z.object({
  id: z.string(),
  staffId: z.string(),
  teacherName: z.string(),
  className: z.string(),
  section: z.string(),
  subject: z.string(),
  title: z.string(),
  instructions: z.string().default(""),
  timeLimitMinutes: z.number().default(30),
  startDateTime: z.string(),
  endDateTime: z.string(),
  passingMarks: z.number(),
  totalMarks: z.number(),
  isPublished: z.boolean().default(false),
  questions: z.array(teacherQuizQuestionSchema).default([]),
  createdAt: z.string().optional(),
});
export const insertTeacherQuizSchema = teacherQuizSchema.omit({ id: true, createdAt: true });
export type TeacherQuiz = z.infer<typeof teacherQuizSchema>;
export type InsertTeacherQuiz = z.infer<typeof insertTeacherQuizSchema>;

// ============== STUDENT QUIZ ATTEMPTS ==============
export const studentQuizAnswerSchema = z.object({
  questionIndex: z.number(),
  givenAnswer: z.string().default(""),
  isCorrect: z.boolean().default(false),
  marksAwarded: z.number().default(0),
});

export const studentQuizAttemptSchema = z.object({
  id: z.string(),
  quizId: z.string(),
  studentId: z.string(),
  studentName: z.string(),
  className: z.string(),
  section: z.string(),
  answers: z.array(studentQuizAnswerSchema).default([]),
  totalMarksObtained: z.number().default(0),
  totalMarks: z.number(),
  percentage: z.number().default(0),
  grade: z.string().default("F"),
  isPassed: z.boolean().default(false),
  timeTakenMinutes: z.number().default(0),
  submittedAt: z.string().optional(),
});
export const insertStudentQuizAttemptSchema = studentQuizAttemptSchema.omit({ id: true, submittedAt: true });
export type StudentQuizAttempt = z.infer<typeof studentQuizAttemptSchema>;
export type InsertStudentQuizAttempt = z.infer<typeof insertStudentQuizAttemptSchema>;

// ============== ROLE TYPES ==============
export const userRoleSchema = z.enum(["admin", "manager", "viewer", "teacher", "student", "parent", "staff"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const permissionActionSchema = z.enum(["view", "create", "edit", "delete"]);
export type PermissionAction = z.infer<typeof permissionActionSchema>;

export const rolePermissions: Record<UserRole, PermissionAction[]> = {
  admin: ["view", "create", "edit", "delete"],
  manager: ["view", "create", "edit"],
  teacher: ["view", "create", "edit"],
  student: ["view"],
  parent: ["view"],
  staff: ["view"],
  viewer: ["view"],
} as const;

export const moduleUserCredentials: Record<ModuleType, { email: string; password: string; role: UserRole; name: string }> = {
  student: { email: "student@emblazers.com", password: "12345678", role: "admin", name: "Student Admin" },
  hr: { email: "hr@emblazers.com", password: "12345678", role: "admin", name: "HR Admin" },
  fee: { email: "fee@emblazers.com", password: "12345678", role: "admin", name: "Fee Admin" },
  payroll: { email: "payroll@emblazers.com", password: "12345678", role: "admin", name: "Payroll Admin" },
  finance: { email: "finance@emblazers.com", password: "12345678", role: "admin", name: "Finance Admin" },
  attendance: { email: "attendance@emblazers.com", password: "12345678", role: "admin", name: "Attendance Admin" },
  timetable: { email: "timetable@emblazers.com", password: "12345678", role: "admin", name: "Timetable Admin" },
  datesheet: { email: "datesheet@emblazers.com", password: "12345678", role: "admin", name: "DateSheet Admin" },
  curriculum: { email: "admin@emblazers.com", password: "12345678", role: "admin", name: "Curriculum Admin" },
  pos: { email: "pos@emblazers.com", password: "12345678", role: "admin", name: "POS Admin" },
  library: { email: "library@emblazers.com", password: "12345678", role: "admin", name: "Library Admin" },
  transport: { email: "transport@emblazers.com", password: "12345678", role: "admin", name: "Transport Admin" },
  hostel: { email: "hostel@emblazers.com", password: "12345678", role: "admin", name: "Hostel Admin" },
  reports: { email: "reports@emblazers.com", password: "12345678", role: "admin", name: "Reports Admin" },
  parent: { email: "parent@emblazers.com", password: "12345678", role: "parent", name: "Parent" },
} as Record<string, { email: string; password: string; role: UserRole; name: string }>;

// ============== AUTH SESSION ==============
export const authSessionSchema = z.object({
  module: z.string(),
  email: z.string(),
  name: z.string(),
  role: userRoleSchema,
  loggedIn: z.boolean(),
  loginTime: z.string().optional(),
  staffId: z.string().optional(),
  studentId: z.string().optional(),
  className: z.string().optional(),
  section: z.string().optional(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

// ============== ACTIVITY LOGS ==============
export const activityActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "generate",
  "payment",
  "status_change",
  "export",
  "import",
  "login",
  "other"
]);
export type ActivityAction = z.infer<typeof activityActionSchema>;

export const activityLogSchema = z.object({
  id: z.string(),
  module: z.string(),
  action: activityActionSchema,
  entityType: z.string(),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  description: z.string(),
  userId: z.string().optional(),
  userEmail: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string(),
  ipAddress: z.string().optional(),
  oldValue: z.string().optional(),
  newValue: z.string().optional(),
});

export const insertActivityLogSchema = activityLogSchema.omit({ id: true, createdAt: true });
export type ActivityLog = z.infer<typeof activityLogSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

// ============== NOTIFICATIONS ==============
export const notificationTypeSchema = z.enum([
  "fee_due",
  "fee_overdue",
  "payroll_pending",
  "payroll_processed",
  "low_stock",
  "library_overdue",
  "system",
  "action_log"
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationPrioritySchema = z.enum(["low", "medium", "high"]);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  module: z.string(),
  priority: notificationPrioritySchema,
  read: z.boolean(),
  link: z.string().optional(),
  createdAt: z.string(),
  metadata: z.record(z.string()).optional(),
});

export const insertNotificationSchema = notificationSchema.omit({ id: true, createdAt: true });
export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ============== PARENT PORTAL SCHEMAS ==============
export const parentAccountSchema = z.object({
  id: z.string(),
  cnic: z.string(),
  phone: z.string().optional(),
  passwordHash: z.string(),
  fullName: z.string().optional(),
  isActive: z.boolean(),
  isFirstLogin: z.boolean(),
  createdAt: z.string().optional(),
});
export const insertParentAccountSchema = parentAccountSchema.omit({ id: true, createdAt: true, isFirstLogin: true });
export type ParentAccount = z.infer<typeof parentAccountSchema>;
export type InsertParentAccount = z.infer<typeof insertParentAccountSchema>;

export const parentStudentLinkSchema = z.object({
  id: z.string(),
  parentId: z.number(),
  studentId: z.string(),
  relation: z.string(),
  createdAt: z.string().optional(),
});
export const insertParentStudentLinkSchema = parentStudentLinkSchema.omit({ id: true, createdAt: true });
export type ParentStudentLink = z.infer<typeof parentStudentLinkSchema>;
export type InsertParentStudentLink = z.infer<typeof insertParentStudentLinkSchema>;

export const parentMessageSchema = z.object({
  id: z.string(),
  senderRole: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  studentId: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().optional(),
});
export const insertParentMessageSchema = parentMessageSchema.omit({ id: true, createdAt: true, isRead: true });
export type ParentMessage = z.infer<typeof parentMessageSchema>;
export type InsertParentMessage = z.infer<typeof insertParentMessageSchema>;

export const parentNotificationSchema = z.object({
  id: z.string(),
  parentId: z.number(),
  studentId: z.string().optional(),
  type: z.string().optional(),
  title: z.string().optional(),
  body: z.string().optional(),
  isRead: z.boolean(),
  createdAt: z.string().optional(),
});
export const insertParentNotificationSchema = parentNotificationSchema.omit({ id: true, createdAt: true, isRead: true });
export type ParentNotification = z.infer<typeof parentNotificationSchema>;
export type InsertParentNotification = z.infer<typeof insertParentNotificationSchema>;

// ============== ID CARD REQUESTS TABLE ==============

export const idCardRequestsTable = pgTable("id_card_requests", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
  branchId: integer("branch_id"),
});

// ============== REPORT CARD SETTINGS TABLE ==============

export const reportCardSettingsTable = pgTable("report_card_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default(""),
  schoolAddress: text("school_address"),
  schoolPhone: text("school_phone"),
  schoolEmail: text("school_email"),
  schoolLogo: text("school_logo"),
  principalName: text("principal_name").notNull().default(""),
  principalTitle: text("principal_title").notNull().default("Principal"),
  principalSignature: text("principal_signature"),
  examinerTitle: text("examiner_title").notNull().default("Class Teacher"),
  gradingScale: jsonb("grading_scale").notNull().default([]),
  gradeScale: text("grade_scale").notNull().default("10point"),
  passingPercentage: real("passing_percentage").notNull().default(40),
  showAttendance: boolean("show_attendance").notNull().default(true),
  showRemarks: boolean("show_remarks").notNull().default(true),
  showPosition: boolean("show_position").notNull().default(true),
  showGrade: boolean("show_grade").notNull().default(true),
  showPercentage: boolean("show_percentage").notNull().default(true),
  showSignatures: boolean("show_signatures").notNull().default(true),
  headerColor: text("header_color").notNull().default("#1e40af"),
  footerText: text("footer_text"),
  remarkLabels: jsonb("remark_labels").notNull().default({}),
  branchId: integer("branch_id"),
  updatedAt: text("updated_at"),
});

export const reportCardSettingsSchema = z.object({
  id: z.number(),
  schoolName: z.string().default(""),
  schoolLogo: z.string().nullable().optional(),
  principalName: z.string().default(""),
  principalSignature: z.string().nullable().optional(),
  gradingScale: z.array(z.any()).default([]),
  passingPercentage: z.number().default(40),
  showAttendance: z.boolean().default(true),
  showRemarks: z.boolean().default(true),
  showPosition: z.boolean().default(true),
  showGrade: z.boolean().default(true),
  headerColor: z.string().default("#1e40af"),
  footerText: z.string().nullable().optional(),
  remarkLabels: z.record(z.string()).default({}),
  branchId: z.number().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});
export const insertReportCardSettingsSchema = reportCardSettingsSchema.omit({ id: true });
export type ReportCardSettings = typeof reportCardSettingsTable.$inferSelect;
export type InsertReportCardSettings = z.infer<typeof insertReportCardSettingsSchema>;

// ============== LEAVE APPLICATIONS TABLE ==============

export const leaveApplicationsTable = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  leaveType: text("leave_type").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDays: integer("total_days").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  approvedBy: integer("approved_by"),
  approvedAt: text("approved_at"),
  rejectionReason: text("rejection_reason"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertLeaveApplicationSchema = z.object({
  staffId: z.number(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.number(),
  reason: z.string(),
  status: z.string().default("pending"),
  approvedBy: z.number().nullable().optional(),
  approvedAt: z.string().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  branchId: z.number(),
});
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;
export type LeaveApplication = typeof leaveApplicationsTable.$inferSelect;

// ============== MESSAGES TABLE ==============

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull().default(""),
  receiverId: integer("receiver_id").notNull(),
  receiverRole: text("receiver_role").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false),
  parentId: integer("parent_id"),
  teacherStaffId: integer("teacher_staff_id"),
  studentId: integer("student_id"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertMessageSchema = z.object({
  senderId: z.number(),
  senderRole: z.string(),
  senderName: z.string().default(""),
  receiverId: z.number(),
  receiverRole: z.string(),
  subject: z.string(),
  body: z.string(),
  isRead: z.boolean().default(false),
  parentId: z.number().nullable().optional(),
  teacherStaffId: z.number().nullable().optional(),
  studentId: z.number().nullable().optional(),
  branchId: z.number(),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;

// ============== HOMEWORK TABLES ==============

export const homeworkAssignmentsTable = pgTable("homework_assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  subjectName: text("subject_name").notNull(),
  className: text("class_name").notNull(),
  sectionName: text("section_name"),
  assignedByStaffId: integer("assigned_by_staff_id").notNull(),
  assignedByName: text("assigned_by_name").notNull().default(""),
  dueDate: text("due_date").notNull(),
  attachmentUrl: text("attachment_url"),
  submissionType: text("submission_type").notNull().default("both"),
  totalMarks: integer("total_marks"),
  status: text("status").notNull().default("open"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const homeworkSubmissionsTable = pgTable("homework_submissions", {
  id: serial("id").primaryKey(),
  homeworkId: integer("homework_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull().default(""),
  submittedAt: text("submitted_at"),
  status: text("status").notNull().default("submitted"),
  answerText: text("answer_text"),
  submittedFileUrl: text("submitted_file_url"),
  isLate: integer("is_late").notNull().default(0),
  marks: text("marks"),
  grade: text("grade"),
  feedback: text("feedback"),
  gradedAt: text("graded_at"),
  gradedBy: text("graded_by"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertHomeworkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subjectName: z.string().min(1, "Subject is required"),
  className: z.string().min(1, "Class is required"),
  sectionName: z.string().optional(),
  assignedByStaffId: z.number().min(1),
  assignedByName: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  attachmentUrl: z.string().optional(),
  branchId: z.number(),
});
export type InsertHomework = z.infer<typeof insertHomeworkSchema>;
export type HomeworkAssignment = typeof homeworkAssignmentsTable.$inferSelect;
export type HomeworkSubmission = typeof homeworkSubmissionsTable.$inferSelect;

// ============== ASSET MANAGEMENT TABLES ==============

export const assetsTable = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetName: text("asset_name").notNull(),
  assetCode: text("asset_code").notNull().unique(),
  category: text("category").notNull(),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  currentValue: real("current_value"),
  condition: text("condition").notNull().default("good"),
  location: text("location"),
  assignedTo: text("assigned_to"),
  warrantyExpiry: text("warranty_expiry"),
  notes: text("notes"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const assetMaintenanceLogsTable = pgTable("asset_maintenance_logs", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull(),
  maintenanceType: text("maintenance_type").notNull(),
  description: text("description").notNull(),
  cost: real("cost"),
  performedAt: text("performed_at").notNull(),
  performedBy: text("performed_by").notNull(),
  nextMaintenanceDate: text("next_maintenance_date"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertAssetSchema = z.object({
  assetName: z.string().min(1, "Asset name is required"),
  assetCode: z.string().optional(),
  category: z.enum(["furniture", "electronics", "vehicles", "sports", "books", "stationery", "other"]),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  currentValue: z.number().optional(),
  condition: z.enum(["good", "fair", "poor", "under_repair", "disposed"]).default("good"),
  location: z.string().optional(),
  assignedTo: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
  branchId: z.number(),
});
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;
export type AssetMaintenanceLog = typeof assetMaintenanceLogsTable.$inferSelect;

// ============== CERTIFICATES TABLE ==============

export const certificatesTable = pgTable("certificates", {
  id: serial("id").primaryKey(),
  certificateType: text("certificate_type").notNull(),
  studentId: integer("student_id").notNull(),
  studentName: text("student_name").notNull(),
  issuedBy: text("issued_by").notNull(),
  issueDate: text("issue_date").notNull(),
  content: text("content").notNull(),
  certificateNo: text("certificate_no").notNull().unique(),
  status: text("status").notNull().default("active"),
  branchId: integer("branch_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertCertificateSchema = z.object({
  certificateType: z.string(),
  studentId: z.number(),
  studentName: z.string(),
  issuedBy: z.string(),
  issueDate: z.string(),
  content: z.string(),
  certificateNo: z.string(),
  status: z.string().default("active"),
  branchId: z.number(),
});
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type Certificate = typeof certificatesTable.$inferSelect;
