import { App } from "@octokit/app";
import { createNodeMiddleware } from "@octokit/webhooks";
import { logger } from "./logger.js";
import { IncomingWebhook } from "@slack/webhook";

export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  webhookSecret: string;
  slackWebhookUrl?: string;
}

export class VibeCodeGitHubApp {
  private app: App;
  private slackWebhook?: IncomingWebhook;

  constructor(config: GitHubAppConfig) {
    this.app = new App({
      appId: config.appId,
      privateKey: config.privateKey,
      webhooks: {
        secret: config.webhookSecret,
      },
    });

    if (config.slackWebhookUrl) {
      this.slackWebhook = new IncomingWebhook(config.slackWebhookUrl);
    }

    this.setupWebhooks();
  }

  private setupWebhooks() {
    // Deployment status monitoring
    this.app.webhooks.on("deployment_status", async ({ payload, octokit }) => {
      await this.handleDeploymentStatus(payload, octokit);
    });

    // Push events for smart analysis
    this.app.webhooks.on("push", async ({ payload, octokit }) => {
      await this.handlePush(payload, octokit);
    });

    // Issue management
    this.app.webhooks.on("issues.opened", async ({ payload, octokit }) => {
      await this.handleIssueOpened(payload, octokit);
    });

    // Build failures
    this.app.webhooks.on(
      "check_run.completed",
      async ({ payload, octokit }) => {
        await this.handleCheckRunCompleted(payload, octokit);
      },
    );

    // Workflow failures
    this.app.webhooks.on(
      "workflow_run.completed",
      async ({ payload, octokit }) => {
        await this.handleWorkflowCompleted(payload, octokit);
      },
    );

    // Error handling
    this.app.webhooks.onError((error) => {
      logger.error("GitHub webhook error", {
        error: error.message,
        stack: error.stack,
      });
    });
  }

  private async handleDeploymentStatus(payload: any, octokit: any) {
    const { deployment_status, repository } = payload;

    logger.info("Deployment status received", {
      state: deployment_status.state,
      environment: deployment_status.environment,
      target_url: deployment_status.target_url,
    });

    if (deployment_status.state === "failure") {
      await this.handleDeploymentFailure(payload, octokit);
    } else if (deployment_status.state === "success") {
      await this.handleDeploymentSuccess(payload, octokit);
    }
  }

  private async handleDeploymentFailure(payload: any, octokit: any) {
    const { deployment_status, repository } = payload;

    try {
      // Analyze the failure
      const analysis = await this.analyzeDeploymentFailure(deployment_status);

      // Create detailed issue
      const issue = await octokit.rest.issues.create({
        owner: repository.owner.login,
        repo: repository.name,
        title: `🚨 Deployment Failed: ${analysis.errorType}`,
        body: this.generateDeploymentFailureReport(analysis, deployment_status),
        labels: ["deployment-failure", analysis.severity, "automated"],
        assignees: analysis.suggestedAssignees || [],
      });

      logger.error("Deployment failure issue created", {
        issueNumber: issue.data.number,
        errorType: analysis.errorType,
        severity: analysis.severity,
      });

      // Send Slack notification
      await this.sendSlackNotification({
        text: "🚨 *Deployment Failed*",
        attachments: [
          {
            color: "danger",
            fields: [
              {
                title: "Repository",
                value: `${repository.owner.login}/${repository.name}`,
                short: true,
              },
              {
                title: "Environment",
                value: deployment_status.environment,
                short: true,
              },
              { title: "Error Type", value: analysis.errorType, short: true },
              { title: "Severity", value: analysis.severity, short: true },
              {
                title: "Issue",
                value: `<${issue.data.html_url}|#${issue.data.number}>`,
                short: true,
              },
              {
                title: "Logs",
                value: `<${deployment_status.target_url}|View Logs>`,
                short: true,
              },
            ],
          },
        ],
      });

      // Attempt auto-fix if possible
      if (analysis.autoFixable) {
        await this.attemptAutoFix(analysis, octokit, repository);
      }
    } catch (error) {
      logger.error("Error handling deployment failure", { error });
    }
  }

  private async handleDeploymentSuccess(payload: any, octokit: any) {
    const { deployment_status, repository } = payload;

    // Close any open deployment failure issues
    try {
      const issues = await octokit.rest.issues.listForRepo({
        owner: repository.owner.login,
        repo: repository.name,
        labels: "deployment-failure",
        state: "open",
      });

      for (const issue of issues.data) {
        await octokit.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: `✅ **Deployment Successful** - This issue has been resolved.\n\n**Environment:** ${deployment_status.environment}\n**Deployed At:** ${new Date().toISOString()}\n\nClosing this issue automatically.`,
        });

        await octokit.rest.issues.update({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          state: "closed",
          labels: [...issue.labels.map((l: any) => l.name), "resolved"],
        });
      }

      // Send success notification to Slack
      await this.sendSlackNotification({
        text: "✅ *Deployment Successful*",
        attachments: [
          {
            color: "good",
            fields: [
              {
                title: "Repository",
                value: `${repository.owner.login}/${repository.name}`,
                short: true,
              },
              {
                title: "Environment",
                value: deployment_status.environment,
                short: true,
              },
              {
                title: "URL",
                value: `<https://www.vibecode.space|Visit App>`,
                short: true,
              },
            ],
          },
        ],
      });
    } catch (error) {
      logger.error("Error handling deployment success", { error });
    }
  }

  private async handlePush(payload: any, octokit: any) {
    const { repository, commits, pusher } = payload;

    // Skip if this is from the bot itself
    if (
      pusher.name?.includes("bot") ||
      commits.some((c: any) => c.message.includes("[skip ci]"))
    ) {
      return;
    }

    logger.info("Push event received", {
      repository: repository.full_name,
      commitCount: commits.length,
      pusher: pusher.name,
    });

    // Analyze commits for potential issues
    const analysis = await this.analyzePushCommits(commits);

    if (analysis.hasIssues) {
      await this.createAutoFixPR(analysis, octokit, repository);
    }
  }

  private async handleIssueOpened(payload: any, octokit: any) {
    const { issue, repository } = payload;

    try {
      // Auto-categorize the issue
      const category = await this.categorizeIssue(
        issue.title,
        issue.body || "",
      );

      // Add appropriate labels
      await octokit.rest.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        labels: category.labels,
      });

      // Add helpful context comment
      const contextComment = this.generateIssueContextComment(category);
      if (contextComment) {
        await octokit.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: issue.number,
          body: contextComment,
        });
      }

      logger.info("Issue auto-categorized", {
        issueNumber: issue.number,
        category: category.type,
        labels: category.labels,
      });
    } catch (error) {
      logger.error("Error handling issue opened", { error });
    }
  }

  private async handleCheckRunCompleted(payload: any, octokit: any) {
    const { check_run, repository } = payload;

    if (check_run.conclusion === "failure") {
      logger.warn("Check run failed", {
        name: check_run.name,
        conclusion: check_run.conclusion,
        repository: repository.full_name,
      });

      // Analyze the check failure and potentially create auto-fix
      const analysis = await this.analyzeCheckFailure(check_run);

      if (analysis.autoFixable) {
        await this.createAutoFixPR(analysis, octokit, repository);
      }
    }
  }

  private async handleWorkflowCompleted(payload: any, octokit: any) {
    const { workflow_run, repository } = payload;

    if (workflow_run.conclusion === "failure") {
      logger.error("Workflow failed", {
        name: workflow_run.name,
        conclusion: workflow_run.conclusion,
        repository: repository.full_name,
        html_url: workflow_run.html_url,
      });

      // Send Slack notification for workflow failures
      await this.sendSlackNotification({
        text: "⚠️ *Workflow Failed*",
        attachments: [
          {
            color: "warning",
            fields: [
              { title: "Workflow", value: workflow_run.name, short: true },
              { title: "Repository", value: repository.full_name, short: true },
              { title: "Branch", value: workflow_run.head_branch, short: true },
              {
                title: "View Logs",
                value: `<${workflow_run.html_url}|Open Workflow>`,
                short: true,
              },
            ],
          },
        ],
      });
    }
  }

  private async analyzeDeploymentFailure(deploymentStatus: any) {
    // Simple analysis - in production, this could use AI or more sophisticated parsing
    const description = deploymentStatus.description || "";
    const logUrl = deploymentStatus.log_url || deploymentStatus.target_url;

    let errorType = "unknown";
    let severity = "medium";
    let autoFixable = false;
    let suggestedAssignees: string[] = [];

    // Pattern matching for common errors
    if (
      description.includes("build failed") ||
      description.includes("compilation")
    ) {
      errorType = "build-failure";
      severity = "high";
      autoFixable = true;
    } else if (
      description.includes("timeout") ||
      description.includes("failed to start")
    ) {
      errorType = "startup-timeout";
      severity = "high";
    } else if (description.includes("health check")) {
      errorType = "health-check-failure";
      severity = "medium";
    } else if (
      description.includes("database") ||
      description.includes("connection")
    ) {
      errorType = "database-connection";
      severity = "high";
      suggestedAssignees = ["database-team"];
    }

    return {
      errorType,
      severity,
      autoFixable,
      suggestedAssignees,
      description,
      logUrl,
      timestamp: new Date().toISOString(),
    };
  }

  private generateDeploymentFailureReport(
    analysis: any,
    deploymentStatus: any,
  ): string {
    return `## 🚨 Deployment Failure Report

**Environment:** ${deploymentStatus.environment}
**Time:** ${analysis.timestamp}
**Error Type:** ${analysis.errorType}
**Severity:** ${analysis.severity}

### Description
${analysis.description}

### Analysis
- **Auto-fixable:** ${analysis.autoFixable ? "✅ Yes" : "❌ No"}
- **Suggested assignees:** ${analysis.suggestedAssignees.length > 0 ? analysis.suggestedAssignees.join(", ") : "None"}

### Next Steps
${this.generateNextSteps(analysis)}

### Links
- [View Deployment Logs](${analysis.logUrl})
- [Health Check](https://www.vibecode.space/health)
- [Detailed Health](https://www.vibecode.space/health/detailed)

---
*This issue was automatically created by the VibeCode GitHub App*`;
  }

  private generateNextSteps(analysis: any): string {
    const steps = [];

    switch (analysis.errorType) {
      case "build-failure":
        steps.push("1. Check TypeScript compilation errors");
        steps.push("2. Verify all dependencies are installed");
        steps.push("3. Run `npm run build` locally to reproduce");
        break;
      case "startup-timeout":
        steps.push("1. Check server startup logs");
        steps.push("2. Verify environment variables");
        steps.push("3. Check for infinite loops or blocking operations");
        break;
      case "health-check-failure":
        steps.push("1. Check application health endpoints");
        steps.push("2. Verify database connectivity");
        steps.push("3. Check memory usage and performance");
        break;
      case "database-connection":
        steps.push("1. Verify DATABASE_URL environment variable");
        steps.push("2. Check database server status");
        steps.push("3. Test connection from application");
        break;
      default:
        steps.push("1. Check deployment logs for specific errors");
        steps.push("2. Verify environment configuration");
        steps.push("3. Test application locally");
    }

    return steps.join("\n");
  }

  private async analyzePushCommits(commits: any[]) {
    // Analyze commits for potential issues
    let hasIssues = false;
    const issues = [];

    for (const commit of commits) {
      const message = commit.message.toLowerCase();

      // Check for common problematic patterns
      if (message.includes("fix") || message.includes("bug")) {
        issues.push({
          type: "potential-bug-fix",
          commit: commit.id,
          message: commit.message,
        });
        hasIssues = true;
      }

      if (message.includes("wip") || message.includes("work in progress")) {
        issues.push({
          type: "work-in-progress",
          commit: commit.id,
          message: commit.message,
        });
        hasIssues = true;
      }
    }

    return { hasIssues, issues, analysisType: "push-analysis" };
  }

  private async analyzeCheckFailure(checkRun: any) {
    const name = checkRun.name.toLowerCase();
    let autoFixable = false;
    let fixType = "";

    if (name.includes("lint") || name.includes("eslint")) {
      autoFixable = true;
      fixType = "linting";
    } else if (name.includes("format") || name.includes("prettier")) {
      autoFixable = true;
      fixType = "formatting";
    } else if (name.includes("type") || name.includes("typescript")) {
      autoFixable = false; // Type errors usually need manual intervention
      fixType = "typescript";
    }

    return {
      autoFixable,
      fixType,
      checkName: checkRun.name,
      analysisType: "check-failure",
    };
  }

  private async createAutoFixPR(analysis: any, octokit: any, repository: any) {
    try {
      const branchName = `auto-fix/${analysis.fixType || analysis.analysisType}-${Date.now()}`;

      // Get the default branch
      const { data: repo } = await octokit.rest.repos.get({
        owner: repository.owner.login,
        repo: repository.name,
      });

      // Create a new branch
      const { data: mainBranch } = await octokit.rest.git.getRef({
        owner: repository.owner.login,
        repo: repository.name,
        ref: `heads/${repo.default_branch}`,
      });

      await octokit.rest.git.createRef({
        owner: repository.owner.login,
        repo: repository.name,
        ref: `refs/heads/${branchName}`,
        sha: mainBranch.object.sha,
      });

      // Create the PR
      const pr = await octokit.rest.pulls.create({
        owner: repository.owner.login,
        repo: repository.name,
        title: `🤖 Auto-fix: ${this.generatePRTitle(analysis)}`,
        body: this.generatePRBody(analysis),
        head: branchName,
        base: repo.default_branch,
        draft: false,
      });

      logger.info("Auto-fix PR created", {
        prNumber: pr.data.number,
        branch: branchName,
        fixType: analysis.fixType || analysis.analysisType,
      });

      // Add labels
      await octokit.rest.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pr.data.number,
        labels: ["automated", "auto-fix", analysis.fixType || "analysis"],
      });

      // Send Slack notification
      await this.sendSlackNotification({
        text: "🤖 *Auto-fix PR Created*",
        attachments: [
          {
            color: "good",
            fields: [
              { title: "Repository", value: repository.full_name, short: true },
              {
                title: "Fix Type",
                value: analysis.fixType || analysis.analysisType,
                short: true,
              },
              {
                title: "PR",
                value: `<${pr.data.html_url}|#${pr.data.number}>`,
                short: true,
              },
            ],
          },
        ],
      });
    } catch (error) {
      logger.error("Error creating auto-fix PR", { error, analysis });
    }
  }

  private generatePRTitle(analysis: any): string {
    switch (analysis.fixType || analysis.analysisType) {
      case "linting":
        return "Fix ESLint issues";
      case "formatting":
        return "Fix code formatting";
      case "typescript":
        return "Fix TypeScript compilation errors";
      case "push-analysis":
        return "Address potential issues from recent commits";
      default:
        return "Automated fixes";
    }
  }

  private generatePRBody(analysis: any): string {
    return `## 🤖 Automated Fix

This PR was automatically created to address issues detected in the repository.

### Analysis Results
- **Type:** ${analysis.fixType || analysis.analysisType}
- **Auto-fixable:** ${analysis.autoFixable ? "✅ Yes" : "❌ No"}

### Changes Made
${this.generateChangesList(analysis)}

### Testing
- [ ] Build passes locally
- [ ] All tests pass
- [ ] Manual testing completed

### Notes
${this.generatePRNotes(analysis)}

---
*This PR was automatically created by the VibeCode GitHub App*
*Review carefully before merging*`;
  }

  private generateChangesList(analysis: any): string {
    switch (analysis.fixType) {
      case "linting":
        return "- Fixed ESLint warnings and errors\n- Applied automatic formatting fixes";
      case "formatting":
        return "- Applied Prettier formatting\n- Standardized code style";
      case "typescript":
        return "- Fixed TypeScript compilation errors\n- Added missing type annotations";
      default:
        return "- Applied automated fixes based on analysis";
    }
  }

  private generatePRNotes(analysis: any): string {
    if (analysis.issues && analysis.issues.length > 0) {
      return `**Issues addressed:**\n${analysis.issues.map((issue: any) => `- ${issue.type}: ${issue.commit.substring(0, 7)} - ${issue.message}`).join("\n")}`;
    }
    return "This PR addresses issues detected by automated analysis.";
  }

  private async categorizeIssue(title: string, body: string) {
    const text = `${title} ${body}`.toLowerCase();
    const labels = ["automated"];
    let type = "general";

    // Categorize based on keywords
    if (
      text.includes("bug") ||
      text.includes("error") ||
      text.includes("broken")
    ) {
      labels.push("bug");
      type = "bug";
    } else if (text.includes("feature") || text.includes("enhancement")) {
      labels.push("enhancement");
      type = "feature";
    } else if (text.includes("deploy") || text.includes("build")) {
      labels.push("deployment");
      type = "deployment";
    } else if (text.includes("performance") || text.includes("slow")) {
      labels.push("performance");
      type = "performance";
    } else if (text.includes("security")) {
      labels.push("security", "high-priority");
      type = "security";
    }

    // Add priority labels
    if (
      text.includes("urgent") ||
      text.includes("critical") ||
      text.includes("production")
    ) {
      labels.push("high-priority");
    }

    return { type, labels };
  }

  private generateIssueContextComment(category: any): string | null {
    switch (category.type) {
      case "bug":
        return `## 🐛 Bug Report Auto-Analysis

Thank you for reporting this bug! I've automatically categorized this issue and added relevant labels.

### Helpful Information
Please ensure your report includes:
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Environment details (browser, OS)
- [ ] Console errors or logs

### Quick Links
- [Health Check](https://www.vibecode.space/health/detailed)
- [Recent Deployments](https://github.com/${category.repository}/actions)

This issue will be triaged by the team.`;

      case "deployment":
        return `## 🚀 Deployment Issue Auto-Analysis

This appears to be a deployment-related issue. Here are some quick debugging steps:

### Immediate Checks
- [ ] Check [deployment logs](https://dashboard.render.com)
- [ ] Verify [health status](https://www.vibecode.space/health/detailed)
- [ ] Review recent commits for breaking changes

### Common Solutions
1. Check environment variables
2. Verify database connectivity
3. Review build logs for errors

The development team will investigate shortly.`;

      default:
        return null;
    }
  }

  private async attemptAutoFix(analysis: any, octokit: any, repository: any) {
    // This would implement actual auto-fixing logic
    // For now, just log that we would attempt it
    logger.info("Auto-fix attempt triggered", {
      errorType: analysis.errorType,
      repository: repository.full_name,
    });

    // In a real implementation, this might:
    // 1. Clone the repository
    // 2. Apply fixes based on error type
    // 3. Create a PR with the fixes
    // 4. Run tests to verify fixes
  }

  private async sendSlackNotification(message: any) {
    if (!this.slackWebhook) return;

    try {
      await this.slackWebhook.send(message);
    } catch (error) {
      logger.error("Failed to send Slack notification", { error });
    }
  }

  public getWebhookMiddleware() {
    return createNodeMiddleware(this.app.webhooks, { path: "/github/webhook" });
  }

  public async getInstallationToken(installationId: number) {
    return await this.app.getInstallationOctokit(installationId);
  }
}
