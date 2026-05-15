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
  moduleCredentials,
  moduleUserCredentials,
  type ModuleType,
  type UserRole,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface LoginResult {
  valid: boolean;
  role?: UserRole;
  name?: string;
}

export interface IStorage {
  validateLogin(module: ModuleType, email: string, password: string): Promise<LoginResult>;

  getStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent & Record<string, any>): Promise<Student>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;

  getStaff(): Promise<Staff[]>;
  getStaffMember(id: string): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff & Record<string, any>): Promise<Staff>;
  updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | undefined>;
  deleteStaff(id: string): Promise<boolean>;

  getVacancies(): Promise<Vacancy[]>;
  getVacancy(id: string): Promise<Vacancy | undefined>;
  createVacancy(vacancy: InsertVacancy & Record<string, any>): Promise<Vacancy>;
  updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy | undefined>;
  deleteVacancy(id: string): Promise<boolean>;

  getApplicants(): Promise<Applicant[]>;
  getApplicant(id: string): Promise<Applicant | undefined>;
  createApplicant(applicant: InsertApplicant & Record<string, any>): Promise<Applicant>;
  updateApplicant(id: string, updates: Partial<Applicant>): Promise<Applicant | undefined>;
  deleteApplicant(id: string): Promise<boolean>;

  getFeeVouchers(): Promise<FeeVoucher[]>;
  getFeeVoucher(id: string): Promise<FeeVoucher | undefined>;
  createFeeVoucher(voucher: InsertFeeVoucher & Record<string, any>): Promise<FeeVoucher>;
  updateFeeVoucher(id: string, updates: Partial<FeeVoucher>): Promise<FeeVoucher | undefined>;
  deleteFeeVoucher(id: string): Promise<boolean>;

  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: string): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll & Record<string, any>): Promise<Payroll>;
  updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll | undefined>;
  deletePayroll(id: string): Promise<boolean>;

  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount & Record<string, any>): Promise<Account>;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: string): Promise<boolean>;

  getFinanceVouchers(): Promise<FinanceVoucher[]>;
  getFinanceVoucher(id: string): Promise<FinanceVoucher | undefined>;
  createFinanceVoucher(voucher: InsertFinanceVoucher & Record<string, any>): Promise<FinanceVoucher>;
  updateFinanceVoucher(id: string, updates: Partial<FinanceVoucher>): Promise<FinanceVoucher | undefined>;
  deleteFinanceVoucher(id: string): Promise<boolean>;
  postFinanceVoucher(id: string, postedBy: string): Promise<FinanceVoucher | undefined>;
  cancelFinanceVoucher(id: string, cancelledBy: string): Promise<FinanceVoucher | undefined>;
  getFinanceDashboard(branchId?: number): Promise<any>;

  getTimetables(): Promise<Timetable[]>;
  getTimetable(id: string): Promise<Timetable | undefined>;
  createTimetable(timetable: InsertTimetable & Record<string, any>): Promise<Timetable>;
  updateTimetable(id: string, updates: Partial<Timetable>): Promise<Timetable | undefined>;
  deleteTimetable(id: string): Promise<boolean>;

  getDateSheets(): Promise<DateSheet[]>;
  getDateSheet(id: string): Promise<DateSheet | undefined>;
  createDateSheet(dateSheet: InsertDateSheet & Record<string, any>): Promise<DateSheet>;
  updateDateSheet(id: string, updates: Partial<DateSheet>): Promise<DateSheet | undefined>;
  deleteDateSheet(id: string): Promise<boolean>;

  getCurriculums(): Promise<Curriculum[]>;
  getCurriculum(id: string): Promise<Curriculum | undefined>;
  createCurriculum(curriculum: InsertCurriculum & Record<string, any>): Promise<Curriculum>;
  updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<Curriculum | undefined>;
  deleteCurriculum(id: string): Promise<boolean>;

  getExams(): Promise<Exam[]>;
  getExam(id: string): Promise<Exam | undefined>;
  createExam(exam: InsertExam & Record<string, any>): Promise<Exam>;
  updateExam(id: string, updates: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: string): Promise<boolean>;

  getResults(): Promise<Result[]>;
  getResult(id: string): Promise<Result | undefined>;
  createResult(result: InsertResult & Record<string, any>): Promise<Result>;
  updateResult(id: string, updates: Partial<Result>): Promise<Result | undefined>;
  deleteResult(id: string): Promise<boolean>;

  getQuestions(): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion & Record<string, any>): Promise<Question>;
  updateQuestion(id: string, updates: Partial<Question>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<boolean>;

  getQuizzes(): Promise<Quiz[]>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz & Record<string, any>): Promise<Quiz>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;

  getQuizAttempts(): Promise<QuizAttempt[]>;
  getQuizAttemptsByQuiz(quizId: string): Promise<QuizAttempt[]>;
  getQuizAttempt(id: string): Promise<QuizAttempt | undefined>;
  createQuizAttempt(attempt: InsertQuizAttempt & Record<string, any>): Promise<QuizAttempt>;
  updateQuizAttempt(id: string, updates: Partial<QuizAttempt>): Promise<QuizAttempt | undefined>;
  deleteQuizAttempt(id: string): Promise<boolean>;

  getPosItems(): Promise<PosItem[]>;
  getPosItem(id: string): Promise<PosItem | undefined>;
  createPosItem(item: InsertPosItem & Record<string, any>): Promise<PosItem>;
  updatePosItem(id: string, updates: Partial<PosItem>): Promise<PosItem | undefined>;
  deletePosItem(id: string): Promise<boolean>;

  getSales(): Promise<Sale[]>;
  getSale(id: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale & Record<string, any>): Promise<Sale>;
  updateSale(id: string, updates: Partial<Sale>): Promise<Sale | undefined>;
  deleteSale(id: string): Promise<boolean>;

  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook & Record<string, any>): Promise<Book>;
  updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;

  getLibraryMembers(): Promise<LibraryMember[]>;
  getLibraryMember(id: string): Promise<LibraryMember | undefined>;
  createLibraryMember(member: InsertLibraryMember & Record<string, any>): Promise<LibraryMember>;
  updateLibraryMember(id: string, updates: Partial<LibraryMember>): Promise<LibraryMember | undefined>;
  deleteLibraryMember(id: string): Promise<boolean>;

  getBookIssues(): Promise<BookIssue[]>;
  getBookIssue(id: string): Promise<BookIssue | undefined>;
  createBookIssue(issue: InsertBookIssue & Record<string, any>): Promise<BookIssue>;
  updateBookIssue(id: string, updates: Partial<BookIssue>): Promise<BookIssue | undefined>;
  deleteBookIssue(id: string): Promise<boolean>;

  getBookCategories(): Promise<BookCategory[]>;
  getBookCategory(id: string): Promise<BookCategory | undefined>;
  createBookCategory(category: InsertBookCategory & Record<string, any>): Promise<BookCategory>;
  updateBookCategory(id: string, updates: Partial<BookCategory>): Promise<BookCategory | undefined>;
  deleteBookCategory(id: string): Promise<boolean>;

  getRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute & Record<string, any>): Promise<Route>;
  updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined>;
  deleteRoute(id: string): Promise<boolean>;

  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle & Record<string, any>): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: string): Promise<boolean>;

  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver & Record<string, any>): Promise<Driver>;
  updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;

  getStudentTransports(): Promise<StudentTransport[]>;
  getStudentTransport(id: string): Promise<StudentTransport | undefined>;
  createStudentTransport(transport: InsertStudentTransport & Record<string, any>): Promise<StudentTransport>;
  updateStudentTransport(id: string, updates: Partial<StudentTransport>): Promise<StudentTransport | undefined>;
  deleteStudentTransport(id: string): Promise<boolean>;

  getHostelRooms(): Promise<HostelRoom[]>;
  getHostelRoom(id: string): Promise<HostelRoom | undefined>;
  createHostelRoom(room: InsertHostelRoom & Record<string, any>): Promise<HostelRoom>;
  updateHostelRoom(id: string, updates: Partial<HostelRoom>): Promise<HostelRoom | undefined>;
  deleteHostelRoom(id: string): Promise<boolean>;

  getHostelResidents(): Promise<HostelResident[]>;
  getHostelResident(id: string): Promise<HostelResident | undefined>;
  createHostelResident(resident: InsertHostelResident & Record<string, any>): Promise<HostelResident>;
  updateHostelResident(id: string, updates: Partial<HostelResident>): Promise<HostelResident | undefined>;
  deleteHostelResident(id: string): Promise<boolean>;

  getHostelFees(): Promise<HostelFee[]>;
  getHostelFee(id: string): Promise<HostelFee | undefined>;
  createHostelFee(fee: InsertHostelFee & Record<string, any>): Promise<HostelFee>;
  updateHostelFee(id: string, updates: Partial<HostelFee>): Promise<HostelFee | undefined>;
  deleteHostelFee(id: string): Promise<boolean>;

  getNotifications(module?: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification & Record<string, any>): Promise<Notification>;
  markNotificationRead(id: string): Promise<Notification | undefined>;
  markAllNotificationsRead(module?: string): Promise<void>;
  deleteNotification(id: string): Promise<boolean>;
  getUnreadNotificationCount(module?: string): Promise<number>;

  getActivityLogs(module?: string): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog & Record<string, any>): Promise<ActivityLog>;

  getFeeStructures(): Promise<FeeStructure[]>;
  getFeeStructure(id: string): Promise<FeeStructure | undefined>;
  createFeeStructure(structure: InsertFeeStructure & Record<string, any>): Promise<FeeStructure>;
  updateFeeStructure(id: string, updates: Partial<FeeStructure>): Promise<FeeStructure | undefined>;
  deleteFeeStructure(id: string): Promise<boolean>;

  getDiscountRules(): Promise<DiscountRule[]>;
  getDiscountRule(id: string): Promise<DiscountRule | undefined>;
  createDiscountRule(rule: InsertDiscountRule & Record<string, any>): Promise<DiscountRule>;
  updateDiscountRule(id: string, updates: Partial<DiscountRule>): Promise<DiscountRule | undefined>;
  deleteDiscountRule(id: string): Promise<boolean>;

  getLateFeeRules(): Promise<LateFeeRule[]>;
  getLateFeeRule(id: string): Promise<LateFeeRule | undefined>;
  createLateFeeRule(rule: InsertLateFeeRule & Record<string, any>): Promise<LateFeeRule>;
  updateLateFeeRule(id: string, updates: Partial<LateFeeRule>): Promise<LateFeeRule | undefined>;
  deleteLateFeeRule(id: string): Promise<boolean>;

  getInstallmentPlans(): Promise<InstallmentPlan[]>;
  getInstallmentPlan(id: string): Promise<InstallmentPlan | undefined>;
  createInstallmentPlan(plan: InsertInstallmentPlan & Record<string, any>): Promise<InstallmentPlan>;
  updateInstallmentPlan(id: string, updates: Partial<InstallmentPlan>): Promise<InstallmentPlan | undefined>;
  deleteInstallmentPlan(id: string): Promise<boolean>;

  getChallans(): Promise<Challan[]>;
  getChallan(id: string): Promise<Challan | undefined>;
  getChallansByStudent(studentId: string): Promise<Challan[]>;
  createChallan(challan: InsertChallan & Record<string, any>): Promise<Challan>;
  updateChallan(id: string, updates: Partial<Challan>): Promise<Challan | undefined>;
  deleteChallan(id: string): Promise<boolean>;

  getPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByChallan(challanId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment & Record<string, any>): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined>;
  deletePayment(id: string): Promise<boolean>;

  getVendors(): Promise<Vendor[]>;
  getVendor(id: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor & Record<string, any>): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<Vendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  getExpenses(): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense & Record<string, any>): Promise<Expense>;
  updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;

  getChartOfAccounts(): Promise<ChartOfAccounts[]>;
  getChartOfAccount(id: string): Promise<ChartOfAccounts | undefined>;
  createChartOfAccount(account: InsertChartOfAccounts & Record<string, any>): Promise<ChartOfAccounts>;
  updateChartOfAccount(id: string, updates: Partial<ChartOfAccounts>): Promise<ChartOfAccounts | undefined>;
  deleteChartOfAccount(id: string): Promise<boolean>;

  getLedgerEntries(): Promise<LedgerEntry[]>;
  getLedgerEntry(id: string): Promise<LedgerEntry | undefined>;
  getLedgerEntriesByAccount(accountId: string): Promise<LedgerEntry[]>;
  getLedgerEntriesByAccountAndDate(accountId?: string, fromDate?: string, toDate?: string): Promise<LedgerEntry[]>;
  createLedgerEntry(entry: InsertLedgerEntry & Record<string, any>): Promise<LedgerEntry>;
  updateLedgerEntry(id: string, updates: Partial<LedgerEntry>): Promise<LedgerEntry | undefined>;
  deleteLedgerEntry(id: string): Promise<boolean>;

  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalEntry(id: string): Promise<JournalEntry | undefined>;
  createJournalEntry(entry: InsertJournalEntry & Record<string, any>): Promise<JournalEntry>;
  updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry | undefined>;
  deleteJournalEntry(id: string): Promise<boolean>;

  getAttendanceRecords(filters?: { date?: string; targetType?: string; className?: string; section?: string }): Promise<AttendanceRecord[]>;
  getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined>;
  upsertAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined>;
  deleteAttendanceRecord(id: string): Promise<boolean>;
  getAttendanceSummary(date: string, targetType?: string): Promise<AttendanceSummary>;
  getAttendanceReport(filters: { targetType: string; startDate: string; endDate: string; className?: string; section?: string }): Promise<AttendanceRecord[]>;
}

export class MemStorage implements IStorage {
  private students: Map<string, Student>;
  private staff: Map<string, Staff>;
  private vacancies: Map<string, Vacancy>;
  private applicants: Map<string, Applicant>;
  private feeVouchers: Map<string, FeeVoucher>;
  private payrolls: Map<string, Payroll>;
  private accounts: Map<string, Account>;
  private financeVouchers: Map<string, FinanceVoucher>;
  private timetables: Map<string, Timetable>;
  private dateSheets: Map<string, DateSheet>;
  private curriculums: Map<string, Curriculum>;
  private exams: Map<string, Exam>;
  private results: Map<string, Result>;
  private posItems: Map<string, PosItem>;
  private sales: Map<string, Sale>;
  private books: Map<string, Book>;
  private libraryMembers: Map<string, LibraryMember>;
  private bookIssues: Map<string, BookIssue>;
  private routes: Map<string, Route>;
  private vehicles: Map<string, Vehicle>;
  private drivers: Map<string, Driver>;
  private studentTransports: Map<string, StudentTransport>;
  private hostelRooms: Map<string, HostelRoom>;
  private hostelResidents: Map<string, HostelResident>;
  private hostelFees: Map<string, HostelFee>;
  private notifications: Map<string, Notification>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.students = new Map();
    this.staff = new Map();
    this.vacancies = new Map();
    this.applicants = new Map();
    this.feeVouchers = new Map();
    this.payrolls = new Map();
    this.accounts = new Map();
    this.financeVouchers = new Map();
    this.timetables = new Map();
    this.dateSheets = new Map();
    this.curriculums = new Map();
    this.exams = new Map();
    this.results = new Map();
    this.posItems = new Map();
    this.sales = new Map();
    this.books = new Map();
    this.libraryMembers = new Map();
    this.bookIssues = new Map();
    this.routes = new Map();
    this.vehicles = new Map();
    this.drivers = new Map();
    this.studentTransports = new Map();
    this.hostelRooms = new Map();
    this.hostelResidents = new Map();
    this.hostelFees = new Map();
    this.notifications = new Map();
    this.activityLogs = new Map();

    this.seedDummyData();
  }

  private seedDummyData() {
    const studentData: Student[] = [
      { id: "1", studentId: "STU001", name: "Ahmad Khan", gender: "Male", dob: "2010-05-15", parentName: "Mohammad Khan", parentContact: "+92 300 1234567", parentEmail: "mkhan@email.com", address: "123 Main Street, Lahore", class: "Class 5", section: "A", admissionDate: "2024-03-15", status: "Active", bform: "35202-1234567-1" },
      { id: "2", studentId: "STU002", name: "Fatima Ali", gender: "Female", dob: "2011-08-22", parentName: "Ali Hassan", parentContact: "+92 301 2345678", parentEmail: "ahassan@email.com", address: "456 Oak Avenue, Karachi", class: "Class 4", section: "B", admissionDate: "2024-01-10", status: "Active", bform: "35202-1234567-2" },
      { id: "3", studentId: "STU003", name: "Zain Ahmed", gender: "Male", dob: "2012-02-10", parentName: "Ahmed Raza", parentContact: "+92 302 3456789", parentEmail: "araza@email.com", address: "789 Pine Road, Islamabad", class: "Class 3", section: "A", admissionDate: "2023-09-01", status: "Active", bform: "35202-1234567-3" },
      { id: "4", studentId: "STU004", name: "Ayesha Malik", gender: "Female", dob: "2010-11-30", parentName: "Malik Tariq", parentContact: "+92 303 4567890", parentEmail: "mtariq@email.com", address: "321 Elm Street, Lahore", class: "Class 5", section: "B", admissionDate: "2022-04-20", status: "Active", bform: "35202-1234567-4" },
      { id: "5", studentId: "STU005", name: "Hassan Raza", gender: "Male", dob: "2013-07-08", parentName: "Raza Ali", parentContact: "+92 304 5678901", parentEmail: "rali@email.com", address: "654 Maple Lane, Faisalabad", class: "Class 2", section: "A", admissionDate: "2024-02-14", status: "Active", bform: "35202-1234567-5" },
      { id: "6", studentId: "STU006", name: "Sara Khan", gender: "Female", dob: "2009-04-25", parentName: "Khan Abdul", parentContact: "+92 305 6789012", parentEmail: "kabdul@email.com", address: "987 Cedar Blvd, Multan", class: "Class 6", section: "A", admissionDate: "2020-08-01", status: "Alumni", bform: "35202-1234567-6" },
      { id: "7", studentId: "STU007", name: "Usman Shah", gender: "Male", dob: "2011-12-03", parentName: "Shah Nawaz", parentContact: "+92 306 7890123", parentEmail: "snawaz@email.com", address: "147 Birch Ave, Peshawar", class: "Class 4", section: "A", admissionDate: "2023-06-15", status: "Active", bform: "35202-1234567-7" },
      { id: "8", studentId: "STU008", name: "Maryam Bibi", gender: "Female", dob: "2012-09-18", parentName: "Bibi Khadija", parentContact: "+92 307 8901234", parentEmail: "bkhadija@email.com", address: "258 Walnut St, Quetta", class: "Class 3", section: "B", admissionDate: "2024-01-05", status: "Active", bform: "35202-1234567-8" },
      { id: "9", studentId: "STU009", name: "Bilal Ahmed", gender: "Male", dob: "2014-01-12", parentName: "Ahmed Bilal Sr", parentContact: "+92 308 9012345", parentEmail: "abilal@email.com", address: "369 Spruce Rd, Rawalpindi", class: "Class 1", section: "A", admissionDate: "2024-03-01", status: "Active", bform: "35202-1234567-9" },
      { id: "10", studentId: "STU010", name: "Hina Parveen", gender: "Female", dob: "2010-06-20", parentName: "Parveen Akhtar", parentContact: "+92 309 0123456", parentEmail: "pakhtar@email.com", address: "741 Ash Street, Sialkot", class: "Class 5", section: "A", admissionDate: "2021-07-10", status: "Left", bform: "35202-1234567-10" },
    ];
    studentData.forEach(s => this.students.set(s.id, s));

    const staffData: Staff[] = [
      { id: "1", staffId: "EMP001", name: "Dr. Amir Hussain", gender: "Male", dob: "1975-03-15", email: "amir.h@school.com", phone: "+92 300 1111111", address: "45 Faculty Lane, Lahore", designation: "Principal", department: "Administration", campus: "Main Campus", employmentType: "Full-time", status: "Active", joiningDate: "2015-01-01", basicSalary: 250000, paymentMode: "Bank Transfer" },
      { id: "2", staffId: "EMP002", name: "Sadia Noor", gender: "Female", dob: "1985-07-22", email: "sadia.n@school.com", phone: "+92 301 2222222", address: "78 Teachers Colony, Lahore", designation: "Senior Teacher", department: "Science", campus: "Main Campus", employmentType: "Full-time", status: "Active", joiningDate: "2018-06-15", basicSalary: 85000, paymentMode: "Bank Transfer" },
      { id: "3", staffId: "EMP003", name: "Kamran Ali", gender: "Male", dob: "1990-11-08", email: "kamran.a@school.com", phone: "+92 302 3333333", address: "23 Staff Road, Karachi", designation: "Teacher", department: "Mathematics", campus: "Branch Campus", employmentType: "Full-time", status: "Active", joiningDate: "2020-02-01", basicSalary: 65000, paymentMode: "Bank Transfer" },
      { id: "4", staffId: "EMP004", name: "Fareeda Begum", gender: "Female", dob: "1982-05-30", email: "fareeda.b@school.com", phone: "+92 303 4444444", address: "56 Admin Block, Islamabad", designation: "Admin Officer", department: "Administration", campus: "Main Campus", employmentType: "Full-time", status: "Active", joiningDate: "2016-09-01", basicSalary: 75000, paymentMode: "Bank Transfer" },
      { id: "5", staffId: "EMP005", name: "Rashid Khan", gender: "Male", dob: "1988-09-12", email: "rashid.k@school.com", phone: "+92 304 5555555", address: "89 Sports Avenue, Lahore", designation: "Sports Coach", department: "Sports", campus: "Main Campus", employmentType: "Contract", status: "Probation", joiningDate: "2024-01-15", basicSalary: 45000, paymentMode: "Cash" },
    ];
    staffData.forEach(s => this.staff.set(s.id, s));

    const vacancyData: Vacancy[] = [
      { id: "1", title: "Mathematics Teacher", designation: "Teacher", department: "Mathematics", employmentType: "Permanent", positions: 2, qualifications: "M.Sc Mathematics, B.Ed", experience: "3+ years", description: "Looking for experienced math teacher for grades 6-10", lastDate: "2024-12-01", status: "Open" },
      { id: "2", title: "IT Lab Assistant", designation: "Lab Assistant", department: "IT", employmentType: "Contract", positions: 1, qualifications: "BCS/BS IT, basic networking knowledge", experience: "1+ years", description: "Assist in computer lab management and basic IT support", lastDate: "2024-12-15", status: "Open" },
    ];
    vacancyData.forEach(v => this.vacancies.set(v.id, v));

    const applicantData: Applicant[] = [
      { id: "1", vacancyId: "1", vacancyTitle: "Mathematics Teacher", name: "Asad Mehmood", email: "asad.m@gmail.com", phone: "+92 310 1234567", cnic: "35201-1234567-1", qualification: "M.Sc Mathematics", experience: "4 years", appliedDate: "2024-11-05", status: "Shortlisted" },
      { id: "2", vacancyId: "1", vacancyTitle: "Mathematics Teacher", name: "Nadia Siddiqui", email: "nadia.s@gmail.com", phone: "+92 311 2345678", cnic: "35202-7654321-2", qualification: "B.Ed, M.A Education", experience: "2 years", appliedDate: "2024-11-08", status: "New" },
    ];
    applicantData.forEach(a => this.applicants.set(a.id, a));

    const feeVoucherData: FeeVoucher[] = [
      { id: "1", voucherId: "FV001", studentId: "1", studentName: "Ahmad Khan", class: "Class 5", section: "A", month: "December 2024", feeHeads: [{ name: "Tuition Fee", amount: 5000 }, { name: "Lab Fee", amount: 500 }, { name: "Sports Fee", amount: 300 }], totalAmount: 5800, discount: 0, fine: 0, netAmount: 5800, paidAmount: 5800, dueDate: "2024-12-10", status: "Paid", paymentHistory: [{ date: "2024-12-05", amount: 5800, method: "Cash" }] },
      { id: "2", voucherId: "FV002", studentId: "2", studentName: "Fatima Ali", class: "Class 4", section: "B", month: "December 2024", feeHeads: [{ name: "Tuition Fee", amount: 5000 }, { name: "Lab Fee", amount: 500 }], totalAmount: 5500, discount: 500, fine: 0, netAmount: 5000, paidAmount: 0, dueDate: "2024-12-10", status: "Unpaid", paymentHistory: [] },
      { id: "3", voucherId: "FV003", studentId: "3", studentName: "Zain Ahmed", class: "Class 3", section: "A", month: "December 2024", feeHeads: [{ name: "Tuition Fee", amount: 4500 }], totalAmount: 4500, discount: 0, fine: 200, netAmount: 4700, paidAmount: 2000, dueDate: "2024-12-10", status: "Partial", paymentHistory: [{ date: "2024-12-08", amount: 2000, method: "Bank Transfer" }] },
    ];
    feeVoucherData.forEach(f => this.feeVouchers.set(f.id, f));

    const payrollData: Payroll[] = [
      { id: "1", staffId: "1", staffName: "Dr. Amir Hussain", designation: "Principal", department: "Administration", month: "November 2024", basicSalary: 250000, allowances: [{ name: "Housing", amount: 50000 }, { name: "Transport", amount: 20000 }], deductions: [{ name: "Tax", amount: 32000 }, { name: "Provident Fund", amount: 12500 }], grossSalary: 320000, netSalary: 275500, status: "Paid", paidDate: "2024-11-30" },
      { id: "2", staffId: "2", staffName: "Sadia Noor", designation: "Senior Teacher", department: "Science", month: "November 2024", basicSalary: 85000, allowances: [{ name: "Housing", amount: 15000 }, { name: "Transport", amount: 8000 }], deductions: [{ name: "Tax", amount: 5400 }, { name: "Provident Fund", amount: 4250 }], grossSalary: 108000, netSalary: 98350, status: "Paid", paidDate: "2024-11-30" },
      { id: "3", staffId: "3", staffName: "Kamran Ali", designation: "Teacher", department: "Mathematics", month: "November 2024", basicSalary: 65000, allowances: [{ name: "Transport", amount: 5000 }], deductions: [{ name: "Tax", amount: 3500 }, { name: "Provident Fund", amount: 3250 }], grossSalary: 70000, netSalary: 63250, status: "Unpaid" },
    ];
    payrollData.forEach(p => this.payrolls.set(p.id, p));

    const accountData: Account[] = [
      { id: "1", code: "1001", name: "Cash in Hand", type: "Asset", balance: 150000 },
      { id: "2", code: "1002", name: "Bank Account", type: "Asset", balance: 2500000 },
      { id: "3", code: "2001", name: "Accounts Payable", type: "Liability", balance: 350000 },
      { id: "4", code: "3001", name: "Tuition Fee Income", type: "Income", balance: 1500000 },
      { id: "5", code: "4001", name: "Salary Expense", type: "Expense", balance: 800000 },
    ];
    accountData.forEach(a => this.accounts.set(a.id, a));

    const financeVoucherData: FinanceVoucher[] = [
      { id: "1", voucherId: "FV-001", voucherNumber: "PV001", type: "Payment", date: "2024-11-30", entries: [{ accountId: "5001", accountName: "Salary Expense", debit: 275500, credit: 0 }, { accountId: "1001", accountName: "Cash in Hand", debit: 0, credit: 275500 }], totalDebit: 275500, totalCredit: 275500, narration: "November salary - Principal", status: "Posted", createdBy: "payroll", createdAt: "2024-11-30" },
      { id: "2", voucherId: "FV-002", voucherNumber: "RV001", type: "Receipt", date: "2024-12-05", entries: [{ accountId: "1001", accountName: "Cash in Hand", debit: 5800, credit: 0 }, { accountId: "4001", accountName: "Fee Income", debit: 0, credit: 5800 }], totalDebit: 5800, totalCredit: 5800, narration: "Fee collection - Ahmad Khan", status: "Posted", createdBy: "fee", createdAt: "2024-12-05" },
    ];
    financeVoucherData.forEach(f => this.financeVouchers.set(f.id, f));


    const timetableData: Timetable[] = [
      {
        id: "1", class: "Class 5", section: "A", slots: [
          { day: "Monday", period: 1, subject: "Mathematics", teacherId: "3", teacherName: "Kamran Ali", startTime: "08:00", endTime: "08:45" },
          { day: "Monday", period: 2, subject: "English", teacherId: "2", teacherName: "Sadia Noor", startTime: "08:50", endTime: "09:35" },
          { day: "Monday", period: 3, subject: "Science", teacherId: "2", teacherName: "Sadia Noor", startTime: "09:40", endTime: "10:25" },
          { day: "Tuesday", period: 1, subject: "Urdu", teacherId: "4", teacherName: "Fareeda Begum", startTime: "08:00", endTime: "08:45" },
          { day: "Tuesday", period: 2, subject: "Mathematics", teacherId: "3", teacherName: "Kamran Ali", startTime: "08:50", endTime: "09:35" },
        ], updatedAt: "2024-11-01"
      },
    ];
    timetableData.forEach(t => this.timetables.set(t.id, t));

    const dateSheetData: DateSheet[] = [
      {
        id: "1", examName: "Mid-Term Examination", examType: "Term", class: "Class 5", startDate: "2024-12-15", endDate: "2024-12-22", entries: [
          { subject: "Mathematics", date: "2024-12-15", startTime: "09:00", endTime: "11:00", room: "Room 101", invigilatorId: "3", invigilatorName: "Kamran Ali" },
          { subject: "English", date: "2024-12-17", startTime: "09:00", endTime: "11:00", room: "Room 101", invigilatorId: "2", invigilatorName: "Sadia Noor" },
          { subject: "Science", date: "2024-12-19", startTime: "09:00", endTime: "11:00", room: "Room 102", invigilatorId: "2", invigilatorName: "Sadia Noor" },
        ]
      },
    ];
    dateSheetData.forEach(d => this.dateSheets.set(d.id, d));

    const curriculumData: Curriculum[] = [
      {
        id: "1", class: "Class 5", subject: "Mathematics", topics: [
          { topic: "Fractions", status: "Completed" },
          { topic: "Decimals", status: "In Progress" },
          { topic: "Percentages", status: "Not Started" },
          { topic: "Geometry", status: "Not Started" },
        ], assignedTeachers: [{ teacherId: "3", teacherName: "Kamran Ali", assignedAt: "2024-09-01" }]
      },
      {
        id: "2", class: "Class 5", subject: "Science", topics: [
          { topic: "Living Things", status: "Completed" },
          { topic: "Matter and Energy", status: "Completed" },
          { topic: "Earth Science", status: "In Progress" },
        ], assignedTeachers: [{ teacherId: "2", teacherName: "Sadia Noor", assignedAt: "2024-09-01" }]
      },
    ];
    curriculumData.forEach(c => this.curriculums.set(c.id, c));

    const examData: Exam[] = [
      { id: "1", name: "Mid-Term 2024", term: "First Term", classRange: "Class 1-6", startDate: "2024-12-15", endDate: "2024-12-22" },
      { id: "2", name: "Final 2024", term: "Annual", classRange: "Class 1-6", startDate: "2025-03-01", endDate: "2025-03-15" },
    ];
    examData.forEach(e => this.exams.set(e.id, e));

    const resultData: Result[] = [
      { id: "1", examId: "1", studentId: "1", studentName: "Ahmad Khan", class: "Class 5", subject: "Mathematics", marksObtained: 85, maxMarks: 100, grade: "A" },
      { id: "2", examId: "1", studentId: "1", studentName: "Ahmad Khan", class: "Class 5", subject: "English", marksObtained: 78, maxMarks: 100, grade: "B+" },
      { id: "3", examId: "1", studentId: "2", studentName: "Fatima Ali", class: "Class 4", subject: "Mathematics", marksObtained: 92, maxMarks: 100, grade: "A+" },
    ];
    resultData.forEach(r => this.results.set(r.id, r));

    const posItemData: PosItem[] = [
      { id: "1", itemCode: "UNI001", name: "School Uniform - Small", category: "Uniforms", price: 2500, stock: 50 },
      { id: "2", itemCode: "UNI002", name: "School Uniform - Medium", category: "Uniforms", price: 2800, stock: 45 },
      { id: "3", itemCode: "BK001", name: "Mathematics Textbook Grade 5", category: "Books", price: 850, stock: 100 },
      { id: "4", itemCode: "BK002", name: "English Textbook Grade 5", category: "Books", price: 750, stock: 95 },
      { id: "5", itemCode: "ST001", name: "Notebook Pack (10)", category: "Stationery", price: 500, stock: 200 },
      { id: "6", itemCode: "ST002", name: "Pen Set", category: "Stationery", price: 150, stock: 300 },
    ];
    posItemData.forEach(p => this.posItems.set(p.id, p));

    const saleData: Sale[] = [
      {
        id: "1", invoiceNo: "INV001", date: "2024-12-05", customer: "Ahmad Khan (Parent)", items: [
          { itemId: "1", itemName: "School Uniform - Small", quantity: 2, price: 2500, total: 5000 },
          { itemId: "5", itemName: "Notebook Pack (10)", quantity: 3, price: 500, total: 1500 },
        ], grandTotal: 6500
      },
      {
        id: "2", invoiceNo: "INV002", date: "2024-12-06", customer: "Ali Hassan (Parent)", items: [
          { itemId: "3", itemName: "Mathematics Textbook Grade 5", quantity: 1, price: 850, total: 850 },
          { itemId: "4", itemName: "English Textbook Grade 5", quantity: 1, price: 750, total: 750 },
          { itemId: "6", itemName: "Pen Set", quantity: 2, price: 150, total: 300 },
        ], grandTotal: 1900
      },
    ];
    saleData.forEach(s => this.sales.set(s.id, s));

    const bookData: Book[] = [
      { id: "1", accessionNo: "LIB001", title: "Introduction to Physics", author: "Dr. Resnick", category: "Science", isbn: "978-0471320050", totalCopies: 3, availableCopies: 3, status: "Available" },
      { id: "2", accessionNo: "LIB002", title: "Mathematics for Beginners", author: "Prof. Khan", category: "Mathematics", isbn: "978-0321356983", totalCopies: 2, availableCopies: 1, status: "Issued" },
      { id: "3", accessionNo: "LIB003", title: "English Grammar", author: "Wren & Martin", category: "Language", isbn: "978-9352535224", totalCopies: 4, availableCopies: 4, status: "Available" },
      { id: "4", accessionNo: "LIB004", title: "Pakistan Studies", author: "Ikram Rabbani", category: "Social Studies", isbn: "978-9690012345", totalCopies: 2, availableCopies: 2, status: "Available" },
      { id: "5", accessionNo: "LIB005", title: "Computer Science Fundamentals", author: "Dr. Ahmad", category: "Computer", isbn: "978-0132569033", totalCopies: 1, availableCopies: 0, status: "Issued" },
    ];
    bookData.forEach(b => this.books.set(b.id, b));

    const libraryMemberData: LibraryMember[] = [
      { id: "1", memberId: "LM001", name: "Ahmad Khan", type: "Student", contact: "+92 300 1234567", referenceId: "1" },
      { id: "2", memberId: "LM002", name: "Fatima Ali", type: "Student", contact: "+92 301 2345678", referenceId: "2" },
      { id: "3", memberId: "LM003", name: "Dr. Amir Hussain", type: "Staff", contact: "+92 300 1111111", referenceId: "1" },
    ];
    libraryMemberData.forEach(m => this.libraryMembers.set(m.id, m));

    const bookIssueData: BookIssue[] = [
      { id: "1", bookId: "2", bookTitle: "Mathematics for Beginners", accessionNo: "LIB002", memberId: "1", memberName: "Ahmad Khan", memberType: "Student", issueDate: "2024-12-01", dueDate: "2024-12-15", fine: 0, finePaid: false, status: "Issued" },
      { id: "2", bookId: "5", bookTitle: "Computer Science Fundamentals", accessionNo: "LIB005", memberId: "3", memberName: "Dr. Amir Hussain", memberType: "Staff", issueDate: "2024-11-15", dueDate: "2024-12-15", fine: 0, finePaid: false, status: "Issued" },
    ];
    bookIssueData.forEach(i => this.bookIssues.set(i.id, i));

    const routeData: Route[] = [
      { id: "1", routeCode: "RT001", routeName: "Gulberg Route", stops: ["DHA Phase 5", "Model Town", "Gulberg III", "Main Campus"] },
      { id: "2", routeCode: "RT002", routeName: "Cantt Route", stops: ["Cantt Station", "Mall Road", "Civil Lines", "Main Campus"] },
      { id: "3", routeCode: "RT003", routeName: "Township Route", stops: ["Township A", "Township B", "Faisal Town", "Main Campus"] },
    ];
    routeData.forEach(r => this.routes.set(r.id, r));

    const vehicleData: Vehicle[] = [
      { id: "1", registrationNumber: "LEA-1234", type: "Bus", capacity: 40, model: "Hino", make: "Hino", year: 2020, routeId: "1", status: "Active", insuranceExpiry: "2025-12-31", fitnessExpiry: "2025-06-30" },
      { id: "2", registrationNumber: "LEA-5678", type: "Van", capacity: 15, model: "Hiace", make: "Toyota", year: 2021, routeId: "2", status: "Active", insuranceExpiry: "2025-11-30", fitnessExpiry: "2025-05-31" },
      { id: "3", registrationNumber: "LEA-9012", type: "Coaster", capacity: 25, model: "Coaster", make: "Toyota", year: 2019, routeId: "3", status: "Under Maintenance", insuranceExpiry: "2025-10-31", fitnessExpiry: "2025-04-30" },
    ];
    vehicleData.forEach(v => this.vehicles.set(v.id, v));

    const driverData: Driver[] = [
      { id: "1", name: "Akram Shah", cnic: "35201-1111111-1", contact: "+92 320 1111111", licenseNumber: "PB-LHR-2020-12345", licenseExpiry: "2026-12-31", experience: 5, salary: 35000, vehicleId: "1", status: "Active" },
      { id: "2", name: "Bashir Ahmed", cnic: "35202-2222222-2", contact: "+92 321 2222222", licenseNumber: "PB-LHR-2019-67890", licenseExpiry: "2025-09-30", experience: 8, salary: 38000, vehicleId: "2", status: "Active" },
      { id: "3", name: "Chaudhry Iqbal", cnic: "35203-3333333-3", contact: "+92 322 3333333", licenseNumber: "PB-LHR-2021-11111", licenseExpiry: "2026-06-30", experience: 3, salary: 32000, status: "Active" },
    ];
    driverData.forEach(d => this.drivers.set(d.id, d));

    const studentTransportData: StudentTransport[] = [
      { id: "1", studentId: "1", studentName: "Ahmad Khan", class: "Class 5", section: "A", routeId: "1", routeName: "Gulberg Route", stopName: "Model Town", pickupTime: "07:30", dropTime: "14:30", monthlyFee: 2000, startDate: "2024-04-01", vehicleId: "1", status: "Active" },
      { id: "2", studentId: "2", studentName: "Fatima Ali", class: "Class 4", section: "B", routeId: "2", routeName: "Cantt Route", stopName: "Mall Road", pickupTime: "07:15", dropTime: "14:15", monthlyFee: 2000, startDate: "2024-04-01", vehicleId: "2", status: "Active" },
      { id: "3", studentId: "5", studentName: "Hassan Raza", class: "Class 2", section: "A", routeId: "1", routeName: "Gulberg Route", stopName: "DHA Phase 5", pickupTime: "07:20", dropTime: "13:45", monthlyFee: 2000, startDate: "2024-04-01", vehicleId: "1", status: "Active" },
    ];
    studentTransportData.forEach(s => this.studentTransports.set(s.id, s));

    const hostelRoomData: HostelRoom[] = [
      { id: "1", hostelName: "Boys Hostel A", roomNumber: "101", bedCount: 4, occupiedBeds: 3, status: "Available" },
      { id: "2", hostelName: "Boys Hostel A", roomNumber: "102", bedCount: 4, occupiedBeds: 4, status: "Full" },
      { id: "3", hostelName: "Girls Hostel B", roomNumber: "201", bedCount: 3, occupiedBeds: 2, status: "Available" },
      { id: "4", hostelName: "Boys Hostel A", roomNumber: "103", bedCount: 4, occupiedBeds: 0, status: "Maintenance" },
    ];
    hostelRoomData.forEach(r => this.hostelRooms.set(r.id, r));

    const hostelResidentData: HostelResident[] = [
      { id: "1", studentId: "3", studentName: "Zain Ahmed", class: "Class 3", roomId: "1", roomNumber: "101", bedNumber: 1, joinDate: "2024-01-15", status: "Active" },
      { id: "2", studentId: "7", studentName: "Usman Shah", class: "Class 4", roomId: "1", roomNumber: "101", bedNumber: 2, joinDate: "2024-02-01", status: "Active" },
      { id: "3", studentId: "9", studentName: "Bilal Ahmed", class: "Class 1", roomId: "1", roomNumber: "101", bedNumber: 3, joinDate: "2024-03-01", status: "Active" },
    ];
    hostelResidentData.forEach(r => this.hostelResidents.set(r.id, r));

    const hostelFeeData: HostelFee[] = [
      { id: "1", residentId: "1", studentName: "Zain Ahmed", month: "December 2024", amount: 15000, status: "Paid", paidDate: "2024-12-01" },
      { id: "2", residentId: "2", studentName: "Usman Shah", month: "December 2024", amount: 15000, status: "Unpaid" },
      { id: "3", residentId: "3", studentName: "Bilal Ahmed", month: "December 2024", amount: 15000, status: "Paid", paidDate: "2024-12-05" },
    ];
    hostelFeeData.forEach(f => this.hostelFees.set(f.id, f));

    const notificationData: Notification[] = [
      { id: "1", type: "fee_due", title: "Fee Payment Reminder", message: "Fee payment for Fatima Ali (FV002) is due on December 10, 2024. Amount: Rs. 5,000", module: "fee", priority: "high", read: false, createdAt: new Date().toISOString() },
      { id: "2", type: "system", title: "System Notice", message: "All modules are running smoothly. No issues detected.", module: "system", priority: "medium", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "3", type: "payroll_pending", title: "Pending Salary", message: "Salary for Kamran Ali (November 2024) is still pending. Net amount: Rs. 63,250", module: "payroll", priority: "high", read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "4", type: "library_overdue", title: "Book Overdue Soon", message: "Mathematics for Beginners issued to Ahmad Khan is due on December 15, 2024.", module: "library", priority: "low", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "5", type: "system", title: "Welcome to Emblazers", message: "Your school management system is ready. Explore all 14+ modules to manage your school efficiently.", module: "system", priority: "low", read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "6", type: "system", title: "New Student Enrolled", message: "A new student Maryam Bibi has been enrolled in Class 3-B.", module: "student", priority: "medium", read: false, createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: "7", type: "system", title: "Student Alert", message: "Student Hassan Raza requires attention from the administration.", module: "student", priority: "high", read: false, createdAt: new Date(Date.now() - 900000).toISOString() },
    ];
    notificationData.forEach(n => this.notifications.set(n.id, n));
  }

  async validateLogin(module: ModuleType, email: string, password: string): Promise<LoginResult> {
    // Safely get credentials for the module
    const legacyCreds = (moduleCredentials as Record<string, { email: string; password: string }>)[module];
    const newCreds = moduleUserCredentials[module];

    if (!legacyCreds || !newCreds) {
      console.error(`Missing credentials configuration for module: ${module}`);
      return { valid: false };
    }

    // Check module-specific credentials (legacy format)
    if (legacyCreds.email === email && legacyCreds.password === password) {
      return {
        valid: true,
        role: newCreds.role ?? "admin",
        name: newCreds.name ?? `${module} Admin`,
      };
    }

    // Check module-specific credentials (new format with role)
    if (newCreds.email === email && newCreds.password === password) {
      return {
        valid: true,
        role: newCreds.role,
        name: newCreds.name,
      };
    }

    return { valid: false };
  }

  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  private generateSequentialId(type: "Student" | "Staff", dateStr: string): string {
    const year = new Date(dateStr).getFullYear();
    const prefix = "EMB";
    const pattern = new RegExp(`^${prefix}-${year}-(\\d{3})$`);

    let maxSeq = 0;
    const items = type === "Student" ? Array.from(this.students.values()) : Array.from(this.staff.values());

    // Check existing items for the generated ID is studentId or staffId
    items.forEach((item: any) => {
      const idToCheck = type === "Student" ? item.studentId : item.staffId;
      if (idToCheck) {
        const match = idToCheck.match(pattern);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
    });

    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}-${year}-${nextSeq}`;
  }

  async createStudent(student: InsertStudent & Record<string, any>): Promise<Student> {
    const existing = Array.from(this.students.values()).find(s => s.bform === student.bform);
    if (existing) {
      throw new Error("Student with this B-Form already exists");
    }
    const id = randomUUID();
    const studentId = this.generateSequentialId("Student", student.admissionDate);
    const newStudent: Student = { ...student, id, studentId };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const existing = this.students.get(id);
    if (!existing) return undefined;

    if (updates.bform) {
      const duplicate = Array.from(this.students.values()).find(s => s.bform === updates.bform && s.id !== id);
      if (duplicate) {
        throw new Error("Student with this B-Form already exists");
      }
    }

    const updated = { ...existing, ...updates, id };
    this.students.set(id, updated);


    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
  }

  async getStaff(): Promise<Staff[]> {
    return Array.from(this.staff.values());
  }

  async getStaffMember(id: string): Promise<Staff | undefined> {
    return this.staff.get(id);
  }

  async createStaff(staff: InsertStaff & Record<string, any>): Promise<Staff> {
    const id = randomUUID();
    const staffId = this.generateSequentialId("Staff", staff.joiningDate);
    const newStaff: Staff = { ...staff, id, staffId };
    this.staff.set(id, newStaff);
    return newStaff;
  }

  async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff | undefined> {
    const existing = this.staff.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.staff.set(id, updated);
    return updated;
  }

  async deleteStaff(id: string): Promise<boolean> {
    return this.staff.delete(id);
  }

  async getVacancies(): Promise<Vacancy[]> {
    return Array.from(this.vacancies.values());
  }

  async getVacancy(id: string): Promise<Vacancy | undefined> {
    return this.vacancies.get(id);
  }

  async createVacancy(vacancy: InsertVacancy & Record<string, any>): Promise<Vacancy> {
    const id = randomUUID();
    const newVacancy: Vacancy = { ...vacancy, id };
    this.vacancies.set(id, newVacancy);
    return newVacancy;
  }

  async updateVacancy(id: string, updates: Partial<Vacancy>): Promise<Vacancy | undefined> {
    const existing = this.vacancies.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.vacancies.set(id, updated);
    return updated;
  }

  async deleteVacancy(id: string): Promise<boolean> {
    return this.vacancies.delete(id);
  }

  async getApplicants(): Promise<Applicant[]> {
    return Array.from(this.applicants.values());
  }

  async getApplicant(id: string): Promise<Applicant | undefined> {
    return this.applicants.get(id);
  }

  async createApplicant(applicant: InsertApplicant & Record<string, any>): Promise<Applicant> {
    const id = randomUUID();
    const newApplicant: Applicant = { ...applicant, id };
    this.applicants.set(id, newApplicant);
    return newApplicant;
  }

  async updateApplicant(id: string, updates: Partial<Applicant>): Promise<Applicant | undefined> {
    const existing = this.applicants.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.applicants.set(id, updated);
    return updated;
  }

  async deleteApplicant(id: string): Promise<boolean> {
    return this.applicants.delete(id);
  }

  async getFeeVouchers(): Promise<FeeVoucher[]> {
    return Array.from(this.feeVouchers.values());
  }

  async getFeeVoucher(id: string): Promise<FeeVoucher | undefined> {
    return this.feeVouchers.get(id);
  }

  async createFeeVoucher(voucher: InsertFeeVoucher & Record<string, any>): Promise<FeeVoucher> {
    const id = randomUUID();
    const voucherId = `FV-${Date.now()}`;
    const newVoucher: FeeVoucher = { ...voucher, id, voucherId };
    this.feeVouchers.set(id, newVoucher);
    return newVoucher;
  }

  async updateFeeVoucher(id: string, updates: Partial<FeeVoucher>): Promise<FeeVoucher | undefined> {
    const existing = this.feeVouchers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.feeVouchers.set(id, updated);
    return updated;
  }

  async deleteFeeVoucher(id: string): Promise<boolean> {
    return this.feeVouchers.delete(id);
  }

  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }

  async getPayroll(id: string): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }

  async createPayroll(payroll: InsertPayroll & Record<string, any>): Promise<Payroll> {
    const id = randomUUID();
    const newPayroll: Payroll = { ...payroll, id };
    this.payrolls.set(id, newPayroll);
    return newPayroll;
  }

  async updatePayroll(id: string, updates: Partial<Payroll>): Promise<Payroll | undefined> {
    const existing = this.payrolls.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.payrolls.set(id, updated);
    return updated;
  }

  async deletePayroll(id: string): Promise<boolean> {
    return this.payrolls.delete(id);
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async createAccount(account: InsertAccount & Record<string, any>): Promise<Account> {
    const id = randomUUID();
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | undefined> {
    const existing = this.accounts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.accounts.set(id, updated);
    return updated;
  }

  async deleteAccount(id: string): Promise<boolean> {
    return this.accounts.delete(id);
  }

  async getFinanceVouchers(): Promise<FinanceVoucher[]> {
    return Array.from(this.financeVouchers.values());
  }

  async getFinanceVoucher(id: string): Promise<FinanceVoucher | undefined> {
    return this.financeVouchers.get(id);
  }

  async createFinanceVoucher(voucher: InsertFinanceVoucher & Record<string, any>): Promise<FinanceVoucher> {
    const id = randomUUID();
    const voucherId = `FV-${Date.now()}`;
    const voucherNumber = voucher.voucherNumber || `V-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const newVoucher: FinanceVoucher = { ...voucher, id, voucherId, voucherNumber, createdAt };
    this.financeVouchers.set(id, newVoucher);
    return newVoucher;
  }

  async updateFinanceVoucher(id: string, updates: Partial<FinanceVoucher>): Promise<FinanceVoucher | undefined> {
    const existing = this.financeVouchers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.financeVouchers.set(id, updated);
    return updated;
  }

  async deleteFinanceVoucher(id: string): Promise<boolean> {
    return this.financeVouchers.delete(id);
  }

  async postFinanceVoucher(_id: string, _postedBy: string): Promise<FinanceVoucher | undefined> {
    throw new Error("postFinanceVoucher not implemented in MemStorage");
  }

  async cancelFinanceVoucher(_id: string, _cancelledBy: string): Promise<FinanceVoucher | undefined> {
    throw new Error("cancelFinanceVoucher not implemented in MemStorage");
  }

  async getFinanceDashboard(_branchId?: number): Promise<any> {
    return { totalAssets: 0, totalLiabilities: 0, totalIncome: 0, totalExpenses: 0, recentVouchers: [] };
  }

  async getTimetables(): Promise<Timetable[]> {
    return Array.from(this.timetables.values());
  }

  async getTimetable(id: string): Promise<Timetable | undefined> {
    return this.timetables.get(id);
  }

  async createTimetable(timetable: InsertTimetable & Record<string, any>): Promise<Timetable> {
    // Check if a timetable already exists for this class-section
    let existing: Timetable | undefined;
    let existingId: string | undefined;

    for (const [id, tt] of this.timetables.entries()) {
      if (tt.class === timetable.class && tt.section === timetable.section) {
        existing = tt;
        existingId = id;
        break;
      }
    }

    if (existing && existingId) {
      // Merge new slots with existing slots
      const existingSlots = existing.slots || [];
      const newSlots = timetable.slots || [];

      // Create a map of existing slots by day-period key
      const slotMap = new Map();
      existingSlots.forEach((slot) => {
        const key = `${slot.day}-${slot.period}`;
        slotMap.set(key, slot);
      });

      // Add or update with new slots
      newSlots.forEach((slot) => {
        const key = `${slot.day}-${slot.period}`;
        slotMap.set(key, slot);
      });

      // Convert map back to array
      const mergedSlots = Array.from(slotMap.values());
      const updated: Timetable = {
        ...existing,
        slots: mergedSlots,
        updatedAt: timetable.updatedAt
      };

      this.timetables.set(existingId, updated);
      return updated;
    } else {
      // Create new timetable
      const id = randomUUID();
      const newTimetable: Timetable = { ...timetable, id };
      this.timetables.set(id, newTimetable);
      return newTimetable;
    }
  }

  async updateTimetable(id: string, updates: Partial<Timetable>): Promise<Timetable | undefined> {
    const existing = this.timetables.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.timetables.set(id, updated);
    return updated;
  }

  async deleteTimetable(id: string): Promise<boolean> {
    return this.timetables.delete(id);
  }

  async getDateSheets(): Promise<DateSheet[]> {
    return Array.from(this.dateSheets.values());
  }

  async getDateSheet(id: string): Promise<DateSheet | undefined> {
    return this.dateSheets.get(id);
  }

  async createDateSheet(dateSheet: InsertDateSheet & Record<string, any>): Promise<DateSheet> {
    const id = randomUUID();
    const newDateSheet: DateSheet = { ...dateSheet, id };
    this.dateSheets.set(id, newDateSheet);
    return newDateSheet;
  }

  async updateDateSheet(id: string, updates: Partial<DateSheet>): Promise<DateSheet | undefined> {
    const existing = this.dateSheets.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.dateSheets.set(id, updated);
    return updated;
  }

  async deleteDateSheet(id: string): Promise<boolean> {
    return this.dateSheets.delete(id);
  }

  async getCurriculums(): Promise<Curriculum[]> {
    return Array.from(this.curriculums.values());
  }

  async getCurriculum(id: string): Promise<Curriculum | undefined> {
    return this.curriculums.get(id);
  }

  async createCurriculum(curriculum: InsertCurriculum & Record<string, any>): Promise<Curriculum> {
    const id = randomUUID();
    const newCurriculum: Curriculum = { ...curriculum, id };
    this.curriculums.set(id, newCurriculum);
    return newCurriculum;
  }

  async updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<Curriculum | undefined> {
    const existing = this.curriculums.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.curriculums.set(id, updated);
    return updated;
  }

  async deleteCurriculum(id: string): Promise<boolean> {
    return this.curriculums.delete(id);
  }

  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  async getExam(id: string): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async createExam(exam: InsertExam & Record<string, any>): Promise<Exam> {
    const id = randomUUID();
    const newExam: Exam = { ...exam, id };
    this.exams.set(id, newExam);
    return newExam;
  }

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | undefined> {
    const existing = this.exams.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.exams.set(id, updated);
    return updated;
  }

  async deleteExam(id: string): Promise<boolean> {
    return this.exams.delete(id);
  }

  async getResults(): Promise<Result[]> {
    return Array.from(this.results.values());
  }

  async getResult(id: string): Promise<Result | undefined> {
    return this.results.get(id);
  }

  async createResult(result: InsertResult & Record<string, any>): Promise<Result> {
    const id = randomUUID();
    const newResult: Result = { ...result, id };
    this.results.set(id, newResult);
    return newResult;
  }

  async updateResult(id: string, updates: Partial<Result>): Promise<Result | undefined> {
    const existing = this.results.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.results.set(id, updated);
    return updated;
  }

  async deleteResult(id: string): Promise<boolean> {
    return this.results.delete(id);
  }

  async getQuestions(): Promise<Question[]> { return []; }
  async getQuestion(_id: string): Promise<Question | undefined> { return undefined; }
  async createQuestion(q: InsertQuestion): Promise<Question> { return { ...q, id: randomUUID() } as Question; }
  async updateQuestion(_id: string, _u: Partial<Question>): Promise<Question | undefined> { return undefined; }
  async deleteQuestion(_id: string): Promise<boolean> { return false; }

  async getQuizzes(): Promise<Quiz[]> { return []; }
  async getQuiz(_id: string): Promise<Quiz | undefined> { return undefined; }
  async createQuiz(q: InsertQuiz): Promise<Quiz> { return { ...q, id: randomUUID() } as Quiz; }
  async updateQuiz(_id: string, _u: Partial<Quiz>): Promise<Quiz | undefined> { return undefined; }
  async deleteQuiz(_id: string): Promise<boolean> { return false; }

  async getQuizAttempts(): Promise<QuizAttempt[]> { return []; }
  async getQuizAttemptsByQuiz(_quizId: string): Promise<QuizAttempt[]> { return []; }
  async getQuizAttempt(_id: string): Promise<QuizAttempt | undefined> { return undefined; }
  async createQuizAttempt(a: InsertQuizAttempt): Promise<QuizAttempt> { return { ...a, id: randomUUID() } as QuizAttempt; }
  async updateQuizAttempt(_id: string, _u: Partial<QuizAttempt>): Promise<QuizAttempt | undefined> { return undefined; }
  async deleteQuizAttempt(_id: string): Promise<boolean> { return false; }

  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBook(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(book: InsertBook & Record<string, any>): Promise<Book> {
    const id = randomUUID();
    const newBook: Book = { ...book, id };
    this.books.set(id, newBook);
    return newBook;
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | undefined> {
    const existing = this.books.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.books.set(id, updated);
    return updated;
  }

  async deleteBook(id: string): Promise<boolean> {
    return this.books.delete(id);
  }

  async getLibraryMembers(): Promise<LibraryMember[]> {
    return Array.from(this.libraryMembers.values());
  }

  async getLibraryMember(id: string): Promise<LibraryMember | undefined> {
    return this.libraryMembers.get(id);
  }

  async createLibraryMember(member: InsertLibraryMember & Record<string, any>): Promise<LibraryMember> {
    const id = randomUUID();
    const memberId = `LIB-${Date.now()}`;
    const newMember: LibraryMember = { ...member, id, memberId };
    this.libraryMembers.set(id, newMember);
    return newMember;
  }

  async updateLibraryMember(id: string, updates: Partial<LibraryMember>): Promise<LibraryMember | undefined> {
    const existing = this.libraryMembers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.libraryMembers.set(id, updated);
    return updated;
  }

  async deleteLibraryMember(id: string): Promise<boolean> {
    return this.libraryMembers.delete(id);
  }

  async getBookIssues(): Promise<BookIssue[]> {
    return Array.from(this.bookIssues.values());
  }

  async getBookIssue(id: string): Promise<BookIssue | undefined> {
    return this.bookIssues.get(id);
  }

  async createBookIssue(issue: InsertBookIssue & Record<string, any>): Promise<BookIssue> {
    const id = randomUUID();
    const newIssue: BookIssue = { ...issue, id };
    this.bookIssues.set(id, newIssue);
    return newIssue;
  }

  async updateBookIssue(id: string, updates: Partial<BookIssue>): Promise<BookIssue | undefined> {
    const existing = this.bookIssues.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.bookIssues.set(id, updated);
    return updated;
  }

  async deleteBookIssue(id: string): Promise<boolean> {
    return this.bookIssues.delete(id);
  }

  async getBookCategories(): Promise<BookCategory[]> { return []; }
  async getBookCategory(_id: string): Promise<BookCategory | undefined> { return undefined; }
  async createBookCategory(c: InsertBookCategory): Promise<BookCategory> { return { ...c, id: randomUUID() } as BookCategory; }
  async updateBookCategory(_id: string, _u: Partial<BookCategory>): Promise<BookCategory | undefined> { return undefined; }
  async deleteBookCategory(_id: string): Promise<boolean> { return false; }

  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: string): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(route: InsertRoute & Record<string, any>): Promise<Route> {
    const id = randomUUID();
    const newRoute: Route = { ...route, id };
    this.routes.set(id, newRoute);
    return newRoute;
  }

  async updateRoute(id: string, updates: Partial<Route>): Promise<Route | undefined> {
    const existing = this.routes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.routes.set(id, updated);
    return updated;
  }

  async deleteRoute(id: string): Promise<boolean> {
    return this.routes.delete(id);
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(vehicle: InsertVehicle & Record<string, any>): Promise<Vehicle> {
    const id = randomUUID();
    const newVehicle: Vehicle = { ...vehicle, id };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(driver: InsertDriver & Record<string, any>): Promise<Driver> {
    const id = randomUUID();
    const newDriver: Driver = { ...driver, id };
    this.drivers.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver | undefined> {
    const existing = this.drivers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  async getStudentTransports(): Promise<StudentTransport[]> {
    return Array.from(this.studentTransports.values());
  }

  async getStudentTransport(id: string): Promise<StudentTransport | undefined> {
    return this.studentTransports.get(id);
  }

  async createStudentTransport(transport: InsertStudentTransport & Record<string, any>): Promise<StudentTransport> {
    const id = randomUUID();
    const newTransport: StudentTransport = { ...transport, id };
    this.studentTransports.set(id, newTransport);
    return newTransport;
  }

  async updateStudentTransport(id: string, updates: Partial<StudentTransport>): Promise<StudentTransport | undefined> {
    const existing = this.studentTransports.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.studentTransports.set(id, updated);
    return updated;
  }

  async deleteStudentTransport(id: string): Promise<boolean> {
    return this.studentTransports.delete(id);
  }

  async getHostelRooms(): Promise<HostelRoom[]> {
    return Array.from(this.hostelRooms.values());
  }

  async getHostelRoom(id: string): Promise<HostelRoom | undefined> {
    return this.hostelRooms.get(id);
  }

  async createHostelRoom(room: InsertHostelRoom & Record<string, any>): Promise<HostelRoom> {
    const id = randomUUID();
    const newRoom: HostelRoom = { ...room, id };
    this.hostelRooms.set(id, newRoom);
    return newRoom;
  }

  async updateHostelRoom(id: string, updates: Partial<HostelRoom>): Promise<HostelRoom | undefined> {
    const existing = this.hostelRooms.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.hostelRooms.set(id, updated);
    return updated;
  }

  async deleteHostelRoom(id: string): Promise<boolean> {
    return this.hostelRooms.delete(id);
  }

  async getHostelResidents(): Promise<HostelResident[]> {
    return Array.from(this.hostelResidents.values());
  }

  async getHostelResident(id: string): Promise<HostelResident | undefined> {
    return this.hostelResidents.get(id);
  }

  async createHostelResident(resident: InsertHostelResident & Record<string, any>): Promise<HostelResident> {
    const id = randomUUID();
    const newResident: HostelResident = { ...resident, id };
    this.hostelResidents.set(id, newResident);
    return newResident;
  }

  async updateHostelResident(id: string, updates: Partial<HostelResident>): Promise<HostelResident | undefined> {
    const existing = this.hostelResidents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.hostelResidents.set(id, updated);
    return updated;
  }

  async deleteHostelResident(id: string): Promise<boolean> {
    return this.hostelResidents.delete(id);
  }

  async getHostelFees(): Promise<HostelFee[]> {
    return Array.from(this.hostelFees.values());
  }

  async getHostelFee(id: string): Promise<HostelFee | undefined> {
    return this.hostelFees.get(id);
  }

  async createHostelFee(fee: InsertHostelFee & Record<string, any>): Promise<HostelFee> {
    const id = randomUUID();
    const newFee: HostelFee = { ...fee, id };
    this.hostelFees.set(id, newFee);
    return newFee;
  }

  async updateHostelFee(id: string, updates: Partial<HostelFee>): Promise<HostelFee | undefined> {
    const existing = this.hostelFees.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates, id };
    this.hostelFees.set(id, updated);
    return updated;
  }

  async deleteHostelFee(id: string): Promise<boolean> {
    return this.hostelFees.delete(id);
  }

  async getNotifications(module?: string): Promise<Notification[]> {
    const all = Array.from(this.notifications.values());
    const filtered = module ? all.filter(n => n.module === module || n.module === undefined || n.module === "all") : all;
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(notification: InsertNotification & Record<string, any>): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date().toISOString()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationRead(id: string): Promise<Notification | undefined> {
    const existing = this.notifications.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, read: true };
    this.notifications.set(id, updated);
    return updated;
  }

  async markAllNotificationsRead(module?: string): Promise<void> {
    this.notifications.forEach((notification, id) => {
      if (!module || notification.module === module || notification.module === "all") {
        this.notifications.set(id, { ...notification, read: true });
      }
    });
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  async getUnreadNotificationCount(module?: string): Promise<number> {
    const all = Array.from(this.notifications.values());
    const filtered = module ? all.filter(n => n.module === module || n.module === undefined || n.module === "all") : all;
    return filtered.filter(n => !n.read).length;
  }

  async getActivityLogs(module?: string): Promise<ActivityLog[]> {
    const all = Array.from(this.activityLogs.values());
    const filtered = module ? all.filter(log => log.module === module) : all;
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivityLog(log: InsertActivityLog & Record<string, any>): Promise<ActivityLog> {
    const id = randomUUID();
    const newLog: ActivityLog = {
      ...log,
      id,
      createdAt: new Date().toISOString()
    };
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  // POS Methods
  async getPosItems(): Promise<PosItem[]> {
    return Array.from(this.posItems.values());
  }

  async getPosItem(id: string): Promise<PosItem | undefined> {
    return this.posItems.get(id);
  }

  async createPosItem(item: InsertPosItem & Record<string, any>): Promise<PosItem> {
    const id = randomUUID();
    const seq = this.posItems.size + 1;
    const itemCode = `ITEM${String(seq).padStart(3, '0')}`;
    const newItem: PosItem = { ...item, itemCode, id };
    this.posItems.set(id, newItem);
    return newItem;
  }

  async updatePosItem(id: string, updates: Partial<PosItem>): Promise<PosItem | undefined> {
    const item = this.posItems.get(id);
    if (!item) return undefined;
    const updated = { ...item, ...updates };
    this.posItems.set(id, updated);
    return updated;
  }

  async deletePosItem(id: string): Promise<boolean> {
    return this.posItems.delete(id);
  }

  async getSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(sale: InsertSale & Record<string, any>): Promise<Sale> {
    const id = randomUUID();
    const newSale: Sale = { ...sale, id };
    this.sales.set(id, newSale);
    return newSale;
  }

  async updateSale(id: string, updates: Partial<Sale>): Promise<Sale | undefined> {
    const sale = this.sales.get(id);
    if (!sale) return undefined;
    const updated = { ...sale, ...updates };
    this.sales.set(id, updated);
    return updated;
  }

  async deleteSale(id: string): Promise<boolean> {
    return this.sales.delete(id);
  }

  private attendanceRecords: Map<string, AttendanceRecord> = new Map();

  async getAttendanceRecords(filters?: { date?: string; targetType?: string; className?: string; section?: string }): Promise<AttendanceRecord[]> {
    let records = Array.from(this.attendanceRecords.values());
    if (filters?.date) records = records.filter(r => r.date === filters.date);
    if (filters?.targetType) records = records.filter(r => r.targetType === filters.targetType);
    if (filters?.className) records = records.filter(r => r.className === filters.className);
    if (filters?.section) records = records.filter(r => r.section === filters.section);
    return records;
  }

  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async upsertAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const existingKey = Array.from(this.attendanceRecords.entries()).find(([_, r]) => {
      if (record.targetType === "STUDENT") return r.date === record.date && r.studentId === record.studentId;
      return r.date === record.date && r.staffId === record.staffId;
    });
    if (existingKey) {
      const updated = { ...existingKey[1], ...record, updatedAt: new Date().toISOString() };
      this.attendanceRecords.set(existingKey[0], updated);
      return updated;
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = { ...record, id, markedAt: now, updatedAt: now };
    this.attendanceRecords.set(id, newRecord);
    return newRecord;
  }

  async updateAttendanceRecord(id: string, updates: Partial<AttendanceRecord>): Promise<AttendanceRecord | undefined> {
    const record = this.attendanceRecords.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates, updatedAt: new Date().toISOString() };
    this.attendanceRecords.set(id, updated);
    return updated;
  }

  async deleteAttendanceRecord(id: string): Promise<boolean> {
    return this.attendanceRecords.delete(id);
  }

  async getAttendanceSummary(date: string, targetType?: string): Promise<AttendanceSummary> {
    let records = Array.from(this.attendanceRecords.values()).filter(r => r.date === date);
    if (targetType) records = records.filter(r => r.targetType === targetType);
    return {
      date,
      total: records.length,
      present: records.filter(r => r.status === "PRESENT").length,
      absent: records.filter(r => r.status === "ABSENT").length,
      leave: records.filter(r => r.status === "LEAVE").length,
    };
  }

  async getAttendanceReport(filters: { targetType: string; startDate: string; endDate: string; className?: string; section?: string }): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(r => {
      if (r.targetType !== filters.targetType) return false;
      if (r.date < filters.startDate || r.date > filters.endDate) return false;
      if (filters.className && r.className !== filters.className) return false;
      if (filters.section && r.section !== filters.section) return false;
      return true;
    });
  }

  async getFeeStructures(): Promise<FeeStructure[]> { return []; }
  async getFeeStructure(_id: string): Promise<FeeStructure | undefined> { return undefined; }
  async createFeeStructure(s: InsertFeeStructure): Promise<FeeStructure> { return { ...s, id: randomUUID(), structureId: "FS001", createdAt: new Date().toISOString() } as FeeStructure; }
  async updateFeeStructure(_id: string, _u: Partial<FeeStructure>): Promise<FeeStructure | undefined> { return undefined; }
  async deleteFeeStructure(_id: string): Promise<boolean> { return false; }

  async getDiscountRules(): Promise<DiscountRule[]> { return []; }
  async getDiscountRule(_id: string): Promise<DiscountRule | undefined> { return undefined; }
  async createDiscountRule(r: InsertDiscountRule): Promise<DiscountRule> { return { ...r, id: randomUUID() } as DiscountRule; }
  async updateDiscountRule(_id: string, _u: Partial<DiscountRule>): Promise<DiscountRule | undefined> { return undefined; }
  async deleteDiscountRule(_id: string): Promise<boolean> { return false; }

  async getLateFeeRules(): Promise<LateFeeRule[]> { return []; }
  async getLateFeeRule(_id: string): Promise<LateFeeRule | undefined> { return undefined; }
  async createLateFeeRule(r: InsertLateFeeRule): Promise<LateFeeRule> { return { ...r, id: randomUUID() } as LateFeeRule; }
  async updateLateFeeRule(_id: string, _u: Partial<LateFeeRule>): Promise<LateFeeRule | undefined> { return undefined; }
  async deleteLateFeeRule(_id: string): Promise<boolean> { return false; }

  async getInstallmentPlans(): Promise<InstallmentPlan[]> { return []; }
  async getInstallmentPlan(_id: string): Promise<InstallmentPlan | undefined> { return undefined; }
  async createInstallmentPlan(p: InsertInstallmentPlan): Promise<InstallmentPlan> { return { ...p, id: randomUUID() } as InstallmentPlan; }
  async updateInstallmentPlan(_id: string, _u: Partial<InstallmentPlan>): Promise<InstallmentPlan | undefined> { return undefined; }
  async deleteInstallmentPlan(_id: string): Promise<boolean> { return false; }

  async getChallans(): Promise<Challan[]> { return []; }
  async getChallan(_id: string): Promise<Challan | undefined> { return undefined; }
  async getChallansByStudent(_studentId: string): Promise<Challan[]> { return []; }
  async createChallan(c: InsertChallan): Promise<Challan> { return { ...c, id: randomUUID(), challanNo: "CHN000001", createdAt: new Date().toISOString() } as Challan; }
  async updateChallan(_id: string, _u: Partial<Challan>): Promise<Challan | undefined> { return undefined; }
  async deleteChallan(_id: string): Promise<boolean> { return false; }

  async getPayments(): Promise<Payment[]> { return []; }
  async getPayment(_id: string): Promise<Payment | undefined> { return undefined; }
  async getPaymentsByChallan(_challanId: string): Promise<Payment[]> { return []; }
  async createPayment(p: InsertPayment): Promise<Payment> { return { ...p, id: randomUUID(), receiptNo: "RCP000001", createdAt: new Date().toISOString() } as Payment; }
  async updatePayment(_id: string, _u: Partial<Payment>): Promise<Payment | undefined> { return undefined; }
  async deletePayment(_id: string): Promise<boolean> { return false; }

  async getVendors(): Promise<Vendor[]> { return []; }
  async getVendor(_id: string): Promise<Vendor | undefined> { return undefined; }
  async createVendor(v: InsertVendor): Promise<Vendor> { return { ...v, id: randomUUID(), vendorId: "VND0001", createdAt: new Date().toISOString() } as Vendor; }
  async updateVendor(_id: string, _u: Partial<Vendor>): Promise<Vendor | undefined> { return undefined; }
  async deleteVendor(_id: string): Promise<boolean> { return false; }

  async getExpenses(): Promise<Expense[]> { return []; }
  async getExpense(_id: string): Promise<Expense | undefined> { return undefined; }
  async createExpense(e: InsertExpense): Promise<Expense> { return { ...e, id: randomUUID(), expenseId: "EXP000001", createdAt: new Date().toISOString() } as Expense; }
  async updateExpense(_id: string, _u: Partial<Expense>): Promise<Expense | undefined> { return undefined; }
  async deleteExpense(_id: string): Promise<boolean> { return false; }

  async getChartOfAccounts(): Promise<ChartOfAccounts[]> { return []; }
  async getChartOfAccount(_id: string): Promise<ChartOfAccounts | undefined> { return undefined; }
  async createChartOfAccount(a: InsertChartOfAccounts): Promise<ChartOfAccounts> { return { ...a, id: randomUUID(), createdAt: new Date().toISOString() } as ChartOfAccounts; }
  async updateChartOfAccount(_id: string, _u: Partial<ChartOfAccounts>): Promise<ChartOfAccounts | undefined> { return undefined; }
  async deleteChartOfAccount(_id: string): Promise<boolean> { return false; }

  async getLedgerEntries(): Promise<LedgerEntry[]> { return []; }
  async getLedgerEntry(_id: string): Promise<LedgerEntry | undefined> { return undefined; }
  async getLedgerEntriesByAccount(_accountId: string): Promise<LedgerEntry[]> { return []; }
  async getLedgerEntriesByAccountAndDate(_accountId?: string, _fromDate?: string, _toDate?: string): Promise<LedgerEntry[]> { return []; }
  async createLedgerEntry(e: InsertLedgerEntry): Promise<LedgerEntry> { return { ...e, id: randomUUID(), entryNo: "LE00000001", createdAt: new Date().toISOString() } as LedgerEntry; }
  async updateLedgerEntry(_id: string, _u: Partial<LedgerEntry>): Promise<LedgerEntry | undefined> { return undefined; }
  async deleteLedgerEntry(_id: string): Promise<boolean> { return false; }

  async getJournalEntries(): Promise<JournalEntry[]> { return []; }
  async getJournalEntry(_id: string): Promise<JournalEntry | undefined> { return undefined; }
  async createJournalEntry(e: InsertJournalEntry): Promise<JournalEntry> { return { ...e, id: randomUUID(), journalNo: "JE000001", createdAt: new Date().toISOString() } as JournalEntry; }
  async updateJournalEntry(_id: string, _u: Partial<JournalEntry>): Promise<JournalEntry | undefined> { return undefined; }
  async deleteJournalEntry(_id: string): Promise<boolean> { return false; }
}

import { PgStorage } from "./pg-storage";

export const storage: IStorage = new PgStorage();
