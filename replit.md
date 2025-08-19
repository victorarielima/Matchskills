# Overview

MatchSkills is a web application designed for competency evaluation in professional environments, allowing evaluators to create assessments with custom forms and collect participant responses. The system features an evaluator dashboard for assessment management and a participant interface for form submission using unique access codes. The application uses a full-stack TypeScript architecture with React frontend, Express backend, and PostgreSQL database with mock data for development.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes (August 15, 2025)

- **Application renamed to MatchSkills**: Changed from EduForms to MatchSkills with competency evaluation focus
- **Authentication system replaced**: Removed Replit OAuth, implemented custom email/password authentication
- **Mock data integration**: Added comprehensive mock data for users, assessments, questions, and responses
- **Portuguese interface**: All UI elements translated to Portuguese for Brazilian market
- **Terminology updates**: Changed "teachers/students" to "evaluators/participants", "classes" to "assessments"

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with JSON responses
- **Session Management**: Express sessions with PostgreSQL storage
- **Error Handling**: Centralized error middleware with structured responses

## Database Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema updates
- **Connection Pooling**: Neon serverless pool for efficient connections

## Authentication System
- **Provider**: Custom email/password authentication 
- **Strategy**: Local authentication with Passport.js and bcrypt
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Route-level middleware protection for authenticated endpoints
- **Development**: Uses mock user data for simplified development workflow

## Development Environment
- **Build System**: Vite for frontend bundling and hot module replacement
- **TypeScript**: Strict type checking across client, server, and shared code
- **Development Server**: Concurrent frontend and backend development with middleware integration
- **Code Organization**: Monorepo structure with shared types and schemas

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication Services
- **Local Authentication**: Email/password based authentication system
- **Passport.js**: Authentication middleware with local strategy
- **Password Hashing**: Secure password storage using Node.js crypto scrypt

## UI Framework Dependencies
- **Radix UI**: Headless component primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework for styling

## Development Tools
- **Vite Plugins**: Runtime error overlay and Replit cartographer integration
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type safety across the entire application stack

## Core Libraries
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight routing solution
- **date-fns**: Date manipulation and formatting utilities