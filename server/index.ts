import "./env";

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { connectDB } from "./db";
import { moduleAuthMiddleware } from "./middleware/module-auth";
import { checkSubscription } from "./middleware/auth";
import superAdminRoutes from "./superAdminRoutes";

const REQUIRED_ENV_VARS = [
  "JWT_SECRET",
  "SUPER_ADMIN_EMAIL",
];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (!process.env.SUPER_ADMIN_PASSWORD_HASH && !process.env.SUPER_ADMIN_PASSWORD) {
  console.error("FATAL: Missing required environment variable: SUPER_ADMIN_PASSWORD_HASH or SUPER_ADMIN_PASSWORD");
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  credentials: false,
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(moduleAuthMiddleware);

app.use("/api/super", superAdminRoutes);

app.use("/api", checkSubscription);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const sanitized = { ...capturedJsonResponse };
        const sensitiveKeys = ["token", "passwordHash", "password_hash", "password", "newPasswordHash"];
        for (const key of sensitiveKeys) {
          if (key in sanitized) sanitized[key] = "[REDACTED]";
        }
        if (sanitized.user && typeof sanitized.user === "object") {
          const userCopy = { ...sanitized.user };
          for (const key of sensitiveKeys) {
            if (key in userCopy) (userCopy as any)[key] = "[REDACTED]";
          }
          sanitized.user = userCopy;
        }
        const logBody = JSON.stringify(sanitized);
        logLine += ` :: ${logBody.length > 500 ? logBody.substring(0, 500) + "...[truncated]" : logBody}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await connectDB();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
