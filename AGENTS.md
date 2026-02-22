# AGENTS.md

## Commands

- `pnpm dev` - Start dev server
- `pnpm build` - Build for production (also typechecks)
- `pnpm test` - Run all tests with vitest
- `pnpm test <file>` - Run single test file
- `pnpm test:coverage` - Run tests with coverage
- `pnpm export:design-system` - Export design tokens

## Architecture

React 19 + TypeScript + Vite app for AI-powered design system management.

- `src/components/` - React components using shadcn/ui patterns
- `src/context/` - React contexts (App, DesignLanguage, Voice)
- `src/core/` - Tool registry, plugin system, StyleGraph
- `src/hooks/` - Custom React hooks (useAIChat, useToolCallHandler, etc.)
- `src/services/` - Business logic, dbService (IndexedDB), AI clients
- `src/tools/` - AI tool definitions organized by domain
- `src/pages/` - Page components for routing
- `src/types/` - TypeScript type definitions
- `src/lib/` - Shared utilities (`cn()` for class merging)

Uses three-tier token system: Primitives → Utilities (semantic) → Components.

## Code Style

- Use `@/` path alias for imports from `src/`
- Tailwind CSS v4 + Radix UI primitives
- Use `cn()` from `@/lib/utils` for conditional class merging
- Use `cva()` from `class-variance-authority` for component variants

## .agents/knowledge/

Plans and temporary files can be stored in the closest `.agents/knowledge/` directory.
These directories are gitignored. Review them for persistent context about ongoing work.