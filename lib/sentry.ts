import * as Sentry from "@sentry/node";
import { type Express } from "express";

export function initSentry(app: Express) {
  if (!process.env.SENTRY_DSN) {
    console.warn("SENTRY_DSN not provided, skipping Sentry initialization");
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    beforeSend(event) {
      // Filter out health check errors to reduce noise
      if (event.request?.url?.includes("/health")) {
        return null;
      }
      return event;
    },

    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new Sentry.Integrations.OnUnhandledRejection({
        mode: "warn",
      }),
    ],
  });

  // RequestHandler creates a separate execution context using domains
  app.use(Sentry.Handlers.requestHandler());

  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());
}

export function setupSentryErrorHandler(app: Express) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  // Optional fallthrough error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  });
}

export { Sentry };
