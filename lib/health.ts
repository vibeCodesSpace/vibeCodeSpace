import { type Express, type Request, type Response } from "express";
import { logger } from "./logger.js";

interface HealthCheck {
  name: string;
  check: () => Promise<{
    status: "healthy" | "unhealthy";
    message?: string;
    details?: any;
  }>;
}

const healthChecks: HealthCheck[] = [
  {
    name: "database",
    check: async () => {
      try {
        // Add your database health check here
        // For now, just check if DATABASE_URL exists
        if (process.env.DATABASE_URL) {
          return { status: "healthy", message: "Database URL configured" };
        }
        return { status: "unhealthy", message: "Database URL not configured" };
      } catch (error) {
        return {
          status: "unhealthy",
          message: "Database check failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },
  {
    name: "memory",
    check: async () => {
      const usage = process.memoryUsage();
      const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

      // Alert if using more than 400MB
      if (heapUsedMB > 400) {
        return {
          status: "unhealthy",
          message: `High memory usage: ${heapUsedMB}MB`,
          details: { heapUsedMB, heapTotalMB },
        };
      }

      return {
        status: "healthy",
        message: `Memory usage normal: ${heapUsedMB}MB`,
        details: { heapUsedMB, heapTotalMB },
      };
    },
  },
  {
    name: "disk_space",
    check: async () => {
      try {
        const fs = await import("fs/promises");
        const stats = await fs.stat("./");
        return {
          status: "healthy",
          message: "Disk accessible",
          details: { directory: "./" },
        };
      } catch (error) {
        return {
          status: "unhealthy",
          message: "Disk check failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
  },
];

export function setupHealthChecks(app: Express) {
  // Basic health check endpoint for Render
  app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "unknown",
    });
  });

  // Detailed health check endpoint
  app.get("/health/detailed", async (req: Request, res: Response) => {
    const results: Record<string, any> = {};
    let overallStatus = "healthy";

    try {
      await Promise.all(
        healthChecks.map(async (check) => {
          try {
            const result = await check.check();
            results[check.name] = result;

            if (result.status === "unhealthy") {
              overallStatus = "unhealthy";
            }
          } catch (error) {
            results[check.name] = {
              status: "unhealthy",
              message: "Health check failed",
              error: error instanceof Error ? error.message : String(error),
            };
            overallStatus = "unhealthy";
          }
        }),
      );

      const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "unknown",
        checks: results,
      };

      // Log unhealthy status
      if (overallStatus === "unhealthy") {
        logger.warn("Health check failed", response);
      }

      res.status(overallStatus === "healthy" ? 200 : 503).json(response);
    } catch (error) {
      logger.error("Health check endpoint error", { error });
      res.status(500).json({
        status: "error",
        message: "Health check failed",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Readiness check (for Kubernetes-style deployments)
  app.get("/ready", (req: Request, res: Response) => {
    // Add any readiness checks here
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  });

  // Liveness check (for Kubernetes-style deployments)
  app.get("/live", (req: Request, res: Response) => {
    res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}
