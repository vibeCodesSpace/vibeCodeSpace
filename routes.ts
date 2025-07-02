import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { localUserSchema } from "./schema.js";
import { z } from "zod";
import { aiManager } from "./ai/manager";
import { siteStorage } from "./storage/sites";
import { setupGitHubRoutes } from "./routes/github.js";
import multer from "multer";
import passport from "./lib/auth";
import session from "express-session";
import MemoryStore from "memorystore";

const memorystore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      store: new memorystore({ checkPeriod: 86400000 }), // 24h
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Authentication routes

  app.get(
    "/api/auth/github",
    passport.authenticate("github", { scope: ["user:email"] }),
  );

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      failureRedirect: "/login",
      successRedirect: "/",
    }),
  );

  // Email subscription route
  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({ message: "Valid email is required" });
      }

      await storage.createSubscriber({ email });
      res.status(201).json({ message: "Subscription successful!" });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({
        message: "Failed to subscribe",
        error: error.message,
      });
    }
  });

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  });

  // AI Generation routes
  app.post("/api/ai/generate-site", async (req, res) => {
    try {
      const { prompt, provider } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const site = await aiManager.generateSite(prompt, provider);
      res.json({ site });
    } catch (error) {
      console.error("Site generation error:", error);
      res.status(500).json({
        message: "Failed to generate site",
        error: error.message,
      });
    }
  });

  app.post("/api/ai/generate-component", async (req, res) => {
    try {
      const { description, provider } = req.body;

      if (!description) {
        return res
          .status(400)
          .json({ message: "Component description is required" });
      }

      const component = await aiManager.generateComponent(
        description,
        provider,
      );
      res.json({ component });
    } catch (error) {
      console.error("Component generation error:", error);
      res.status(500).json({
        message: "Failed to generate component",
        error: error.message,
      });
    }
  });

  app.post(
    "/api/ai/process-resume",
    upload.single("resume"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "Resume file is required" });
        }

        const resumeText = req.file.buffer.toString("utf-8");
        const { provider } = req.body;

        const resumeData = await aiManager.extractResumeData(
          resumeText,
          provider,
        );
        const portfolioSite =
          await aiManager.generatePortfolioFromResume(resumeData);

        res.json({
          resumeData,
          site: portfolioSite,
        });
      } catch (error) {
        console.error("Resume processing error:", error);
        res.status(500).json({
          message: "Failed to process resume",
          error: error.message,
        });
      }
    },
  );

  app.post("/api/ai/extract-resume", async (req, res) => {
    try {
      const { resumeText, provider } = req.body;

      if (!resumeText) {
        return res.status(400).json({ message: "Resume text is required" });
      }

      const resumeData = await aiManager.extractResumeData(
        resumeText,
        provider,
      );
      res.json({ resumeData });
    } catch (error) {
      console.error("Resume extraction error:", error);
      res.status(500).json({
        message: "Failed to extract resume data",
        error: error.message,
      });
    }
  });

  app.get("/api/ai/providers", (req, res) => {
    res.json({
      available: aiManager.getAvailableProviders(),
      primary: aiManager.getPrimaryProvider(),
    });
  });

  app.post("/api/ai/set-primary-provider", async (req, res) => {
    try {
      const { provider } = req.body;

      if (!provider) {
        return res.status(400).json({ message: "Provider is required" });
      }

      aiManager.setPrimaryProvider(provider);
      res.json({ message: "Primary provider updated", provider });
    } catch (error) {
      res.status(400).json({
        message: "Failed to set provider",
        error: error.message,
      });
    }
  });

  // Site management routes
  app.post("/api/sites", async (req, res) => {
    try {
      const { userId, name, subdomain, site, prompt, provider } = req.body;

      if (!userId || !name || !subdomain || !site) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const storedSite = await siteStorage.createSite({
        userId,
        name,
        subdomain,
        site,
        prompt,
        provider: provider || "openai",
      });

      res.json({ site: storedSite });
    } catch (error) {
      console.error("Site creation error:", error);
      res.status(400).json({
        message: "Failed to create site",
        error: error.message,
      });
    }
  });

  app.get("/api/sites/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const sites = await siteStorage.getUserSites(userId);
      res.json({ sites });
    } catch (error) {
      console.error("Get user sites error:", error);
      res.status(500).json({
        message: "Failed to fetch sites",
        error: error.message,
      });
    }
  });

  app.get("/api/sites/:siteId", async (req, res) => {
    try {
      const { siteId } = req.params;
      const site = await siteStorage.getSite(siteId);

      if (!site) {
        return res.status(404).json({ message: "Site not found" });
      }

      res.json({ site });
    } catch (error) {
      console.error("Get site error:", error);
      res.status(500).json({
        message: "Failed to fetch site",
        error: error.message,
      });
    }
  });

  app.put("/api/sites/:siteId", async (req, res) => {
    try {
      const { siteId } = req.params;
      const { name, site, customDomain } = req.body;

      const updatedSite = await siteStorage.updateSite(siteId, {
        name,
        site,
        customDomain,
      });

      res.json({ site: updatedSite });
    } catch (error) {
      console.error("Update site error:", error);
      res.status(400).json({
        message: "Failed to update site",
        error: error.message,
      });
    }
  });

  app.post("/api/sites/:siteId/publish", async (req, res) => {
    try {
      const { siteId } = req.params;
      const publishedSite = await siteStorage.publishSite(siteId);
      res.json({ site: publishedSite });
    } catch (error) {
      console.error("Publish site error:", error);
      res.status(400).json({
        message: "Failed to publish site",
        error: error.message,
      });
    }
  });

  app.post("/api/sites/:siteId/unpublish", async (req, res) => {
    try {
      const { siteId } = req.params;
      const unpublishedSite = await siteStorage.unpublishSite(siteId);
      res.json({ site: unpublishedSite });
    } catch (error) {
      console.error("Unpublish site error:", error);
      res.status(400).json({
        message: "Failed to unpublish site",
        error: error.message,
      });
    }
  });

  app.delete("/api/sites/:siteId", async (req, res) => {
    try {
      const { siteId } = req.params;
      const deleted = await siteStorage.deleteSite(siteId);

      if (!deleted) {
        return res.status(404).json({ message: "Site not found" });
      }

      res.json({ message: "Site deleted successfully" });
    } catch (error) {
      console.error("Delete site error:", error);
      res.status(500).json({
        message: "Failed to delete site",
        error: error.message,
      });
    }
  });

  app.get("/api/subdomains/:subdomain/check", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const available = await siteStorage.checkSubdomainAvailability(subdomain);
      res.json({ available });
    } catch (error) {
      res.status(500).json({
        message: "Failed to check subdomain",
        error: error.message,
      });
    }
  });

  // Public site serving
  app.get("/sites/:subdomain", async (req, res) => {
    try {
      const { subdomain } = req.params;
      const site = await siteStorage.getSiteBySubdomain(subdomain);

      if (!site || !site.isPublished) {
        return res.status(404).send("Site not found");
      }

      // Increment views
      await siteStorage.incrementViews(site.id);

      // Serve the generated HTML
      res.send(site.site.html);
    } catch (error) {
      console.error("Serve site error:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Public sites discovery
  app.get("/api/sites/public/search", async (req, res) => {
    try {
      const { q } = req.query;

      if (q && typeof q === "string") {
        const sites = await siteStorage.searchSites(q);
        res.json({
          sites: sites.map((site) => ({
            id: site.id,
            name: site.name,
            subdomain: site.subdomain,
            title: site.site.metadata.title,
            description: site.site.metadata.description,
            views: site.metadata.analytics?.views || 0,
            createdAt: site.createdAt,
          })),
        });
      } else {
        const sites = await siteStorage.getPublishedSites();
        res.json({
          sites: sites.map((site) => ({
            id: site.id,
            name: site.name,
            subdomain: site.subdomain,
            title: site.site.metadata.title,
            description: site.site.metadata.description,
            views: site.metadata.analytics?.views || 0,
            createdAt: site.createdAt,
          })),
        });
      }
    } catch (error) {
      console.error("Public sites error:", error);
      res.status(500).json({
        message: "Failed to fetch public sites",
        error: error.message,
      });
    }
  });

  // Setup GitHub App routes
  setupGitHubRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
