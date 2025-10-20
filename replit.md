# Classical Islamic Philosophy Book Companion

## Overview

This application is a digital companion for a classical Islamic philosophical text series titled "First Teaching of the Last Message: The Divine Science and Its Six Pillars" by Umar F. Abd-Allah Wymann-Landgraf. The platform provides an enhanced reading experience with extended discussions, detailed commentary, and scholarly footnotes that reference the physical book. The design draws inspiration from classical Islamic manuscripts, traditional book design, and modern reading platforms like Medium and Readwise Reader.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript using Vite as the build tool

**Routing**: Wouter - A minimal client-side router for single-page navigation

**UI Component System**: shadcn/ui (New York style variant) built on Radix UI primitives
- Components configured via `components.json` with path aliases
- Extensive use of Radix UI primitives for accessibility (dialogs, popovers, tooltips, scroll areas, etc.)
- Design system supports both light and dark themes via CSS variables

**Design Philosophy**: 
- Classical manuscript-inspired aesthetic with parchment color palette
- Typography hierarchy using Google Fonts: Cormorant Garamond (headings), Crimson Text/Libre Baskerville (body), Amiri/Scheherazade New (Arabic text), Lato (UI elements)
- Optimal reading experience with max-width containers (~65-75 characters per line)
- Reading-focused features: adjustable text size, footnote popovers, reading progress indicator

**State Management**:
- TanStack Query (React Query) for server state management
- Local React state for UI interactions
- localStorage for user preferences (theme, text size)

**Key Features**:
- Chapter-based navigation with collapsible sidebar
- Interactive footnotes with hover previews and expandable panel
- Full-text search across all content
- Page reference navigation to physical book pages
- Theme toggle (light/dark mode)
- Text size controls for accessibility
- Reading progress tracking

### Backend Architecture

**Server**: Express.js with TypeScript (ESM modules)

**Development Setup**: 
- Vite middleware mode for HMR during development
- Custom logging middleware for API requests
- Replit-specific plugins for development environment

**Data Layer**: 
- Currently using in-memory storage (`MemStorage` class) with a defined interface (`IStorage`)
- Schema defined in TypeScript interfaces (not currently database-backed)
- Drizzle ORM configured for future PostgreSQL integration
- Database configuration points to `@neondatabase/serverless` for eventual cloud deployment

**API Design**:
- Routes prefixed with `/api`
- RESTful conventions expected
- CRUD operations defined through storage interface

**Content Structure**:
- Book data modeled as hierarchical: BookData → Chapters → Sections → Footnotes
- Content includes HTML formatting tags for rich text (bold, italic, underline)
- Each section can reference physical book page numbers
- Mock data currently stored in `client/src/lib/mockData.ts` pending CMS/database integration

### Design System

**Color System**:
- HSL-based color variables for both light and dark modes
- Primary palette: warm parchment backgrounds, deep manuscript browns
- Accent color: Islamic teal (180° hue)
- Functional colors for footnotes, links, quotes with subtle golden/teal tones

**Spacing System**: Tailwind spacing units (4, 6, 8, 12, 16, 24px)

**Component Patterns**:
- Hover states use elevation layers (`--elevate-1`, `--elevate-2`)
- Border opacity variables for consistent outlines
- Shadow system for depth hierarchy

## External Dependencies

### UI/Component Libraries
- **Radix UI**: Comprehensive collection of accessible, unstyled UI primitives (@radix-ui/react-*)
- **shadcn/ui**: Pre-built component system using Radix UI
- **Lucide React**: Icon library for UI elements
- **cmdk**: Command palette component
- **Embla Carousel**: Carousel/slider component
- **Vaul**: Drawer component

### Utilities
- **class-variance-authority**: Type-safe variant API for components
- **clsx & tailwind-merge**: Conditional className utilities
- **date-fns**: Date manipulation and formatting
- **nanoid**: Unique ID generation

### Form Management
- **React Hook Form**: Form state management with validation
- **@hookform/resolvers**: Validation schema resolvers
- **Zod**: Schema validation (via drizzle-zod)

### Database/ORM (Configured but not fully implemented)
- **Drizzle ORM**: Type-safe SQL query builder
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon
- **drizzle-zod**: Zod schema generation from Drizzle tables
- **connect-pg-simple**: PostgreSQL session store for Express

### Build Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across full stack
- **PostCSS & Autoprefixer**: CSS processing
- **Tailwind CSS**: Utility-first CSS framework
- **esbuild**: Fast JavaScript bundler for production builds

### Development Tools (Replit-specific)
- `@replit/vite-plugin-runtime-error-modal`: Error overlay
- `@replit/vite-plugin-cartographer`: Project navigation
- `@replit/vite-plugin-dev-banner`: Development banner

### Content Management
**Current State**: Static mock data in TypeScript files

**Future Integration Points**: 
- Content likely to be migrated from `tmp/book-content.txt` and processed HTML files
- Schema supports rich text with HTML tags in content strings
- PostgreSQL database configured via Drizzle for production content storage