import winston from "winston";
import { IncomingWebhook } from "@slack/webhook";

// Slack webhook transport
class SlackTransport extends winston.Transport {
  private webhook: IncomingWebhook | null = null;

  constructor(opts: any) {
    super(opts);

    if (process.env.SLACK_WEBHOOK_URL) {
      this.webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);
    }
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (this.webhook && info.level === "error") {
      const message = {
        text: `🚨 *Error in VibeCode App*`,
        attachments: [
          {
            color: "danger",
            fields: [
              {
                title: "Error Message",
                value: info.message,
                short: false,
              },
              {
                title: "Level",
                value: info.level.toUpperCase(),
                short: true,
              },
              {
                title: "Timestamp",
                value: new Date().toISOString(),
                short: true,
              },
              {
                title: "Environment",
                value: process.env.NODE_ENV || "unknown",
                short: true,
              },
            ],
          },
        ],
      };

      if (info.stack) {
        message.attachments[0].fields.push({
          title: "Stack Trace",
          value: `\`\`\`${info.stack.substring(0, 1000)}\`\`\``,
          short: false,
        });
      }

      this.webhook.send(message).catch((err) => {
        console.error("Failed to send Slack notification:", err);
      });
    }

    callback();
  }
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "vibecode-app" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),

    // File transport for errors
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Slack transport for errors
    new SlackTransport({ level: "error" }),
  ],
});

// Handle uncaught exceptions and rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: "logs/exceptions.log" }),
);

logger.rejections.handle(
  new winston.transports.File({ filename: "logs/rejections.log" }),
);

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? "error" : "info";

    logger.log(level, "HTTP Request", {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
      ip: req.ip,
    });
  });

  next();
};

export default logger;
