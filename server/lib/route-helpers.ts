import rateLimit from "express-rate-limit";

export const asyncHandler = (fn: (req: any, res: any, next?: any) => Promise<any>) =>
  (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
      console.error(`[API Error] ${req.method} ${req.path}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || "Internal server error" });
      }
    });
  };

export function getBranchId(req: any): number {
  return req.user?.branchId || 1;
}

export function getSchoolId(req: any): number {
  return req.user?.schoolId || 1;
}

export function filterByBranch<T extends Record<string, any>>(items: T[], branchId: number): T[] {
  return items.filter(item => item.branchId === branchId || item.branchId === null || item.branchId === undefined);
}

export function verifyBranch(item: any, branchId: number): boolean {
  return item && (item.branchId === branchId || item.branchId === null || item.branchId === undefined);
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many password change attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
