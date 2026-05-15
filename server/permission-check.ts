import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { adminPermissionsTable } from "@shared/schema";
import { eq } from "drizzle-orm";

const MODULE_FEATURES: Record<string, string[]> = {
  student: ["students", "alumni", "reports", "bulk_import"],
  hr: ["staff", "vacancies", "applicants", "reports"],
  fee: ["structures", "challans", "payments", "reports"],
  payroll: ["generate", "mark_paid", "reports"],
  finance: ["accounts", "vouchers", "expenses", "vendors", "reports"],
  attendance: ["mark", "edit", "delete", "reports"],
  library: ["books", "issue_return", "reports"],
  transport: ["routes", "vehicles", "drivers", "allocation"],
  hostel: ["rooms", "residents", "fees", "reports"],
  pos: ["items", "sales", "reports"],
  timetable: ["slots", "schedules", "reports"],
  datesheet: ["exams", "schedules", "reports"],
  curriculum: ["subjects", "content", "quizzes", "results", "reports"],
};

const ACTIONS = ["view", "create", "edit", "delete", "export", "bulk_import"] as const;
type Action = typeof ACTIONS[number];

const METHOD_TO_ACTION: Record<string, Action> = {
  GET: "view",
  POST: "create",
  PUT: "edit",
  PATCH: "edit",
  DELETE: "delete",
};

const ROUTE_FEATURE_MAP: Record<string, string> = {
  "/api/students": "students",
  "/api/alumni": "alumni",
  "/api/staff": "staff",
  "/api/vacancies": "vacancies",
  "/api/applicants": "applicants",
  "/api/fee-structures": "structures",
  "/api/challans": "challans",
  "/api/payments": "payments",
  "/api/fee-vouchers": "structures",
  "/api/discount-rules": "structures",
  "/api/late-fee-rules": "structures",
  "/api/installment-plans": "structures",
  "/api/payroll": "generate",
  "/api/vendors": "vendors",
  "/api/expenses": "expenses",
  "/api/chart-of-accounts": "accounts",
  "/api/ledger-entries": "vouchers",
  "/api/journal-entries": "vouchers",
  "/api/attendance": "mark",
  "/api/attendance/records": "mark",
  "/api/attendance/bulk": "mark",
  "/api/library/books": "books",
  "/api/library/issue": "issue_return",
  "/api/library/return": "issue_return",
  "/api/transport-routes": "routes",
  "/api/vehicles": "vehicles",
  "/api/drivers": "drivers",
  "/api/transport-allocations": "allocation",
  "/api/hostel-rooms": "rooms",
  "/api/hostel-residents": "residents",
  "/api/hostel-fees": "fees",
  "/api/pos-items": "items",
  "/api/pos-sales": "sales",
  "/api/timetable-slots": "slots",
  "/api/timetables": "schedules",
  "/api/exams": "exams",
  "/api/results": "results",
  "/api/subjects": "subjects",
  "/api/bulk/students": "bulk_import",
  "/api/bulk/fee-vouchers": "bulk_import",
  "/api/bulk/results": "bulk_import",
};

const EXPORT_ROUTES = [
  "/api/finance/reports",
  "/api/finance/dashboard",
];

const permissionsCache = new Map<number, { permissions: any; expiry: number }>();
const CACHE_TTL = 60_000;

async function getPermissions(moduleUserId: number): Promise<any | null> {
  const cached = permissionsCache.get(moduleUserId);
  if (cached && cached.expiry > Date.now()) return cached.permissions;

  const rows = await db.select().from(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, moduleUserId));
  if (rows.length === 0) return null;

  const perms = rows[0].permissions;
  permissionsCache.set(moduleUserId, { permissions: perms, expiry: Date.now() + CACHE_TTL });
  return perms;
}

export function clearPermissionsCache(moduleUserId?: number) {
  if (moduleUserId) permissionsCache.delete(moduleUserId);
  else permissionsCache.clear();
}

function getFeatureFromPath(path: string): string | null {
  for (const [route, feature] of Object.entries(ROUTE_FEATURE_MAP)) {
    if (path === route || path.startsWith(route + "/")) return feature;
  }
  return null;
}

function getActionFromMethod(method: string, path: string): Action {
  if (EXPORT_ROUTES.some(r => path.startsWith(r))) return "export";
  if (path.includes("/bulk/") || path.includes("/bulk-")) return "bulk_import";
  return METHOD_TO_ACTION[method] || "view";
}

export function checkPermission(feature?: string, action?: Action) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !user.userId) return next();

    if (user.role === "teacher" || user.role === "student" || user.role === "staff" || user.role === "parent") {
      return next();
    }

    const permissions = await getPermissions(user.userId);
    if (!permissions) return next();

    const feat = feature || getFeatureFromPath(req.path);
    const act = action || getActionFromMethod(req.method, req.path);

    if (!feat) return next();

    const featurePerms = permissions[feat];
    if (!featurePerms) return next();

    if (featurePerms[act] === false) {
      return res.status(403).json({
        error: "Permission denied",
        message: `You don't have permission to ${act} ${feat.replace(/_/g, " ")} records. Contact your Super Admin.`,
        required_permission: `${feat}.${act}`,
      });
    }

    next();
  };
}

export function permissionCheckMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || !user.userId) return next();

  if (user.role === "teacher" || user.role === "student" || user.role === "staff" || user.role === "parent") {
    return next();
  }

  const fullPath = req.originalUrl?.split("?")[0] || req.path;

  const feat = getFeatureFromPath(fullPath);
  if (!feat) return next();

  const act = getActionFromMethod(req.method, fullPath);
  const userId = parseInt(String(user.userId));
  if (isNaN(userId)) return next();

  getPermissions(userId).then(permissions => {
    if (!permissions) return next();

    const featurePerms = permissions[feat];
    if (!featurePerms) return next();

    if (featurePerms[act] === false) {
      return res.status(403).json({
        error: "Permission denied",
        message: `You don't have permission to ${act} ${feat.replace(/_/g, " ")} records. Contact your Super Admin.`,
        required_permission: `${feat}.${act}`,
      });
    }

    next();
  }).catch(() => next());
}

export function getModuleFeatures(module: string): string[] {
  return MODULE_FEATURES[module] || [];
}

export function getAllActions(): readonly string[] {
  return ACTIONS;
}

export function getDefaultPermissions(module: string, preset: string = "full_access"): Record<string, Record<string, boolean>> {
  const features = MODULE_FEATURES[module] || [];
  const perms: Record<string, Record<string, boolean>> = {};

  for (const feature of features) {
    const isReport = feature === "reports";
    const isBulk = feature === "bulk_import";
    const reportActions = ["view", "export"];
    const bulkActions = ["view", "bulk_import"];
    const normalActions = ["view", "create", "edit", "delete", "export"];
    const actions = isReport ? reportActions : isBulk ? bulkActions : normalActions;

    perms[feature] = {};
    for (const action of actions) {
      switch (preset) {
        case "full_access":
          perms[feature][action] = true;
          break;
        case "view_only":
          perms[feature][action] = action === "view";
          break;
        case "no_delete":
          perms[feature][action] = action !== "delete";
          break;
        case "data_entry":
          perms[feature][action] = ["view", "create", "edit"].includes(action);
          break;
        default:
          perms[feature][action] = true;
      }
    }
  }

  return perms;
}
