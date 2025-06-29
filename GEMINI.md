# vibeCodeSpace Project Overview for Gemini CLI Agent

This document provides essential context for the Gemini CLI agent to understand the `vibeCodeSpace` project.

## Project Purpose

`vibeCodeSpace` is a web application designed to help users generate websites and components using AI, manage their generated sites, and potentially process resumes to create portfolios. It includes authentication features (GitHub OAuth and a planned email subscription).

## Key Technologies

- **Frontend:** React (with Vite for building)
- **Backend:** Node.js with Express.js (TypeScript)
- **Database:** PostgreSQL (using Drizzle ORM)
- **Authentication:** Passport.js (GitHub OAuth, local authentication planned)
- **AI Integration:** OpenAI (and potentially other providers)
- **UI Components:** Radix UI, Tailwind CSS

## Important Considerations for the Agent

### Running the Application

- The primary development server is run via `npm run dev` (which executes `tsx index.ts`).
- Due to platform compatibility issues on Android (specifically with `@rollup/rollup-linux-x64-gnu`), direct execution of `npm install` or `npm run dev` might fail.
- If `npm run dev` fails, the alternative is to:
  1. Run `npm install` (if possible, or manually resolve incompatible dependencies).
  2. Run `npm run build` to compile TypeScript to JavaScript.
  3. Run `npm start` (which executes `node server.js`) to serve the compiled application.
- The backend API runs on port 5000.

### Authentication

- GitHub OAuth is implemented but has been problematic on the current environment.
- An email subscription feature has been added as an alternative for user sign-up/contact.

### File Structure

- **`index.ts`**: Main backend server entry point.
- **`routes.ts`**: Defines API routes.
- **`dbStorage.ts`**: Handles database interactions.
- **`schema.ts`**: Defines database schemas (Drizzle ORM).
- **`client/src/`**: Frontend React application source code.
- **`pages/`**: React components for main pages.
- **`components/`**: Reusable React components.

### Common Tasks

- **Debugging:** Check server logs (console output from `index.ts`) and browser console for frontend errors.
- **Database:** Changes to `schema.ts` require running `drizzle-kit push` (or similar Drizzle commands) to update the database schema.

This `GEMINI.md` file should be consulted at the beginning of each session to quickly grasp the project's state and common operational procedures.
