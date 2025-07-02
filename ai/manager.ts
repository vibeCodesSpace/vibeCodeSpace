import {
  AIProvider,
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  GeneratedSite,
  ResumeData,
} from "./providers";

export class AIManager {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider: string = "openai";

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (openaiKey) {
      this.providers.set("openai", new OpenAIProvider(openaiKey));
    }

    if (anthropicKey) {
      this.providers.set("anthropic", new AnthropicProvider(anthropicKey));
    }

    if (geminiKey) {
      this.providers.set("gemini", new GeminiProvider(geminiKey));
    }

    // Set primary provider based on availability
    if (this.providers.has("openai")) {
      this.primaryProvider = "openai";
    } else if (this.providers.has("anthropic")) {
      this.primaryProvider = "anthropic";
    } else if (this.providers.has("gemini")) {
      this.primaryProvider = "gemini";
    }
  }

  async generateSite(
    prompt: string,
    preferredProvider?: string,
  ): Promise<GeneratedSite> {
    const provider = this.getProvider(preferredProvider);

    try {
      const result = await provider.generateSite(prompt);

      // Validate and enhance the result
      return this.validateAndEnhanceSite(result);
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);

      // Try fallback provider
      if (preferredProvider && preferredProvider !== this.primaryProvider) {
        console.log(`Falling back to ${this.primaryProvider}`);
        return this.generateSite(prompt, this.primaryProvider);
      }

      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async generateComponent(
    description: string,
    preferredProvider?: string,
  ): Promise<string> {
    const provider = this.getProvider(preferredProvider);

    try {
      return await provider.generateComponent(description);
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);

      // Try fallback
      if (preferredProvider && preferredProvider !== this.primaryProvider) {
        return this.generateComponent(description, this.primaryProvider);
      }

      throw new Error(`Component generation failed: ${error.message}`);
    }
  }

  async extractResumeData(
    resumeText: string,
    preferredProvider?: string,
  ): Promise<ResumeData> {
    const provider = this.getProvider(preferredProvider);

    try {
      const result = await provider.extractResumeData(resumeText);
      return this.validateResumeData(result);
    } catch (error) {
      console.error(`Error with ${provider.name}:`, error);

      // Try fallback
      if (preferredProvider && preferredProvider !== this.primaryProvider) {
        return this.extractResumeData(resumeText, this.primaryProvider);
      }

      throw new Error(`Resume extraction failed: ${error.message}`);
    }
  }

  async generatePortfolioFromResume(
    resumeData: ResumeData,
  ): Promise<GeneratedSite> {
    const prompt = `Create a professional portfolio website for ${resumeData.name}.

Profile:
- Name: ${resumeData.name}
- Title: ${resumeData.title}
- Summary: ${resumeData.summary}

Experience:
${resumeData.experience.map((exp) => `- ${exp.role} at ${exp.company} (${exp.duration}): ${exp.description}`).join("\n")}

Skills: ${resumeData.skills.join(", ")}

Education:
${resumeData.education.map((edu) => `- ${edu.degree} from ${edu.institution} (${edu.year})`).join("\n")}

Contact: ${resumeData.contact.email}${resumeData.contact.phone ? `, ${resumeData.contact.phone}` : ""}

Make it modern, professional, and visually appealing with sections for About, Experience, Skills, Education, and Contact.`;

    return this.generateSite(prompt);
  }

  private getProvider(preferredProvider?: string): AIProvider {
    const providerName = preferredProvider || this.primaryProvider;
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(
        `Provider ${providerName} not available. Available providers: ${Array.from(this.providers.keys()).join(", ")}`,
      );
    }

    return provider;
  }

  private validateAndEnhanceSite(site: GeneratedSite): GeneratedSite {
    // Ensure required fields exist
    if (!site.html || !site.css) {
      throw new Error("Generated site missing required HTML or CSS");
    }

    // Add meta viewport if missing
    if (!site.html.includes("viewport")) {
      site.html = site.html.replace(
        "<head>",
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      );
    }

    // Ensure metadata exists
    if (!site.metadata) {
      site.metadata = {
        title: "Generated Site",
        description: "AI-generated website",
        components: [],
        framework: "vanilla",
      };
    }

    // Add basic PWA support
    site.html = this.addPWASupport(site.html);

    return site;
  }

  private validateResumeData(data: ResumeData): ResumeData {
    // Ensure required fields
    if (!data.name) {
      throw new Error("Resume must contain a name");
    }

    // Provide defaults for missing fields
    return {
      name: data.name,
      title: data.title || "Professional",
      summary: data.summary || "Experienced professional",
      experience: data.experience || [],
      skills: data.skills || [],
      education: data.education || [],
      contact: {
        email: data.contact?.email || "",
        phone: data.contact?.phone || "",
        linkedin: data.contact?.linkedin || "",
        website: data.contact?.website || "",
      },
    };
  }

  private addPWASupport(html: string): string {
    // Add basic PWA manifest and service worker support
    const pwaHead = `
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#000000">
    <link rel="apple-touch-icon" href="/icon-192x192.png">`;

    return html.replace("</head>", `${pwaHead}\n</head>`);
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  getPrimaryProvider(): string {
    return this.primaryProvider;
  }

  setPrimaryProvider(provider: string): void {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not available`);
    }
    this.primaryProvider = provider;
  }
}

// Singleton instance
export const aiManager = new AIManager();
