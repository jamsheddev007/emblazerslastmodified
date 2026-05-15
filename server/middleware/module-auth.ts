import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type ModuleType } from "@shared/schema";

interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  module: ModuleType;
  staffId?: string;
  studentId?: string;
  className?: string;
  section?: string;
  branchId?: number;
  schoolId?: number;
}

const allModules: ModuleType[] = ["student", "hr", "fee", "payroll", "finance", "attendance", "timetable", "datesheet", "curriculum", "pos", "library", "transport", "hostel", "parent"];

const routeToModulesMap: Record<string, ModuleType[]> = {
  "/api/students": ["student", "fee", "attendance", "hostel", "transport", "library", "curriculum"],
  "/api/students/promotion-preview": ["student"],
  "/api/students/promote": ["student"],
  "/api/students/graduate": ["student"],
  "/api/staff": ["hr", "payroll", "attendance", "timetable", "library", "curriculum"],
  "/api/vacancies": ["hr"],
  "/api/applicants": ["hr"],
  "/api/fee-vouchers": ["fee"],
  "/api/payrolls": ["hr", "finance"],
  "/api/payrolls/attendance-preview": ["hr", "finance"],
  "/api/accounts": ["finance"],
  "/api/finance-vouchers": ["finance"],
  "/api/attendance-records": ["attendance"],
  "/api/attendance/summary": ["attendance"],
  "/api/attendance/report": ["attendance"],
  "/api/timetable/assigned-teachers": ["timetable"],
  "/api/timetables": ["timetable"],
  "/api/date-sheets": ["datesheet", "curriculum"],
  "/api/curriculums": ["curriculum"],
  "/api/exams": ["datesheet", "curriculum"],
  "/api/results": ["datesheet", "curriculum"],
  "/api/exam-results": ["datesheet", "curriculum"],
  "/api/student-reports": ["student"],
  "/api/report-card": ["student", "curriculum", "datesheet"],
  "/api/report-card-settings": ["curriculum"],
  "/api/pos-items": ["pos"],
  "/api/sales": ["pos"],
  "/api/books": ["library"],
  "/api/library-members": ["library"],
  "/api/book-issues": ["library"],
  "/api/book-categories": ["library"],
  "/api/library/statistics": ["library"],
  "/api/library/search-students": ["library"],
  "/api/library/search-staff": ["library"],
  "/api/routes": ["transport"],
  "/api/vehicles": ["transport"],
  "/api/drivers": ["transport"],
  "/api/student-transports": ["transport"],
  "/api/hostel-rooms": ["hostel"],
  "/api/hostel-residents": ["hostel"],
  "/api/hostel-fees": ["hostel"],
  "/api/questions": ["curriculum"],
  "/api/quizzes": ["curriculum"],
  "/api/quiz-attempts": ["curriculum"],
  "/api/notifications": allModules,
  "/api/notifications/fee-broadcast": ["fee"],
  "/api/notifications/fee-broadcast-preview": ["fee"],
  "/api/notifications/fee-broadcast-history": ["fee"],
  "/api/notifications/general-broadcast": ["curriculum"],
  "/api/notifications/general-broadcast-preview": ["curriculum"],
  "/api/notifications/general-broadcast-history": ["curriculum"],
  "/api/activity-logs": allModules,
  "/api/bulk/students": ["student"],
  "/api/bulk/fee-vouchers": ["fee"],
  "/api/bulk/results": ["datesheet", "curriculum"],
  "/api/fee-structures": ["fee", "finance"],
  "/api/discount-rules": ["fee", "finance"],
  "/api/late-fee-rules": ["fee", "finance"],
  "/api/installment-plans": ["fee", "finance"],
  "/api/certificates": ["student"],
  "/api/messages": allModules,
  "/api/teacher/messages": ["curriculum"],
  "/api/teachers": allModules,
  "/api/leave-applications": ["hr"],
  "/api/staff-portal/leave-applications": ["hr"],
  "/api/challans": ["fee", "finance", "parent"],
  "/api/challans/bulk": ["fee"],
  "/api/challans/bulk-preview": ["fee"],
  "/api/payments": ["fee", "finance"],
  "/api/vendors": ["finance"],
  "/api/expenses": ["finance"],
  "/api/chart-of-accounts": ["finance"],
  "/api/ledger-entries": ["finance"],
  "/api/journal-entries": ["finance"],
  "/api/finance/dashboard": ["finance"],
  "/api/finance/reports": ["finance"],
  "/api/assets": ["finance"],
  "/api/assets/summary": ["finance"],
  "/api/fee/defaulters": ["fee", "finance"],
  "/api/parent/children": ["parent"],
  "/api/parent/dashboard": ["parent"],
  "/api/parent/messages": ["parent"],
  "/api/parent/notifications": ["parent"],
  "/api/parent/change-password": ["parent"],
  "/api/parent/accounts": ["curriculum"],
  "/api/parent/links": ["curriculum"],
  "/api/curriculum/staff-teachers": ["curriculum"],
  "/api/curriculum/teacher-assignments": ["curriculum"],
  "/api/curriculum/student-accounts": ["curriculum"],
  "/api/curriculum/quiz-overview": ["curriculum"],
  "/api/curriculum/published-content": ["curriculum"],
  "/api/curriculum/published-quizzes": ["curriculum"],
  "/api/curriculum/parent-inbox": ["curriculum"],
  "/api/teacher/my-assignments": ["curriculum"],
  "/api/teacher/content": ["curriculum"],
  "/api/teacher/quizzes": ["curriculum"],
  "/api/teacher/timetable": ["curriculum"],
  "/api/teacher/change-password": ["curriculum"],
  "/api/student-portal/change-password": ["curriculum"],
  "/api/student-portal/dashboard": ["curriculum"],
  "/api/student-portal/content": ["curriculum"],
  "/api/student-portal/quizzes": ["curriculum"],
  "/api/student-portal/results": ["curriculum"],
  "/api/student-portal/fees": ["curriculum"],
  "/api/student-portal/attendance": ["curriculum"],
  "/api/student-portal/timetable": ["curriculum"],
  "/api/student-portal/id-card": ["curriculum"],
  "/api/homework": ["curriculum"],
  "/api/teacher/homework": ["curriculum"],
  "/api/student-portal/homework": ["curriculum"],
  "/api/homework/submissions": ["curriculum"],
  "/api/staff-portal/dashboard": ["hr"],
  "/api/staff-portal/profile": ["hr"],
  "/api/staff-portal/attendance": ["hr"],
  "/api/staff-portal/salary": ["hr"],
  "/api/staff-portal/documents": ["hr"],
};

const publicRoutes = [
  "/api/health",
  "/api/auth/login",
  "/api/public/vacancies",
  "/api/public/applications",
  "/api/teacher/login",
  "/api/student-portal/login",
  "/api/staff-portal/login",
  "/api/parent/login",
];

function getBaseRoute(path: string): string {
  const parts = path.split("/").filter(p => p);

  if (parts[1] === "bulk") {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "library" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "timetable" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "attendance" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "finance" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "fee" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "curriculum" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "teacher" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "student-portal" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "staff-portal" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "parent" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  if (parts[1] === "notifications" && parts.length > 2) {
    return "/" + parts.slice(0, 3).join("/");
  }

  // For students and staff, preserve named sub-paths (promote, graduate, etc.)
  // so they are matched against the narrower route-map entries.
  // Only collapse numeric-ID segments back to the base route.
  if (parts[1] === "students" && parts.length > 2) {
    const sub = parts[2];
    if (!/^\d+$/.test(sub)) {
      return "/" + parts.slice(0, 3).join("/");
    }
    return "/api/students";
  }

  if (parts[1] === "staff" && parts.length > 2) {
    const sub = parts[2];
    if (!/^\d+$/.test(sub)) {
      return "/" + parts.slice(0, 3).join("/");
    }
    return "/api/staff";
  }

  return "/" + parts.slice(0, 2).join("/");
}

export function requireCurriculumAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.module !== "curriculum" || (user.role && user.role !== "admin")) {
    return res.status(403).json({ error: "Curriculum admin access required" });
  }
  next();
}

export function requireStudentModuleWrite(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.module !== "student" || user.role !== "admin") {
    return res.status(403).json({ error: "Only student module administrators can modify student records" });
  }
  next();
}

export function requireHrModuleWrite(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.module !== "hr" || user.role !== "admin") {
    return res.status(403).json({ error: "Only HR module administrators can modify staff records" });
  }
  next();
}

export function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.role !== "teacher" || !user.staffId) {
    return res.status(403).json({ error: "Teacher access required" });
  }
  next();
}

export function requireStudent(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) return res.status(401).json({ error: "Authentication required" });
  if (user.role !== "student" || !user.studentId) {
    return res.status(403).json({ error: "Student access required" });
  }
  next();
}

export function moduleAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.path.startsWith("/api")) {
    return next();
  }

  if (req.path === "/api/super" || req.path.startsWith("/api/super/")) {
    return next();
  }

  if (publicRoutes.some(route => req.path === route || req.path.startsWith(route + "/"))) {
    return next();
  }

  if (req.path === "/api/auth/me" || req.path === "/api/auth/change-password" || req.path === "/api/auth/my-permissions") {
    return next();
  }

  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as AuthPayload;
    req.user = decoded;

    const baseRoute = getBaseRoute(req.path);
    const allowedModules = routeToModulesMap[baseRoute];

    if (!allowedModules) {
      console.warn(`[Security] Unmapped route accessed: ${req.path} by module ${decoded.module}`);
      return res.status(403).json({
        error: "Access denied: This resource is not accessible"
      });
    }

    if (!allowedModules.includes(decoded.module)) {
      return res.status(403).json({
        error: "Access denied: You do not have permission to access this resource"
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
