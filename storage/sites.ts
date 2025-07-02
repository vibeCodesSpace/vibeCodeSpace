import { GeneratedSite } from "../ai/providers";

export interface StoredSite {
  id: string;
  userId: string;
  name: string;
  subdomain: string; // e.g., "mysite" for mysite.vibecode.app
  customDomain?: string;
  site: GeneratedSite;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    prompt?: string;
    provider: string;
    version: number;
    analytics?: {
      views: number;
      lastViewed?: Date;
    };
  };
}

class SiteStorage {
  private sites: Map<string, StoredSite> = new Map();
  private subdomainIndex: Map<string, string> = new Map(); // subdomain -> siteId
  private userSitesIndex: Map<string, Set<string>> = new Map(); // userId -> Set<siteId>

  async createSite(data: {
    userId: string;
    name: string;
    subdomain: string;
    site: GeneratedSite;
    prompt?: string;
    provider: string;
  }): Promise<StoredSite> {
    // Check if subdomain is already taken
    if (this.subdomainIndex.has(data.subdomain)) {
      throw new Error(`Subdomain "${data.subdomain}" is already taken`);
    }

    const siteId = this.generateId();
    const now = new Date();

    const storedSite: StoredSite = {
      id: siteId,
      userId: data.userId,
      name: data.name,
      subdomain: data.subdomain,
      site: data.site,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
      metadata: {
        prompt: data.prompt,
        provider: data.provider,
        version: 1,
        analytics: {
          views: 0,
        },
      },
    };

    this.sites.set(siteId, storedSite);
    this.subdomainIndex.set(data.subdomain, siteId);

    // Update user sites index
    if (!this.userSitesIndex.has(data.userId)) {
      this.userSitesIndex.set(data.userId, new Set());
    }
    this.userSitesIndex.get(data.userId)!.add(siteId);

    return storedSite;
  }

  async updateSite(
    siteId: string,
    updates: Partial<Pick<StoredSite, "name" | "site" | "customDomain">>,
  ): Promise<StoredSite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    const updatedSite: StoredSite = {
      ...site,
      ...updates,
      updatedAt: new Date(),
      metadata: {
        ...site.metadata,
        version: site.metadata.version + 1,
      },
    };

    this.sites.set(siteId, updatedSite);
    return updatedSite;
  }

  async publishSite(siteId: string): Promise<StoredSite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    const publishedSite: StoredSite = {
      ...site,
      isPublished: true,
      updatedAt: new Date(),
    };

    this.sites.set(siteId, publishedSite);
    return publishedSite;
  }

  async unpublishSite(siteId: string): Promise<StoredSite> {
    const site = this.sites.get(siteId);
    if (!site) {
      throw new Error("Site not found");
    }

    const unpublishedSite: StoredSite = {
      ...site,
      isPublished: false,
      updatedAt: new Date(),
    };

    this.sites.set(siteId, unpublishedSite);
    return unpublishedSite;
  }

  async getSite(siteId: string): Promise<StoredSite | null> {
    return this.sites.get(siteId) || null;
  }

  async getSiteBySubdomain(subdomain: string): Promise<StoredSite | null> {
    const siteId = this.subdomainIndex.get(subdomain);
    if (!siteId) return null;
    return this.getSite(siteId);
  }

  async getUserSites(userId: string): Promise<StoredSite[]> {
    const siteIds = this.userSitesIndex.get(userId) || new Set();
    return Array.from(siteIds)
      .map((id) => this.sites.get(id))
      .filter(Boolean) as StoredSite[];
  }

  async deleteSite(siteId: string): Promise<boolean> {
    const site = this.sites.get(siteId);
    if (!site) return false;

    // Remove from all indexes
    this.sites.delete(siteId);
    this.subdomainIndex.delete(site.subdomain);

    const userSites = this.userSitesIndex.get(site.userId);
    if (userSites) {
      userSites.delete(siteId);
      if (userSites.size === 0) {
        this.userSitesIndex.delete(site.userId);
      }
    }

    return true;
  }

  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    return !this.subdomainIndex.has(subdomain);
  }

  async incrementViews(siteId: string): Promise<void> {
    const site = this.sites.get(siteId);
    if (!site) return;

    site.metadata.analytics = {
      views: (site.metadata.analytics?.views || 0) + 1,
      lastViewed: new Date(),
    };

    this.sites.set(siteId, site);
  }

  async getPublishedSites(): Promise<StoredSite[]> {
    return Array.from(this.sites.values()).filter((site) => site.isPublished);
  }

  async searchSites(query: string): Promise<StoredSite[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.sites.values()).filter(
      (site) =>
        site.isPublished &&
        (site.name.toLowerCase().includes(lowerQuery) ||
          site.site.metadata.title.toLowerCase().includes(lowerQuery) ||
          site.site.metadata.description.toLowerCase().includes(lowerQuery)),
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

export const siteStorage = new SiteStorage();
