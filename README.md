# VibeCode - AI-Powered Web App Generator

## Overview

VibeCode is a GPT-powered web application and website generator that allows users to create functional applications from simple text descriptions or uploaded resumes. The platform instantly builds and hosts personal sites or functional apps with minimal setup required.

## System Architecture

This is a full-stack TypeScript application built with a modern monorepo structure:

### Frontend Architecture

- **Framework**: React 18 with TypeScript and Vite
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Query for server state, React Context for auth
- **Routing**: React Router for client-side navigation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture

- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Currently mock auth (designed for future Supabase integration)
- **Session Storage**: PostgreSQL-based sessions via connect-pg-simple

### Development Setup

- **Runtime**: Node.js 20
- **Package Manager**: npm with package-lock.json
- **Development**: Hot reload with Vite dev server
- **TypeScript**: Strict mode with path aliases

## Key Components

### Data Layer

- **Schema**: Defined in `shared/schema.ts` using Drizzle ORM
- **Current Tables**: Users table with username/password authentication
- **Storage Interface**: Abstracted storage layer with in-memory fallback
- **Database Migrations**: Managed via Drizzle Kit

### Authentication System

- **Current State**: Mock authentication with localStorage persistence
- **Future Integration**: Designed for Supabase Auth integration
- **Protected Routes**: Route-level protection with loading states
- **User Context**: React Context provider for global auth state

### AI Generation Features

- **Text-to-App**: AI generator component for converting prompts to code
- **Resume-to-Portfolio**: Resume processor for creating portfolio sites
- **Mock Implementation**: Simulated AI responses for development
- **Future Integration**: Designed for OpenAI GPT API integration

### UI Components

- **Design System**: Shadcn/ui with custom Tailwind configuration
- **Landing Page**: Marketing site with hero, features, testimonials
- **Dashboard**: Protected area for authenticated users
- **Forms**: React Hook Form with Zod validation
- **Responsive**: Mobile-first design with breakpoint utilities

## Data Flow

1. **User Authentication**: Mock login/signup → Context state → Protected routes
2. **AI Generation**: User prompt → AI service (simulated) → Generated code → Display
3. **Resume Processing**: File upload → Parser (simulated) → Portfolio generation → Preview
4. **Database Operations**: Application → Storage interface → Drizzle ORM → PostgreSQL

## External Dependencies

### Core Dependencies

- **UI Framework**: React, React Router, React Query
- **Database**: Drizzle ORM, Neon Database driver
- **UI Components**: Radix UI primitives, Lucide icons
- **Styling**: Tailwind CSS, class-variance-authority
- **Forms**: React Hook Form, Hookform resolvers
- **Build Tools**: Vite, ESBuild, TypeScript

### Development Dependencies

- **Runtime**: Node.js, tsx for TypeScript execution
- **Linting**: TypeScript strict mode
- **Hot Reload**: Vite dev server with middleware

### Future Integrations

- **AI Service**: OpenAI GPT API for code generation
- **Authentication**: Supabase Auth for user management
- **Email Service**: Planned for domain/email upgrades
- **Payment Processing**: For premium features

## Deployment Strategy

### Development Environment

- **Runtime**: Replit with Node.js 20 and PostgreSQL 16
- **Port Configuration**: Frontend on 5000, proxied to port 80
- **Hot Reload**: Vite dev server with Express backend

### Production Build

- **Frontend**: Vite build to `dist/public`
- **Backend**: ESBuild bundle to `dist/index.js`
- **Static Assets**: Served via Express static middleware
- **Database**: PostgreSQL connection via environment variables

### Hosting Strategy

- **Platform**: Replit Autoscale deployment
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Environment**: Production Node.js with compiled assets

## Changelog

- June 25, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
