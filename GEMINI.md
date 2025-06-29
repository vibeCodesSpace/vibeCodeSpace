# vibeCodeSpace Project Overview for Gemini CLI Agent

This document provides essential context for the Gemini CLI agent to understand the `vibeCodeSpace` project.

## Project Purpose

**Vision: VibeCode**

VibeCode exists to democratize software creation through AI.
We believe that ideas shouldn’t die in notebooks just because someone doesn’t know how to code.

Our vision is to build a platform where anyone — from a dreamer in a dorm room to a hustler in a small town — can describe their idea in plain language and watch it become a real, working application… instantly.

Think Replit meets ChatGPT, but infused with empathy, accessibility, and a rebellious spirit to remove all friction from building digital products.
No more waiting on dev teams. No more technical gatekeeping.
Just vibes → value — fast.

VibeCode empowers a new generation of indie founders, creators, ministries, and change-makers by offering:

- No-code, AI-powered app & website generation
- Free subdomains to launch ideas instantly
- Serverless, scalable architecture
- Community-first collaboration

We're not just building tools.
We're sparking movements.

Because the future doesn’t belong to the best coder.
It belongs to the boldest builder — and we’re giving them the keys.

## Current State (Temporary Static Site)

Due to environment compatibility issues, the project is currently configured as a static HTML site served by Node.js. This is a temporary measure to ensure the site is live. The full React frontend and backend API (including GitHub OAuth and AI generation features) are currently bypassed.

## Key Technologies (Original Vision)

- **Frontend:** React (with Vite for building)
- **Backend:** Node.js with Express.js (TypeScript)
- **Database:** PostgreSQL (using Drizzle ORM)
- **Authentication:** Passport.js (GitHub OAuth, local authentication planned)
- **AI Integration:** OpenAI (and potentially other providers)
- **UI Components:** Radix UI, Tailwind CSS

## Important Considerations for the Agent

### Running the Application

- The current `start` command is `node server.js` which serves the static `public/index.html`.
- The `build` command on Render should be set to `echo "No build step required"`.
- The original development server (`npm run dev`) and build process (`npm run build`) are currently not in use due to platform compatibility issues.

### Authentication

- The GitHub OAuth feature is currently disabled in the static site. An email contact link is provided instead.

### File Structure (Current Static Site)

- **`server.js`**: Node.js server for serving static files.
- **`public/index.html`**: The main static HTML file containing all content.

### Common Tasks

- **Deployment:** Ensure Render's build command is `echo "No build step required"` and the start command is `node server.js`.

This `GEMINI.md` file should be consulted at the beginning of each session to quickly grasp the project's state and common operational procedures.
