import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import { authenticateToken } from "../middleware/auth";
import { db, isDBConnected } from "../db";
import {
  moduleUsers,
  adminPermissionsTable,
  branchesTable,
  moduleUserCredentials,
  insertApplicantSchema,
  type ModuleType,
} from "@shared/schema";
import {
  asyncHandler,
  loginLimiter,
  passwordChangeLimiter,
  publicSubmissionLimiter,
} from "../lib/route-helpers";
import { eq } from "drizzle-orm";

export function registerAuthRoutes(app: Express) {
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, db: isDBConnected() });
  });

  app.get("/api/auth/my-permissions", authenticateToken, asyncHandler(async (req, res) => {
    const user = (req as any).user;
    if (!user?.userId) return res.json({ permissions: null });

    const userId = parseInt(String(user.userId));
    if (isNaN(userId)) return res.json({ permissions: null });

    const rows = await db.select().from(adminPermissionsTable).where(eq(adminPermissionsTable.moduleUserId, userId));
    if (rows.length === 0) return res.json({ permissions: null });
    return res.json({ permissions: rows[0].permissions });
  }));

  app.get("/api/public/vacancies", async (_req, res) => {
    try {
      const vacancies = await storage.getVacancies();
      res.json(vacancies);
    } catch (error) {
      console.error("Error fetching public vacancies:", error);
      res.status(500).json({ error: "Failed to fetch vacancies" });
    }
  });

  app.get("/api/public/vacancies/:id", async (req, res) => {
    try {
      const vacancy = await storage.getVacancy(req.params.id);
      if (!vacancy) return res.status(404).json({ error: "Vacancy not found" });
      res.json(vacancy);
    } catch (error) {
      console.error("Error fetching vacancy:", error);
      res.status(500).json({ error: "Failed to fetch vacancy" });
    }
  });

  app.post("/api/public/applications", publicSubmissionLimiter, async (req, res) => {
    try {
      const parsed = insertApplicantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors });
      }
      const vacancy = await storage.getVacancy(parsed.data.vacancyId);
      if (!vacancy) {
        return res.status(404).json({ error: "Vacancy not found" });
      }
      if (vacancy.status !== "Open") {
        return res.status(400).json({ error: "This vacancy is no longer accepting applications" });
      }
      const applicant = await storage.createApplicant(parsed.data);
      res.status(201).json(applicant);
    } catch (error) {
      console.error("Error submitting application:", error);
      res.status(500).json({ error: "Failed to submit application" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    const { email, password, module } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!module) {
      return res.status(400).json({ error: "Module is required" });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET environment variable is not set");
      return res.status(500).json({ error: "Server configuration error" });
    }
    try {
      const moduleType = module as ModuleType;
      const defaultCreds = moduleUserCredentials[moduleType];
      if (!defaultCreds) {
        return res.status(400).json({ error: "Invalid module" });
      }
      const [dbUser] = await db.select().from(moduleUsers).where(eq(moduleUsers.module, moduleType));
      if (dbUser) {
        if (email.toLowerCase() !== dbUser.email.toLowerCase()) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValidPassword = await bcrypt.compare(password, dbUser.passwordHash);
        if (!isValidPassword) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const branchId = dbUser.branchId || 1;
        let schoolId = 1;
        if (dbUser.branchId) {
          const [branch] = await db.select({ schoolId: branchesTable.schoolId }).from(branchesTable).where(eq(branchesTable.id, dbUser.branchId));
          if (branch?.schoolId) schoolId = branch.schoolId;
        }
        const token = jwt.sign(
          { userId: String(dbUser.id), email: dbUser.email, role: dbUser.role, module: moduleType, branchId, schoolId },
          jwtSecret,
          { expiresIn: "3d" }
        );
        return res.json({
          success: true, token, module: moduleType,
          user: { email: dbUser.email, role: dbUser.role, name: dbUser.name },
        });
      }
      if (email.toLowerCase() === defaultCreds.email.toLowerCase() && password === defaultCreds.password) {
        const token = jwt.sign(
          { userId: `${moduleType}-admin`, email: defaultCreds.email, role: defaultCreds.role, module: moduleType, branchId: 1, schoolId: 1 },
          jwtSecret,
          { expiresIn: "3d" }
        );
        return res.json({
          success: true, token, module: moduleType,
          user: { email: defaultCreds.email, role: defaultCreds.role, name: defaultCreds.name },
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ email: req.user.email, role: req.user.role });
  });

  app.post("/api/auth/change-password", passwordChangeLimiter, authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const moduleType = req.user.module as ModuleType;
    const defaultCreds = moduleUserCredentials[moduleType];
    if (!defaultCreds) {
      return res.status(400).json({ error: "Invalid module" });
    }
    try {
      const [dbUser] = await db.select().from(moduleUsers).where(eq(moduleUsers.module, moduleType));
      let isValidCurrentPassword = false;
      if (dbUser) {
        isValidCurrentPassword = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      } else {
        isValidCurrentPassword = currentPassword === defaultCreds.password;
      }
      if (!isValidCurrentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      if (dbUser) {
        await db.update(moduleUsers).set({ passwordHash: newPasswordHash }).where(eq(moduleUsers.id, dbUser.id));
      } else {
        await db.insert(moduleUsers).values({
          module: moduleType,
          email: defaultCreds.email,
          passwordHash: newPasswordHash,
          name: defaultCreds.name,
          role: defaultCreds.role,
        });
      }
      return res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}
