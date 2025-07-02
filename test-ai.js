// Quick test of our AI system
import { aiManager } from "./ai/manager.js";

console.log("Testing VibeCode AI System...");

// Test getting available providers
const providers = aiManager.getAvailableProviders();
console.log("Available providers:", providers);

// Test site generation (requires API keys)
if (providers.length > 0) {
  console.log("Testing site generation...");

  try {
    const site = await aiManager.generateSite(
      "Create a professional portfolio website for a software developer named John Doe. Include sections for about, skills, experience, and contact.",
    );

    console.log("Generated site metadata:", site.metadata);
    console.log(
      "HTML preview (first 200 chars):",
      site.html.substring(0, 200) + "...",
    );

    // Test resume extraction
    const resumeText = `
John Doe
Software Developer
john.doe@email.com
(555) 123-4567

Professional Summary:
Experienced full-stack developer with 5+ years building web applications.

Experience:
Senior Developer at Tech Corp (2020-2025)
- Built scalable React applications
- Led team of 3 developers

Junior Developer at StartupXYZ (2018-2020)
- Developed REST APIs using Node.js
- Implemented CI/CD pipelines

Skills: React, Node.js, Python, PostgreSQL, AWS

Education:
Bachelor of Computer Science
University of Technology (2018)
    `;

    console.log("\nTesting resume extraction...");
    const resumeData = await aiManager.extractResumeData(resumeText);
    console.log("Extracted resume data:", JSON.stringify(resumeData, null, 2));

    // Test portfolio generation from resume
    console.log("\nTesting portfolio generation from resume...");
    const portfolioSite =
      await aiManager.generatePortfolioFromResume(resumeData);
    console.log("Portfolio site metadata:", portfolioSite.metadata);
  } catch (error) {
    console.error("AI test failed:", error.message);
    console.log("Make sure to set your API keys in environment variables:");
    console.log("- OPENAI_API_KEY");
    console.log("- ANTHROPIC_API_KEY");
    console.log("- GEMINI_API_KEY");
  }
} else {
  console.log(
    "No AI providers available. Please set API keys in environment variables.",
  );
}
