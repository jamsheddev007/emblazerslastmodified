import type { Express } from "express";
import { type Server } from "http";
import { isDBConnected } from "./db";
import { permissionCheckMiddleware } from "./permission-check";
import { broadcastNotification } from "./lib/websocket";

import { registerAuthRoutes } from "./routes/auth";
import { registerStudentRoutes } from "./routes/students";
import { registerHrRoutes } from "./routes/hr";
import { registerFinanceRoutes } from "./routes/finance";
import { registerFeesRoutes } from "./routes/fees";
import { registerAttendanceRoutes } from "./routes/attendance";
import { registerTimetableRoutes } from "./routes/timetable";
import { registerCurriculumRoutes } from "./routes/curriculum";
import { registerStudentPortalRoutes } from "./routes/student-portal";
import { registerParentPortalRoutes } from "./routes/parent-portal";
import { registerTransportRoutes } from "./routes/transport";
import { registerHostelRoutes } from "./routes/hostel";
import { registerPosRoutes } from "./routes/pos";
import { registerLibraryRoutes } from "./routes/library";
import { registerSharedRoutes, setupWebSocket } from "./routes/shared";

export { broadcastNotification };

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.set("trust proxy", 1);

  app.use("/api", permissionCheckMiddleware);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, db: isDBConnected() });
  });

  registerAuthRoutes(app);
  registerStudentRoutes(app);
  registerHrRoutes(app);
  registerFinanceRoutes(app);
  registerFeesRoutes(app);
  registerAttendanceRoutes(app);
  registerTimetableRoutes(app);
  registerCurriculumRoutes(app);
  registerStudentPortalRoutes(app);
  registerParentPortalRoutes(app);
  registerTransportRoutes(app);
  registerHostelRoutes(app);
  registerPosRoutes(app);
  registerLibraryRoutes(app);
  registerSharedRoutes(app);
  setupWebSocket(httpServer);

  return httpServer;
}
