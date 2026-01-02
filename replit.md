# Kamus Bahasa dan AI Chat Bot

## Overview

This is a full-stack web application that combines an Indonesian slang dictionary with an AI-powered chatbot. The application translates Indonesian slang words ("bahasa gaul") to formal Indonesian ("bahasa baku") and includes an AI chat interface powered by Google's Gemini API through Replit's AI Integrations.

The project uses a modern TypeScript stack with React on the frontend and Express on the backend, with PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with hot module replacement

The frontend has two entry points:
1. `client/index.html` - Static HTML page with vanilla JS for the dictionary and chatbot UI
2. `client/src/main.tsx` - React SPA entry point (currently showing 404, routes need to be added)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **AI Integration**: Google Gemini API via Replit AI Integrations

Key backend modules:
- `server/routes.ts` - Main route registration
- `server/storage.ts` - Database storage interface pattern
- `server/db.ts` - Database connection using pg Pool
- `server/replit_integrations/` - AI features (chat, image generation, batch processing)

### Database Schema
Located in `shared/schema.ts`:
- **users** - User accounts with UUID primary keys
- **conversations** - Chat conversation threads
- **messages** - Individual chat messages linked to conversations

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: Custom build script using esbuild for server and Vite for client
- Output: `dist/` directory with `index.cjs` (server) and `public/` (client assets)

## External Dependencies

### Database
- **PostgreSQL** - Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle Kit** - Database migrations stored in `migrations/` directory

### AI Services
- **Replit AI Integrations** - Provides Gemini API access without requiring personal API keys
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Models: `gemini-2.5-flash` (fast), `gemini-2.5-pro` (reasoning), `gemini-2.5-flash-image` (image generation)

### Key NPM Packages
- `@google/genai` - Google Generative AI client
- `drizzle-orm` / `drizzle-zod` - Type-safe database ORM with Zod validation
- `@tanstack/react-query` - Server state management
- `@radix-ui/*` - Headless UI component primitives
- `express-session` / `connect-pg-simple` - Session management with PostgreSQL store