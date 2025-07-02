import OpenAI from "openai";

export interface AIProvider {
  name: string;
  generateSite: (prompt: string) => Promise<GeneratedSite>;
  generateComponent: (description: string) => Promise<string>;
  extractResumeData: (resumeText: string) => Promise<ResumeData>;
}

export interface GeneratedSite {
  html: string;
  css: string;
  js: string;
  metadata: {
    title: string;
    description: string;
    components: string[];
    framework: "react" | "vanilla";
  };
}

export interface ResumeData {
  name: string;
  title: string;
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  contact: {
    email: string;
    phone?: string;
    linkedin?: string;
    website?: string;
  };
}

class OpenAIProvider implements AIProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSite(prompt: string): Promise<GeneratedSite> {
    const systemPrompt = `You are an expert web developer. Generate a complete, modern, responsive website based on the user's description. 

Return a JSON object with:
- html: Complete HTML structure using semantic elements
- css: Modern CSS with Flexbox/Grid, responsive design, and beautiful styling
- js: Vanilla JavaScript for interactivity (no external frameworks)
- metadata: { title, description, components[], framework: 'vanilla' }

Make it visually stunning with:
- Modern color schemes and typography
- Smooth animations and hover effects
- Mobile-first responsive design
- Professional layout and spacing
- Accessibility features

Do NOT use external CDNs or frameworks. Make it self-contained.`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result as GeneratedSite;
  }

  async generateComponent(description: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Generate a complete HTML component with inline CSS and JavaScript. Make it modern, responsive, and self-contained.",
        },
        { role: "user", content: description },
      ],
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "";
  }

  async extractResumeData(resumeText: string): Promise<ResumeData> {
    const systemPrompt = `Extract structured data from this resume text. Return a JSON object with the exact structure:
{
  "name": "Full Name",
  "title": "Professional Title/Role",
  "summary": "Professional summary",
  "experience": [{"company": "", "role": "", "duration": "", "description": ""}],
  "skills": ["skill1", "skill2"],
  "education": [{"institution": "", "degree": "", "year": ""}],
  "contact": {"email": "", "phone": "", "linkedin": "", "website": ""}
}`;

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: resumeText },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return result as ResumeData;
  }
}

class AnthropicProvider implements AIProvider {
  name = "anthropic";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSite(prompt: string): Promise<GeneratedSite> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `Generate a complete, modern website based on this description: ${prompt}

Return only a JSON object with:
- html: Complete HTML structure
- css: Modern responsive CSS
- js: Vanilla JavaScript for interactivity
- metadata: { title, description, components[], framework: 'vanilla' }

Make it visually stunning and fully responsive.`,
          },
        ],
      }),
    });

    const result = await response.json();
    return JSON.parse(result.content[0].text) as GeneratedSite;
  }

  async generateComponent(description: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Generate a complete HTML component: ${description}. Include inline CSS and JavaScript. Make it modern and responsive.`,
          },
        ],
      }),
    });

    const result = await response.json();
    return result.content[0].text;
  }

  async extractResumeData(resumeText: string): Promise<ResumeData> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `Extract structured data from this resume and return as JSON:
${resumeText}

Format: {"name": "", "title": "", "summary": "", "experience": [], "skills": [], "education": [], "contact": {}}`,
          },
        ],
      }),
    });

    const result = await response.json();
    return JSON.parse(result.content[0].text) as ResumeData;
  }
}

class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSite(prompt: string): Promise<GeneratedSite> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a complete modern website for: ${prompt}

Return JSON with: html, css, js, metadata fields. Make it visually stunning and responsive.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4000,
          },
        }),
      },
    );

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;

    // Extract JSON from markdown code block if present
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) ||
      text.match(/```\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    return JSON.parse(jsonStr) as GeneratedSite;
  }

  async generateComponent(description: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate HTML component: ${description}. Include inline CSS and JS. Make it modern and responsive.`,
                },
              ],
            },
          ],
        }),
      },
    );

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
  }

  async extractResumeData(resumeText: string): Promise<ResumeData> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract resume data as JSON: ${resumeText}`,
                },
              ],
            },
          ],
        }),
      },
    );

    const result = await response.json();
    const text = result.candidates[0].content.parts[0].text;

    // Extract JSON from response
    const jsonMatch =
      text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

    return JSON.parse(jsonStr) as ResumeData;
  }
}

export { OpenAIProvider, AnthropicProvider, GeminiProvider };
