# Synth

A voice-first AI agent for creating, editing, and managing design systems with natural language. Built with React, TypeScript, and powered by advanced LLMs (Anthropic Claude, OpenAI GPT-4, Google Gemini).

![License](https://img.shields.io/badge/license-private-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19.2-blue)

## Features

### Voice-First Interface

- **Natural Language Editing**: Speak to create and modify design tokens, colors, typography, and components
- **Real-time AI Assistance**: Context-aware AI that understands your design system and provides intelligent suggestions
- **Multi-Provider Support**: Choose between Anthropic Claude, OpenAI GPT-4, or Google Gemini

### Design System Management

- **Complete Token System**: Manage primitives, utilities, and semantic tokens
- **Visual Previews**: Live color swatches, typography samples, and spacing visualizations
- **Impact Analysis**: Understand the ripple effects of token changes across your system
- **Dark Mode**: Built-in light/dark theme support

### Advanced Tooling

- **AI-Powered Tools**: 10+ specialized tools for token manipulation, search, and system analysis
- **Visual Canvas**: Interactive graph visualization of token relationships and dependencies
- **Version Control**: Built-in undo/redo with full change history
- **Database Persistence**: IndexedDB for reliable local-first data storage

### Image & Visual Analysis

- **Screenshot Analysis**: Upload design screenshots for AI-powered analysis and token extraction
- **Component Recognition**: Identify UI patterns and generate matching design tokens
- **Visual Content System**: Rich markdown documentation with embedded examples

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Configure API keys
cp .env.example .env
# Edit .env and add your API keys:
# - OPENAI_API_KEY or ANTHROPIC_API_KEY (required for design generation)
# - GEMINI_API_KEY (required for voice features)

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup

1. **Configure API Keys**: Copy `.env.example` to `.env` and add your keys:
   - For design generation: `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` (at least one required)
   - For voice features: `GEMINI_API_KEY` (required)
2. **Configure Voice**: Choose your preferred voice settings in Settings
3. **Start Creating**: Click "Start" on the landing page to begin with voice, or create a new design language

## Architecture

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **State Management**: React Context + Custom Hooks
- **AI/LLM**: Vercel AI SDK with Anthropic/OpenAI/Google providers
- **Data Visualization**: D3.js, Three.js, React Three Fiber
- **Color Science**: Culori for advanced color manipulation
- **Database**: IndexedDB for local persistence
- **Build Tool**: Vite 6

### Project Structure

```
src/
├── components/          # React components
│   ├── canvas/         # 3D/2D visualization components
│   ├── design-language/# Reusable UI components (Button, Input, etc.)
│   ├── content/        # Documentation/content viewers
│   └── tool-results/   # AI tool result displays
├── context/            # React contexts (App, DesignLanguage, Voice, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Route pages
├── services/           # Business logic & data services
│   ├── canvas/         # Graph layout algorithms
│   ├── dbService.ts    # IndexedDB operations
│   ├── toolHandlers.ts # AI tool implementations
│   └── ...
├── toolCalls/          # AI tool call handlers
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

data/                   # Design system data (JSON)
scripts/                # Build & export scripts
public/                 # Static assets
```

### Design System Layers

The system uses a three-tier token architecture:

```
┌─────────────────────────────────────────┐
│ Primitives                              │
│ Raw values: #FF5733, 16px, Inter, etc.  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Utilities (Semantic Tokens)             │
│ Purpose-driven: text.primary, bg.app    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Components                              │
│ Complete specs: Button, Input, Card     │
└─────────────────────────────────────────┘
```

## Usage

### Voice Commands

Natural language examples:

```
"Show me all color tokens"
"Create a new primary color with value #3B82F6"
"Change the heading font to Inter Bold"
"What components use this color?"
"Make the background slightly darker"
"Undo that change"
"Export the design system"
```

### Text Prompts

Type commands in the text input when voice is not active:

```
"Analyze the color palette and suggest improvements"
"Create a component called PrimaryButton with rounded corners"
"Show token dependencies for text.heading"
```

### AI Tools

The agent has access to specialized tools:

| Tool                        | Purpose                                 |
| --------------------------- | --------------------------------------- |
| `getToken`                  | Retrieve token details by path          |
| `searchTokens`              | Search tokens by query, layer, or type  |
| `updateToken`               | Modify token values with validation     |
| `createToken`               | Add new primitives or utilities         |
| `deleteToken`               | Remove tokens (with dependency checks)  |
| `getImpactAnalysis`         | Analyze downstream effects of changes   |
| `undoChange` / `redoChange` | History navigation                      |
| `getSystemStats`            | Overview and statistics                 |
| `exportDesignSystem`        | Export to JSON/YAML                     |
| `exportTailwindConfig`      | Export as Tailwind v4 CSS configuration |
| `analyzeImage`              | Extract design tokens from screenshots  |

## Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start dev server (localhost:3000)
pnpm build                  # Build for production
pnpm preview                # Preview production build

# Design System
pnpm export:design-system <path>  # Export YAML tokens to JSON

# Testing
pnpm test                   # Run tests
```

### Environment Setup

Create a `.env.local` file (optional):

```env
VITE_ANTHROPIC_API_KEY=your_key_here
VITE_OPENAI_API_KEY=your_key_here
VITE_GOOGLE_API_KEY=your_key_here
```

Note: API keys can also be entered directly in the UI.

### Working with the Database

In development mode, access the database inspector via browser console:

```javascript
// View all design languages
await dbDebug.viewDesignLanguages();

// Get system statistics
await dbDebug.getStats();

// Export entire database
await dbDebug.downloadDatabase();

// Clear everything (careful!)
await dbDebug.clearAll();
```

### Importing a Design System

If you have design system YAML files:

1. Run `pnpm export:design-system /path/to/design-tokens`
2. The processed JSON will be copied to `public/data/design-system.json`

## Design Philosophy

This project explores the intersection of AI, voice interfaces, and design systems:

- **Voice-First**: Natural conversation as the primary interface
- **AI-Assisted**: Intelligent suggestions and impact analysis
- **Visual Feedback**: Real-time previews and graph visualizations
- **Safety**: Validation, dependency checks, and undo/redo
- **Local-First**: IndexedDB persistence with future cloud sync

## Roadmap

- [ ] Component tracking system (automatic usage detection)
- [ ] Cloud synchronization and collaboration
- [ ] Export to Figma tokens format
- [x] CSS Variables generation
- [x] Tailwind v4 config export with aggressive remapping (150+ token types)
- [ ] Design system versioning
- [ ] Multi-language support for voice
- [ ] Plugin system for custom tools

## License

Private project - All rights reserved

---

**Built with React, TypeScript, and AI**
