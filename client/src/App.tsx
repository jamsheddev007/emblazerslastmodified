import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";

import ModuleLoginPage from "@/pages/module-login";
import StudentDashboard from "@/pages/student/dashboard";
import StudentList from "@/pages/student/list";
import StudentAdd from "@/pages/student/add";
import StudentEdit from "@/pages/student/edit";
import StudentProfile from "@/pages/student/profile";
import StudentAlumni from "@/pages/student/alumni";
import StudentReports from "@/pages/student/reports";
import StudentPromotion from "@/pages/student/promotion";

import HrDashboard from "@/pages/hr/dashboard";
import HrList from "@/pages/hr/list";
import HrAdd from "@/pages/hr/add";
import HrEdit from "@/pages/hr/edit";
import HrProfile from "@/pages/hr/profile";
import HrVacancies from "@/pages/hr/vacancies";
import HrApplicants from "@/pages/hr/applicants";
import HrLeaves from "@/pages/hr/leaves";
import HrReports from "@/pages/hr/reports";
import HrPayrollList from "@/pages/hr/payroll/list";
import HrPayrollGenerate from "@/pages/hr/payroll/generate";
import HrPayrollReports from "@/pages/hr/payroll/reports";

import FeeDashboard from "@/pages/fee/dashboard";
import FeeStructures from "@/pages/fee/structures";
import FeeChallans from "@/pages/fee/challans";
import FeePayments from "@/pages/fee/payments";
import FeeVouchers from "@/pages/fee/vouchers";
import FeeGenerate from "@/pages/fee/generate";
import FeeReports from "@/pages/fee/reports";
import FeeDefaulters from "@/pages/fee/defaulters";
import FeeBroadcast from "@/pages/fee/broadcast";


import FinanceDashboard from "@/pages/finance/dashboard";
import FinanceAccounts from "@/pages/finance/accounts";
import FinanceLedger from "@/pages/finance/ledger";
import FinanceExpenses from "@/pages/finance/expenses";
import FinanceVendors from "@/pages/finance/vendors";
import FinanceVouchers from "@/pages/finance/vouchers";
import FinanceReports from "@/pages/finance/reports";
import FinanceAssets from "@/pages/finance/assets";


import AttendanceDashboard from "@/pages/attendance/dashboard";
import AttendanceMarkStudents from "@/pages/attendance/mark-students";
import AttendanceMarkStaff from "@/pages/attendance/mark-staff";
import AttendanceRecords from "@/pages/attendance/records";
import AttendanceReports from "@/pages/attendance/reports";

import TimetableClass from "@/pages/timetable/class";
import TimetableTeacher from "@/pages/timetable/teacher";
import TimetableCreate from "@/pages/timetable/create";

import DateSheetList from "@/pages/datesheet/list";
import DateSheetCreate from "@/pages/datesheet/create";
import DateSheetEdit from "@/pages/datesheet/edit";
import DateSheetView from "@/pages/datesheet/view";

import CurriculumDashboard from "@/pages/curriculum/dashboard";
import CurriculumSyllabus from "@/pages/curriculum/syllabus";
import CurriculumExams from "@/pages/curriculum/exams";
import CurriculumReports from "@/pages/curriculum/reports";
import CurriculumLogin from "@/pages/curriculum/login";
import StudentPortalLogin from "@/pages/student-portal/login";
import CurriculumTeacherAssignments from "@/pages/curriculum/teacher-assignments";
import CurriculumTeacherAssignmentsView from "@/pages/curriculum/teacher-assignments-view";
import CurriculumStudentAccounts from "@/pages/curriculum/student-accounts";
import CurriculumTeacherDashboard from "@/pages/curriculum/teacher-dashboard";
import CurriculumTeacherContent from "@/pages/curriculum/teacher-content";
import CurriculumTeacherQuizzes from "@/pages/curriculum/teacher-quizzes";
import CurriculumTeacherQuizResults from "@/pages/curriculum/teacher-quiz-results";
import CurriculumStudentDashboard from "@/pages/curriculum/student-dashboard";
import CurriculumStudentContent from "@/pages/curriculum/student-content";
import CurriculumStudentQuizzes from "@/pages/curriculum/student-quizzes";
import CurriculumStudentResults from "@/pages/curriculum/student-results";
import CurriculumStudentFees from "@/pages/curriculum/student-fees";
import CurriculumStudentAttendance from "@/pages/curriculum/student-attendance";
import CurriculumStudentIdCard from "@/pages/curriculum/student-id-card";

import PosDashboard from "@/pages/pos/dashboard";
import PosSales from "@/pages/pos/sales";
import PosNew from "@/pages/pos/new";
import PosItems from "@/pages/pos/items";
import PosReports from "@/pages/pos/reports";

import LibraryDashboard from "@/pages/library/dashboard";
import LibraryBooks from "@/pages/library/books";
import LibraryMembers from "@/pages/library/members";
import LibraryIssue from "@/pages/library/issue";
import LibraryReports from "@/pages/library/reports";

import TransportDashboard from "@/pages/transport/dashboard";
import TransportRoutes from "@/pages/transport/routes";
import TransportVehicles from "@/pages/transport/vehicles";
import TransportDrivers from "@/pages/transport/drivers";
import TransportReports from "@/pages/transport/reports";

import HostelDashboard from "@/pages/hostel/dashboard";
import HostelRooms from "@/pages/hostel/rooms";
import HostelResidents from "@/pages/hostel/residents";
import HostelFees from "@/pages/hostel/fees";
import HostelReports from "@/pages/hostel/reports";

import ReportsDashboard from "@/pages/reports/dashboard";

import ParentLogin from "@/pages/parent/login";
import ParentDashboard from "@/pages/parent/dashboard";
import ParentMessages from "@/pages/parent/messages";
import ParentNotifications from "@/pages/parent/notifications";
import ParentChangePassword from "@/pages/parent/change-password";
import CurriculumParentAccounts from "@/pages/curriculum/parent-accounts";
import CurriculumParentInbox from "@/pages/curriculum/parent-inbox";
import CurriculumBroadcast from "@/pages/curriculum/broadcast";

import StaffLogin from "@/pages/staff/login";
import TeacherMessages from "@/pages/teacher/messages";
import TeacherHomework from "@/pages/teacher/homework";
import TeacherResultEntry from "@/pages/teacher/results";
import CurriculumHomework from "@/pages/curriculum/homework";
import CurriculumStudentHomework from "@/pages/curriculum/student-homework";
import StudentCertificates from "@/pages/student/certificates";

import StaffDashboard from "@/pages/staff/dashboard";
import StaffProfile from "@/pages/staff/profile";
import StaffLeaves from "@/pages/staff/leaves";
import StaffAttendance from "@/pages/staff/attendance";
import StaffSalary from "@/pages/staff/salary";
import StaffDocuments from "@/pages/staff/documents";

import CareersPage from "@/pages/careers/index";
import CareersApply from "@/pages/careers/apply";

import PWAInstallPrompt from "@/components/pwa-install-prompt";

import SuperLogin from "@/pages/super/login";
import SuperDashboard from "@/pages/super/dashboard";
import SuperSchools from "@/pages/super/schools";
import SuperBranches from "@/pages/super/branches";
import SuperAdmins from "@/pages/super/admins";
import SuperAnalytics from "@/pages/super/analytics";
import SuperAuditLogs from "@/pages/super/audit-logs";
import SuperReportCardSettings from "@/pages/super/report-card-settings";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      <Route path="/super/login" component={SuperLogin} />
      <Route path="/super/dashboard" component={SuperDashboard} />
      <Route path="/super/schools" component={SuperSchools} />
      <Route path="/super/branches" component={SuperBranches} />
      <Route path="/super/admins" component={SuperAdmins} />
      <Route path="/super/analytics" component={SuperAnalytics} />
      <Route path="/super/audit-logs" component={SuperAuditLogs} />
      <Route path="/super/report-card-settings" component={SuperReportCardSettings} />

      <Route path="/curriculum/login" component={CurriculumLogin} />
      <Route path="/student-portal/login" component={StudentPortalLogin} />
      <Route path="/parent/login" component={ParentLogin} />
      <Route path="/staff/login" component={StaffLogin} />
      <Route path="/:module/login" component={ModuleLoginPage} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/list" component={StudentList} />
      <Route path="/student/add" component={StudentAdd} />
      <Route path="/student/edit/:id" component={StudentEdit} />
      <Route path="/student/profile/:id" component={StudentProfile} />
      <Route path="/student/alumni" component={StudentAlumni} />
      <Route path="/student/reports" component={StudentReports} />
      <Route path="/student/promotion" component={StudentPromotion} />
      <Route path="/student/certificates" component={StudentCertificates} />

      <Route path="/hr/dashboard" component={HrDashboard} />
      <Route path="/hr/list" component={HrList} />
      <Route path="/hr/add" component={HrAdd} />
      <Route path="/hr/edit/:id" component={HrEdit} />
      <Route path="/hr/profile/:id" component={HrProfile} />
      <Route path="/hr/vacancies" component={HrVacancies} />
      <Route path="/hr/applicants" component={HrApplicants} />
      <Route path="/hr/leaves" component={HrLeaves} />
      <Route path="/hr/reports" component={HrReports} />
      <Route path="/hr/payroll/list" component={HrPayrollList} />
      <Route path="/hr/payroll/generate" component={HrPayrollGenerate} />
      <Route path="/hr/payroll/reports" component={HrPayrollReports} />
      <Route path="/teacher/messages" component={TeacherMessages} />
      <Route path="/teacher/homework" component={TeacherHomework} />
      <Route path="/teacher/results" component={TeacherResultEntry} />
      <Route path="/curriculum/homework" component={CurriculumHomework} />
      <Route path="/curriculum/student-homework" component={CurriculumStudentHomework} />

      <Route path="/fee/dashboard" component={FeeDashboard} />
      <Route path="/fee/structures" component={FeeStructures} />
      <Route path="/fee/challans" component={FeeChallans} />
      <Route path="/fee/payments" component={FeePayments} />
      <Route path="/fee/vouchers" component={FeeVouchers} />
      <Route path="/fee/generate" component={FeeGenerate} />
      <Route path="/fee/reports" component={FeeReports} />
      <Route path="/fee/defaulters" component={FeeDefaulters} />
      <Route path="/fee/broadcast" component={FeeBroadcast} />

      <Route path="/finance/dashboard" component={FinanceDashboard} />
      <Route path="/finance/accounts" component={FinanceAccounts} />
      <Route path="/finance/ledger" component={FinanceLedger} />
      <Route path="/finance/expenses" component={FinanceExpenses} />
      <Route path="/finance/vendors" component={FinanceVendors} />
      <Route path="/finance/vouchers" component={FinanceVouchers} />
      <Route path="/finance/reports" component={FinanceReports} />
      <Route path="/finance/assets" component={FinanceAssets} />

      <Route path="/attendance/dashboard" component={AttendanceDashboard} />
      <Route path="/attendance/mark-students" component={AttendanceMarkStudents} />
      <Route path="/attendance/mark-staff" component={AttendanceMarkStaff} />
      <Route path="/attendance/records" component={AttendanceRecords} />
      <Route path="/attendance/reports" component={AttendanceReports} />

      <Route path="/curriculum/timetable/class" component={TimetableClass} />
      <Route path="/curriculum/timetable/teacher" component={TimetableTeacher} />
      <Route path="/curriculum/timetable/create" component={TimetableCreate} />

      <Route path="/curriculum/datesheet/list" component={DateSheetList} />
      <Route path="/curriculum/datesheet/create" component={DateSheetCreate} />
      <Route path="/curriculum/datesheet/edit/:id" component={DateSheetEdit} />
      <Route path="/curriculum/datesheet/view/:id" component={DateSheetView} />

      <Route path="/curriculum/dashboard" component={CurriculumDashboard} />
      <Route path="/curriculum/syllabus" component={CurriculumSyllabus} />
      <Route path="/curriculum/exams" component={CurriculumExams} />
      <Route path="/curriculum/reports" component={CurriculumReports} />
      <Route path="/curriculum/teacher-assignments" component={CurriculumTeacherAssignments} />
      <Route path="/curriculum/teacher-assignments-view" component={CurriculumTeacherAssignmentsView} />
      <Route path="/curriculum/student-accounts" component={CurriculumStudentAccounts} />
      <Route path="/curriculum/teacher-dashboard" component={CurriculumTeacherDashboard} />
      <Route path="/curriculum/teacher-content" component={CurriculumTeacherContent} />
      <Route path="/teacher/quizzes" component={CurriculumTeacherQuizzes} />
      <Route path="/teacher/quiz-results" component={CurriculumTeacherQuizResults} />
      <Route path="/curriculum/student-dashboard" component={CurriculumStudentDashboard} />
      <Route path="/curriculum/student-content" component={CurriculumStudentContent} />
      <Route path="/curriculum/student-quizzes" component={CurriculumStudentQuizzes} />
      <Route path="/curriculum/student-results" component={CurriculumStudentResults} />
      <Route path="/curriculum/student-fees" component={CurriculumStudentFees} />
      <Route path="/curriculum/student-attendance" component={CurriculumStudentAttendance} />
      <Route path="/curriculum/student-id-card" component={CurriculumStudentIdCard} />

      <Route path="/pos/dashboard" component={PosDashboard} />
      <Route path="/pos/sales" component={PosSales} />
      <Route path="/pos/new" component={PosNew} />
      <Route path="/pos/items" component={PosItems} />
      <Route path="/pos/reports" component={PosReports} />

      <Route path="/library/dashboard" component={LibraryDashboard} />
      <Route path="/library/books" component={LibraryBooks} />
      <Route path="/library/members" component={LibraryMembers} />
      <Route path="/library/issue" component={LibraryIssue} />
      <Route path="/library/reports" component={LibraryReports} />

      <Route path="/transport/dashboard" component={TransportDashboard} />
      <Route path="/transport/routes" component={TransportRoutes} />
      <Route path="/transport/vehicles" component={TransportVehicles} />
      <Route path="/transport/drivers" component={TransportDrivers} />
      <Route path="/transport/reports" component={TransportReports} />

      <Route path="/hostel/dashboard" component={HostelDashboard} />
      <Route path="/hostel/rooms" component={HostelRooms} />
      <Route path="/hostel/residents" component={HostelResidents} />
      <Route path="/hostel/fees" component={HostelFees} />
      <Route path="/hostel/reports" component={HostelReports} />

      <Route path="/reports/dashboard" component={ReportsDashboard} />

      <Route path="/parent/dashboard" component={ParentDashboard} />
      <Route path="/parent/messages" component={ParentMessages} />
      <Route path="/parent/notifications" component={ParentNotifications} />
      <Route path="/parent/change-password" component={ParentChangePassword} />
      <Route path="/curriculum/parent-accounts" component={CurriculumParentAccounts} />
      <Route path="/curriculum/parent-inbox" component={CurriculumParentInbox} />
      <Route path="/curriculum/broadcast" component={CurriculumBroadcast} />

      <Route path="/staff/dashboard" component={StaffDashboard} />
      <Route path="/staff/profile" component={StaffProfile} />
      <Route path="/staff/attendance" component={StaffAttendance} />
      <Route path="/staff/salary" component={StaffSalary} />
      <Route path="/staff/documents" component={StaffDocuments} />
      <Route path="/staff/leaves" component={StaffLeaves} />

      <Route path="/careers" component={CareersPage} />
      <Route path="/careers/:id" component={CareersApply} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <PWAInstallPrompt />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
