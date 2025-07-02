# VibeCode - AI-Powered Web Application Generator

<div align="center">

![VibeCode Logo](./public/logo.png)

**Transform ideas into live web applications using AI**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Demo](https://vibecode.app) • [Documentation](./docs/) • [API Reference](./docs/API.md) • [Contributing](./CONTRIBUTING.md)

</div>

## ✨ Features

- **🤖 Multi-AI Provider Support**: OpenAI GPT-4o, Anthropic Claude, Google Gemini
- **📝 Text-to-App Generation**: Convert natural language prompts into complete web applications
- **📄 Resume-to-Portfolio**: Upload resume files to generate professional portfolio sites
- **🌐 Instant Hosting**: Deploy to `[name].vibecode.app` subdomains automatically
- **⚡ Real-time Generation**: Live preview and editing capabilities
- **🔐 User Management**: Authentication, site ownership, and analytics
- **🎨 Modern UI**: Beautiful interface built with React and Tailwind CSS
- **🏗️ Production Ready**: TypeScript, PostgreSQL, comprehensive error handling

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Mattjhagen/vibecode-ai-generator.git
cd vibecode-ai-generator
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Add your API keys
export OPENAI_API_KEY="your-openai-key"
export DATABASE_URL="postgresql://user:pass@localhost:5432/vibecode"
```

### 3. Database Setup

```bash
npm run db:push
```

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:5000` to see VibeCode in action!

## 🏗️ Architecture

```mermaid
graph TB
    A[User Input] --> B{Input Type}
    B -->|Text Prompt| C[AI Site Generator]
    B -->|Resume Upload| D[Resume Processor]

    C --> E[AI Manager]
    D --> E

    E --> F{Provider Selection}
    F -->|OpenAI| G[GPT-4o]
    F -->|Anthropic| H[Claude Sonnet]
    F -->|Google| I[Gemini Pro]

    G --> J[Generated Site]
    H --> J
    I --> J

    J --> K[Site Storage]
    K --> L[Subdomain Hosting]
    L --> M[Live Website]
```

## 💡 Use Cases

### For Developers

- **Rapid Prototyping**: Generate MVPs in minutes
- **Portfolio Creation**: Automated resume-to-portfolio conversion
- **Component Library**: Generate reusable UI components
- **Client Demos**: Quick mockups for client presentations

### For Non-Technical Users

- **Personal Websites**: Professional sites without coding
- **Business Landing Pages**: Marketing sites from descriptions
- **Portfolio Sites**: Professional presence from resume uploads
- **Event Pages**: Quick sites for events and projects

### For Agencies

- **Client Prototyping**: Rapid concept visualization
- **White-Label Solutions**: Custom-branded site generation
- **Scalable Delivery**: Automated site creation workflow
- **Cost Reduction**: Reduce development time and costs

## 🛠️ Tech Stack

**Frontend**

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS + Shadcn/ui
- React Query for state management

**Backend**

- Express.js with TypeScript
- PostgreSQL with Drizzle ORM
- Multi-AI provider integration
- RESTful API design

**Infrastructure**

- Node.js 20+ runtime
- Docker containerization
- Railway/Render deployment
- Neon Database hosting

## 📖 API Usage

### Generate a Website

```javascript
const response = await fetch("/api/ai/generate-site", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Create a modern portfolio website for a software developer",
    provider: "openai", // optional
  }),
});

const { site } = await response.json();
console.log(site.html); // Generated HTML
console.log(site.css); // Generated CSS
console.log(site.js); // Generated JavaScript
```

### Process Resume

```javascript
const formData = new FormData();
formData.append("resume", resumeFile);
formData.append("provider", "openai");

const response = await fetch("/api/ai/process-resume", {
  method: "POST",
  body: formData,
});

const { resumeData, site } = await response.json();
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...           # OpenAI API key
DATABASE_URL=postgresql://...   # PostgreSQL connection

# Optional
ANTHROPIC_API_KEY=sk-ant-...   # Anthropic Claude API key
GEMINI_API_KEY=...             # Google Gemini API key
NODE_ENV=development           # Environment mode
PORT=5000                      # Server port
```

### AI Provider Configuration

```typescript
// Custom provider integration
import { AIProvider } from "./ai/providers";

class CustomProvider implements AIProvider {
  name = "custom";

  async generateSite(prompt: string) {
    // Your implementation
  }
}
```

## 📚 Examples

### Basic Site Generation

```bash
curl -X POST http://localhost:5000/api/ai/generate-site \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a restaurant website with menu and contact info"}'
```

### Resume Processing

```bash
curl -X POST http://localhost:5000/api/ai/process-resume \
  -F "resume=@resume.txt" \
  -F "provider=openai"
```

## 🚀 Deployment

### Docker

```bash
docker build -t vibecode .
docker run -p 5000:5000 -e OPENAI_API_KEY=your-key vibecode
```

### Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/Mattjhagen/vibecode-ai-generator.git
cd vibecode-ai-generator
npm install
npm run dev
```

### Running Tests

```bash
npm run test        # Run test suite
npm run test:watch  # Watch mode
npm run check       # Type checking
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT-4o API
- [Anthropic](https://anthropic.com/) for Claude API
- [Google](https://ai.google.dev/) for Gemini API
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Drizzle ORM](https://orm.drizzle.team/) for database tooling

## 📊 Stats

![GitHub stars](https://img.shields.io/github/stars/Mattjhagen/vibecode-ai-generator?style=social)
![GitHub forks](https://img.shields.io/github/forks/Mattjhagen/vibecode-ai-generator?style=social)
![GitHub issues](https://img.shields.io/github/issues/Mattjhagen/vibecode-ai-generator)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Mattjhagen/vibecode-ai-generator)

---

<div align="center">

**[Website](https://vibecode.app) • [Documentation](./docs/) • [Twitter](https://twitter.com/vibecode) • [Discord](https://discord.gg/vibecode)**

Made with ❤️ by the VibeCode team

</div>
