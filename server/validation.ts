import { storage } from "./storage";

export interface ValidationResult {
  canDelete: boolean;
  references: { module: string; count: number; description: string }[];
  errorMessage?: string;
}

export async function checkStudentReferences(studentId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const [feeVouchers, results, bookIssues, studentTransports, hostelResidents] = await Promise.all([
    storage.getFeeVouchers(),
    storage.getResults(),
    storage.getBookIssues(),
    storage.getStudentTransports(),
    storage.getHostelResidents(),
  ]);

  const feeCount = feeVouchers.filter(v => v.studentId === studentId).length;
  if (feeCount > 0) {
    references.push({ module: "Fees", count: feeCount, description: `${feeCount} fee voucher(s)` });
  }

  const resultCount = results.filter(r => r.studentId === studentId).length;
  if (resultCount > 0) {
    references.push({ module: "Exams", count: resultCount, description: `${resultCount} exam result(s)` });
  }

  const libraryMembers = await storage.getLibraryMembers();
  const memberRecord = libraryMembers.find(m => m.type === "student" && m.referenceId === studentId);
  if (memberRecord) {
    const issueCount = bookIssues.filter(i => i.memberId === memberRecord.id && i.status === "Issued").length;
    if (issueCount > 0) {
      references.push({ module: "Library", count: issueCount, description: `${issueCount} active book issue(s)` });
    }
  }

  const transportCount = studentTransports.filter(t => t.studentId === studentId).length;
  if (transportCount > 0) {
    references.push({ module: "Transport", count: transportCount, description: `${transportCount} transport assignment(s)` });
  }

  const hostelCount = hostelResidents.filter(r => r.studentId === studentId && r.status === "Active").length;
  if (hostelCount > 0) {
    references.push({ module: "Hostel", count: hostelCount, description: `${hostelCount} active hostel resident(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete student: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkStaffReferences(staffId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const [payrolls, timetables, dateSheets] = await Promise.all([
    storage.getPayrolls(),
    storage.getTimetables(),
    storage.getDateSheets(),
  ]);

  const payrollCount = payrolls.filter(p => p.staffId === staffId).length;
  if (payrollCount > 0) {
    references.push({ module: "Payroll", count: payrollCount, description: `${payrollCount} payroll record(s)` });
  }

  let timetableCount = 0;
  for (const tt of timetables) {
    const slotCount = tt.slots.filter(s => s.teacherId === staffId).length;
    if (slotCount > 0) timetableCount += slotCount;
  }
  if (timetableCount > 0) {
    references.push({ module: "Timetable", count: timetableCount, description: `${timetableCount} timetable slot(s)` });
  }

  let invigilatorCount = 0;
  for (const ds of dateSheets) {
    const entryCount = ds.entries.filter(e => e.invigilatorId === staffId).length;
    if (entryCount > 0) invigilatorCount += entryCount;
  }
  if (invigilatorCount > 0) {
    references.push({ module: "DateSheet", count: invigilatorCount, description: `${invigilatorCount} exam invigilator assignment(s)` });
  }

  const libraryMembers = await storage.getLibraryMembers();
  const memberRecord = libraryMembers.find(m => m.type === "staff" && m.referenceId === staffId);
  if (memberRecord) {
    const bookIssues = await storage.getBookIssues();
    const issueCount = bookIssues.filter(i => i.memberId === memberRecord.id && i.status === "Issued").length;
    if (issueCount > 0) {
      references.push({ module: "Library", count: issueCount, description: `${issueCount} active book issue(s)` });
    }
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete staff member: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkAccountReferences(accountId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const financeVouchers = await storage.getFinanceVouchers();
  const voucherCount = financeVouchers.filter(v => v.entries && v.entries.some((e: any) => e.accountId === accountId)).length;
  if (voucherCount > 0) {
    references.push({ module: "Finance", count: voucherCount, description: `${voucherCount} finance voucher(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete account: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkRouteReferences(routeId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const [vehicles, studentTransports] = await Promise.all([
    storage.getVehicles(),
    storage.getStudentTransports(),
  ]);

  const vehicleCount = vehicles.filter(v => v.routeId === routeId).length;
  if (vehicleCount > 0) {
    references.push({ module: "Transport", count: vehicleCount, description: `${vehicleCount} assigned vehicle(s)` });
  }

  const transportCount = studentTransports.filter(t => t.routeId === routeId).length;
  if (transportCount > 0) {
    references.push({ module: "Transport", count: transportCount, description: `${transportCount} student transport assignment(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete route: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkVehicleReferences(vehicleId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const [drivers, studentTransports] = await Promise.all([
    storage.getDrivers(),
    storage.getStudentTransports(),
  ]);

  const driverCount = drivers.filter(d => d.vehicleId === vehicleId).length;
  if (driverCount > 0) {
    references.push({ module: "Transport", count: driverCount, description: `${driverCount} assigned driver(s)` });
  }

  const transportCount = studentTransports.filter(t => t.vehicleId === vehicleId).length;
  if (transportCount > 0) {
    references.push({ module: "Transport", count: transportCount, description: `${transportCount} student transport assignment(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete vehicle: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkHostelRoomReferences(roomId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const hostelResidents = await storage.getHostelResidents();
  const residentCount = hostelResidents.filter(r => r.roomId === roomId && r.status === "Active").length;
  if (residentCount > 0) {
    references.push({ module: "Hostel", count: residentCount, description: `${residentCount} active resident(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete hostel room: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkBookReferences(bookId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const bookIssues = await storage.getBookIssues();
  const issueCount = bookIssues.filter(i => i.bookId === bookId && i.status === "Issued").length;
  if (issueCount > 0) {
    references.push({ module: "Library", count: issueCount, description: `${issueCount} active issue(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete book: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkLibraryMemberReferences(memberId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const bookIssues = await storage.getBookIssues();
  const issueCount = bookIssues.filter(i => i.memberId === memberId && i.status === "Issued").length;
  if (issueCount > 0) {
    references.push({ module: "Library", count: issueCount, description: `${issueCount} active book issue(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete library member: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkExamReferences(examId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const results = await storage.getResults();
  const resultCount = results.filter(r => r.examId === examId).length;
  if (resultCount > 0) {
    references.push({ module: "Exams", count: resultCount, description: `${resultCount} exam result(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete exam: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkVacancyReferences(vacancyId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const applicants = await storage.getApplicants();
  const applicantCount = applicants.filter(a => a.vacancyId === vacancyId).length;
  if (applicantCount > 0) {
    references.push({ module: "HR", count: applicantCount, description: `${applicantCount} applicant(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete vacancy: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}

export async function checkHostelResidentReferences(residentId: string): Promise<ValidationResult> {
  const references: { module: string; count: number; description: string }[] = [];

  const hostelFees = await storage.getHostelFees();
  const feeCount = hostelFees.filter(f => f.residentId === residentId).length;
  if (feeCount > 0) {
    references.push({ module: "Hostel", count: feeCount, description: `${feeCount} hostel fee record(s)` });
  }

  const canDelete = references.length === 0;
  const errorMessage = canDelete
    ? undefined
    : `Cannot delete hostel resident: Referenced by ${references.map(r => r.description).join(", ")}`;

  return { canDelete, references, errorMessage };
}
