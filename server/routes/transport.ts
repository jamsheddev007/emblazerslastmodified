import type { Express } from "express";
import { storage } from "../storage";
import {
  asyncHandler,
  getBranchId,
  getSchoolId,
  filterByBranch,
  verifyBranch,
} from "../lib/route-helpers";
import {
  insertRouteSchema,
  insertVehicleSchema,
  insertDriverSchema,
  insertStudentTransportSchema,
} from "@shared/schema";
import {
  checkRouteReferences,
  checkVehicleReferences,
} from "../validation";

export function registerTransportRoutes(app: Express) {
  app.get("/api/routes", asyncHandler(async (req, res) => {
    const routes = filterByBranch(await storage.getRoutes(), getBranchId(req));
    res.json(routes);
  }));

  app.get("/api/routes/:id", asyncHandler(async (req, res) => {
    const route = await storage.getRoute(req.params.id);
    if (!route || !verifyBranch(route, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(route);
  }));

  app.post("/api/routes", asyncHandler(async (req, res) => {
    const parsed = insertRouteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const route = await storage.createRoute({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(route);
  }));

  app.patch("/api/routes/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getRoute(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertRouteSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const route = await storage.updateRoute(req.params.id, parsed.data);
    if (!route) return res.status(404).json({ error: "Not found" });
    res.json(route);
  }));

  app.delete("/api/routes/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getRoute(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkRouteReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteRoute(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/vehicles", asyncHandler(async (req, res) => {
    const vehicles = filterByBranch(await storage.getVehicles(), getBranchId(req));
    res.json(vehicles);
  }));

  app.get("/api/vehicles/:id", asyncHandler(async (req, res) => {
    const vehicle = await storage.getVehicle(req.params.id);
    if (!vehicle || !verifyBranch(vehicle, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(vehicle);
  }));

  app.post("/api/vehicles", asyncHandler(async (req, res) => {
    const parsed = insertVehicleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vehicle = await storage.createVehicle({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(vehicle);
  }));

  app.patch("/api/vehicles/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVehicle(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertVehicleSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const vehicle = await storage.updateVehicle(req.params.id, parsed.data);
    if (!vehicle) return res.status(404).json({ error: "Not found" });
    res.json(vehicle);
  }));

  app.delete("/api/vehicles/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getVehicle(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const validation = await checkVehicleReferences(req.params.id);
    if (!validation.canDelete) {
      return res.status(409).json({ error: validation.errorMessage, references: validation.references });
    }
    const deleted = await storage.deleteVehicle(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/drivers", asyncHandler(async (req, res) => {
    const drivers = filterByBranch(await storage.getDrivers(), getBranchId(req));
    res.json(drivers);
  }));

  app.get("/api/drivers/:id", asyncHandler(async (req, res) => {
    const driver = await storage.getDriver(req.params.id);
    if (!driver || !verifyBranch(driver, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(driver);
  }));

  app.post("/api/drivers", asyncHandler(async (req, res) => {
    const parsed = insertDriverSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const driver = await storage.createDriver({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(driver);
  }));

  app.patch("/api/drivers/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDriver(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertDriverSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const driver = await storage.updateDriver(req.params.id, parsed.data);
    if (!driver) return res.status(404).json({ error: "Not found" });
    res.json(driver);
  }));

  app.delete("/api/drivers/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getDriver(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteDriver(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));

  app.get("/api/student-transports", asyncHandler(async (req, res) => {
    const transports = filterByBranch(await storage.getStudentTransports(), getBranchId(req));
    res.json(transports);
  }));

  app.get("/api/student-transports/:id", asyncHandler(async (req, res) => {
    const transport = await storage.getStudentTransport(req.params.id);
    if (!transport || !verifyBranch(transport, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    res.json(transport);
  }));

  app.post("/api/student-transports", asyncHandler(async (req, res) => {
    const parsed = insertStudentTransportSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const transport = await storage.createStudentTransport({ ...parsed.data, branchId: getBranchId(req), schoolId: getSchoolId(req) });
    res.status(201).json(transport);
  }));

  app.patch("/api/student-transports/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getStudentTransport(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const { id, ...updates } = req.body;
    const parsed = insertStudentTransportSchema.partial().safeParse(updates);
    if (!parsed.success) return res.status(400).json({ error: parsed.error });
    const transport = await storage.updateStudentTransport(req.params.id, parsed.data);
    if (!transport) return res.status(404).json({ error: "Not found" });
    res.json(transport);
  }));

  app.delete("/api/student-transports/:id", asyncHandler(async (req, res) => {
    const existing = await storage.getStudentTransport(req.params.id);
    if (!existing || !verifyBranch(existing, getBranchId(req))) return res.status(404).json({ error: "Not found" });
    const deleted = await storage.deleteStudentTransport(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  }));
}
