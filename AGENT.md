# AGENT.md

## Commands

- `npm run dev` - Start development server (runs both client and server)
- `npm run build` - Build for production (client + server)
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes with Drizzle

## Architecture

Full-stack React + Express app with PostgreSQL database:

- **Client**: React with Vite, Tailwind CSS, shadcn/ui components in `client/src/`
- **Server**: Express.js API server with authentication routes in root files (`index.ts`, `routes.ts`)
- **Database**: PostgreSQL with Drizzle ORM, schema in `shared/schema.ts`
- **Shared**: Common types and schemas in `shared/` directory
- **Auth**: Username/password authentication without sessions/JWT

## Code Style

- TypeScript with strict mode enabled
- Path aliases: `@/*` for client, `@shared/*` for shared code
- Imports: Use path aliases, group by external/internal
- Components: React functional components with TypeScript
- Styling: Tailwind CSS with CSS variables for theming
- Error handling: Zod validation, structured error responses
- Database: Drizzle ORM with PostgreSQL, type-safe queries
