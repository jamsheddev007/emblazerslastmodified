import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type ModuleType } from "@shared/schema";
import { db } from "../db";
import { schoolsTable } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  module: ModuleType;
  branchId?: number;
  schoolId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
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
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireModule(...allowedModules: ModuleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedModules.includes(req.user.module)) {
      return res.status(403).json({ 
        error: "Access denied: You do not have permission to access this resource"
      });
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

interface CacheEntry {
  expiryDate: string | null;
  fetchedAt: number;
}

const subscriptionCache = new Map<number, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
  if (req.path.startsWith("/super")) return next();

  const schoolId = req.user?.schoolId;
  if (!schoolId) return next();

  try {
    const now = Date.now();
    let cached = subscriptionCache.get(schoolId);

    if (!cached || now - cached.fetchedAt > CACHE_TTL_MS) {
      const [school] = await db.select({ expiryDate: schoolsTable.expiryDate }).from(schoolsTable).where(eq(schoolsTable.id, schoolId));
      cached = { expiryDate: school?.expiryDate ?? null, fetchedAt: now };
      subscriptionCache.set(schoolId, cached);
    }

    if (cached.expiryDate) {
      const today = new Date().toISOString().split("T")[0];
      if (cached.expiryDate < today) {
        return res.status(403).json({ error: "School subscription expired. Contact Super Admin." });
      }
    }

    next();
  } catch {
    next();
  }
}
