import { type Express } from "express";
import { VibeCodeGitHubApp, type GitHubAppConfig } from "../lib/github-app.js";
import { logger } from "../lib/logger.js";

export function setupGitHubRoutes(app: Express) {
  // Verify GitHub App environment variables
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!appId || !privateKey || !webhookSecret) {
    logger.warn("GitHub App not configured - missing environment variables");

    // Add a status endpoint to show configuration status
    app.get("/github/status", (req, res) => {
      res.json({
        configured: false,
        missing: {
          appId: !appId,
          privateKey: !privateKey,
          webhookSecret: !webhookSecret,
        },
        instructions:
          "Set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_WEBHOOK_SECRET environment variables",
      });
    });

    return;
  }

  try {
    // Initialize GitHub App
    const config: GitHubAppConfig = {
      appId,
      privateKey: privateKey.replace(/\\n/g, "\n"), // Handle escaped newlines
      webhookSecret,
      slackWebhookUrl,
    };

    const githubApp = new VibeCodeGitHubApp(config);

    // Setup webhook endpoint
    app.use("/github/webhook", githubApp.getWebhookMiddleware());

    // GitHub App status endpoint
    app.get("/github/status", (req, res) => {
      res.json({
        configured: true,
        appId: appId,
        webhookUrl: "https://www.vibecode.space/github/webhook",
        features: [
          "Deployment monitoring",
          "Auto-fix PR creation",
          "Issue categorization",
          "Build failure analysis",
          "Slack notifications",
        ],
        status: "active",
      });
    });

    // GitHub App information endpoint
    app.get("/github/info", async (req, res) => {
      try {
        // This would normally show app installations and repositories
        res.json({
          app: {
            name: "VibeCode Monitor Bot",
            description:
              "Intelligent monitoring and auto-fixing for VibeCode applications",
            homepage: "https://www.vibecode.space",
            permissions: {
              contents: "write",
              issues: "write",
              pullRequests: "write",
              checks: "read",
              deployments: "read",
            },
          },
          webhookEvents: [
            "deployment_status",
            "push",
            "issues",
            "check_run",
            "workflow_run",
          ],
        });
      } catch (error) {
        logger.error("Error getting GitHub App info", { error });
        res.status(500).json({ error: "Failed to get app info" });
      }
    });

    // Manual trigger endpoints for testing
    app.post("/github/test/deployment-failure", async (req, res) => {
      try {
        // Simulate a deployment failure for testing
        const mockPayload = {
          deployment_status: {
            state: "failure",
            environment: "production",
            description: "Build failed: TypeScript compilation errors",
            target_url: "https://dashboard.render.com/logs",
            log_url: "https://dashboard.render.com/logs",
          },
          repository: {
            name: "vibeCodeSpace",
            owner: { login: "Mattjhagen" },
            full_name: "Mattjhagen/vibeCodeSpace",
          },
        };

        logger.info("Manual deployment failure test triggered");
        res.json({
          message: "Deployment failure test triggered",
          payload: mockPayload,
        });
      } catch (error) {
        logger.error("Error in deployment failure test", { error });
        res.status(500).json({ error: "Test failed" });
      }
    });

    app.post("/github/test/auto-fix", async (req, res) => {
      try {
        // Test auto-fix PR creation
        logger.info("Manual auto-fix test triggered");
        res.json({
          message:
            "Auto-fix test would create a PR with formatting and linting fixes",
          note: "This is a simulation - actual PR creation requires push events",
        });
      } catch (error) {
        logger.error("Error in auto-fix test", { error });
        res.status(500).json({ error: "Test failed" });
      }
    });

    logger.info("GitHub App routes configured successfully", {
      appId,
      webhookUrl: "https://www.vibecode.space/github/webhook",
    });
  } catch (error) {
    logger.error("Failed to initialize GitHub App", { error });

    // Add error status endpoint
    app.get("/github/status", (req, res) => {
      res.status(500).json({
        configured: false,
        error: "Failed to initialize GitHub App",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    });
  }
}
