# Repository Guidelines

## Project Overview
This is a WXT-based browser extension project targeting modern extension runtimes (Chrome, Edge, Firefox). It uses React for UI layers and provides a comprehensive starter template with oRPC communication, state management, and multi-locale support.

The extension includes a counter example demonstrating persistent state storage, cross-module communication, and modern UI patterns. On install, it opens a welcome guide page showcasing the README content and demonstrating communication between content scripts and injected scripts.

## Technology Stack

### Core Frameworks
- **WXT** - Extension build system and runtime orchestration (v0.20.6)
- **React** - UI framework with TypeScript (v19.2.3)
- **TypeScript** - Type safety and developer experience (v5.9.3)
- **Node.js** - Runtime environment (v20+)

### Communication & State Management
- **oRPC** - Typed RPC for cross-module communication (@orpc/client, @orpc/server v1.13.2)
- **TanStack Query** - Data fetching, caching, and state management (@tanstack/react-query v5.90.16)
- **Browser Storage API** - Persistent storage via browser.storage.local (MV3 compatible)

### UI & Styling
- **Ant Design** - Component library (v6.2.1)
- **Tailwind CSS** - Utility-first CSS framework (v4.1.18)
- **Custom CSS** - Glassmorphism effects, animations, theme variables
- **Marked** - Markdown parsing for the onboarding guide (v17.0.1)

### Development Tools
- **Biome** - Code formatting and linting (v1.9.0)
- **PNPM** - Package manager (v9+)
- **@wxt-dev/auto-icons** - Automatic icon generation
- **@wxt-dev/i18n** - Internationalization module
- **@wxt-dev/module-react** - React integration for WXT

## Project Structure

```
src/
├── assets/                  # Static assets (logo.png, react.svg)
├── constants/               # Shared constants
│   └── onboarding.ts       # Onboarding guide configuration
├── entrypoints/            # Extension entry points
│   ├── background.ts       # Service worker background script
│   ├── content.ts          # Content script (Google.com)
│   ├── onboarding-injected.ts # Injected script for onboarding
│   ├── popup/              # Popup UI
│   │   ├── main.tsx       # Popup entry point
│   │   ├── App.tsx        # Popup React component
│   │   ├── style.css      # Popup-specific styles
│   │   └── ...            # Other popup files
│   └── onboarding/         # Onboarding guide page
│       ├── main.ts        # Onboarding script
│       ├── index.html     # Onboarding HTML
│       └── style.css      # Onboarding-specific styles
├── locales/               # Internationalization files
│   ├── en.yml
│   ├── zh_CN.yml
│   ├── es.yml
│   ├── fr.yml
│   └── hi.yml
└── shared/                # Shared utilities and types
    └── orpc/             # oRPC layer
        ├── constants.ts  # oRPC port name constants
        ├── extension.ts  # Extension client creation
        ├── query.ts      # TanStack Query utilities
        └── router.ts     # oRPC procedures and router
```

## Module Communication Architecture

### Extension Runtime Communication

1. **Background Service Worker** -> **Popup/Onboarding**
   - Uses **oRPC over Extension Ports** (`browser.runtime.connect`)
   - Defined in `ORPC_PORT_NAME` constant
   - Typed procedures with automatic validation
   - Example: Counter state retrieval and incrementation

2. **Content Script** -> **Injected Script** -> **Onboarding Page**
   - Uses **window.postMessage API**
   - Cross-origin isolated world communication bridge
   - Message format: `{source, type, markdown}`
   - Example: README markdown transmission demonstration

### Communication Flow

```
┌─────────────────┐     oRPC     ┌─────────────────┐     oRPC     ┌─────────────────┐
│  Popup (React)  │ ◄──────────► │  Background SW  │ ◄──────────► │ Content Script  │
└─────────────────┘              └─────────────────┘              └─────────────────┘
                                      │                                   │
                                      │                                   │ window.postMessage
                                      │                                   │
                                      │                                   ▼
                              ┌─────────────────┐              ┌─────────────────┐
                              │  Page Context   │              │ Injected Script │
                              │  (Onboarding)   │ ◄─────────── │   (onboarding-  │
                              │                 │              │   injected.ts)  │
                              └─────────────────┘              └─────────────────┘
```

## Build System & Commands

### Development Commands
```bash
pnpm dev              # Development mode (Chrome)
pnpm dev:firefox      # Development mode (Firefox)
pnpm compile          # TypeScript type checking
pnpm lint             # Run Biome linter
pnpm format           # Format code with Biome
pnpm check            # Run all Biome checks
```

### Build Commands
```bash
pnpm build           # Production build (Chrome)
pnpm build:firefox   # Production build (Firefox)
pnpm zip             # Build and zip for Chrome
pnpm zip:edge        # Build and zip for Edge
pnpm zip:firefox     # Build and zip for Firefox
```

### Build Process
1. **WXT orchestrates** the entire build pipeline
2. **TypeScript compilation** with strict type checking
3. **Automatic icon generation** from base logo.png
4. **Bundle splitting** for different entry points
5. **Manifest v3** generation with i18n support
6. **Asset optimization** and minification
7. **Zipping** for different browser stores

## Code Organization & Conventions

### File Organization Principles
- **Entry points** in `src/entrypoints/` (WXT convention)
- **Shared code** in `src/shared/` for cross-module logic
- **Constants** in `src/constants/` for configuration
- **Assets** in `src/assets/` for static resources
- **Type safety** throughout with TypeScript
- **Colocation** of styles with components when specific

### oRPC Layer
- **Router definition** in `src/shared/orpc/router.ts`
- **Procedures** are typed and validated automatically
- **Client creation** in `src/shared/orpc/extension.ts`
- **Query utilities** in `src/shared/orpc/query.ts` with caching
- **Constants** for port naming in `src/shared/orpc/constants.ts`

### Example Counter Implementation
```typescript
// Router definition
export const router = os.router({
  counter: os.router({
    get: os.handler(() => getCounter()),
    increment: os.handler(() => incrementCounter()),
  }),
})

// Client usage in React
const orpc = getOrpc()
const counterQuery = useQuery(orpc.counter.get.queryOptions())
const incrementMutation = useMutation(
  orpc.counter.increment.mutationOptions()
)
```

## Development Workflow

### Getting Started
1. Install dependencies: `pnpm install`
2. Run development server: `pnpm dev`
3. Load extension in browser from `.output/chrome-mv3/`

### Code Style
- **TypeScript** with strict configuration
- **React** with functional components and hooks
- **Biome** configured for:
  - 2-space indentation
  - 100-character line width
  - Double quotes for strings
  - ES5 trailing commas
  - Automatic import organization
  - Semicolons as needed

### Key Configuration Files
- `wxt.config.ts` - WXT extension configuration
- `biome.json` - Code formatting and linting rules
- `tsconfig.json` - TypeScript configuration
- `postcss.config.mjs` - Tailwind CSS configuration
- `package.json` - Dependencies and scripts

## Testing Strategy

### Current Testing Approach
- **Manual testing** during development via `pnpm dev`
- **Build verification** through TypeScript compilation
- **Cross-browser testing** via different zip builds
- **Onboarding flow testing** via fresh install simulation

### Recommended Testing Pattern
- Component testing with React Testing Library
- oRPC procedure testing with mock storage
- E2E testing with Playwright for extension workflows
- Visual regression testing for UI changes

## Security Considerations

### Extension Security
- **Content Security Policy** default in manifest v3
- **No remote code execution** - all code bundled
- **Storage isolation** via browser.storage API
- **Origin validation** for content script injection
- **Minimal permissions** (only `storage` currently)

### Development Security
- **Strict TypeScript** prevents many runtime errors
- **Linting rules** catch common security issues
- **GitHub Actions** use secure token handling
- **Release automation** prevents unauthorized publishes

## Deployment & CI/CD

### Automated Release Process (Release Please)
1. **Conventional Commits** trigger version calculation
2. **Release PR** created/updated automatically
3. **CHANGELOG** maintained automatically
4. **GitHub Release** created on PR merge
5. **Assets built and uploaded** automatically
6. **Version tags** created and pushed

### Commit Message Convention
- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `feat!:` or `fix!:` - Breaking changes (major version bump)
- `perf:`, `refactor:`, `chore:` - Patch version bump

### CI Pipeline (`.github/workflows/release-please.yml`)
- Runs on push to `main` branch
- Uses Google Release Please Action
- Builds for Chrome and Edge via `pnpm zip`
- Uploads `.zip` files to GitHub Release assets

## Browser Compatibility

### Supported Browsers
- **Chrome** - Primary development target (MV3)
- **Edge** - Compatible via Chrome build
- **Firefox** - Supported with separate build (`-b firefox`)

### Manifest Configuration
- **Manifest v3** for Chrome/Edge
- **Firefox manifest** auto-generated by WXT
- **Permissions**: `storage` only
- **Web accessible resources**: `onboarding-injected.js`
- **Content script matches**: `*://*.google.com/*`

## Internationalization

### i18n Implementation
- **Browser i18n API** with YAML locale files
- **Supported locales**: en, zh_CN, es, fr, hi
- **Dynamic message loading** via WXT i18n module
- **Runtime message lookup** in popup component
- **Manifest localization** via `__MSG_` placeholders

### Locale File Structure
```yaml
# src/locales/en.yml
appName: chrome-extension-starter
appDescription: Communication via oRPC + React Query.
```

## Troubleshooting Common Issues

### Development Issues
- **Hot reload** - WXT handles automatically
- **Port not found** - Check `ORPC_PORT_NAME` matches
- **Storage access** - Ensure `storage` permission in manifest
- **Build errors** - Run `pnpm compile` for TypeScript errors

### Build Issues
- **Icon generation** - Ensure `assets/logo.png` exists
- **Zip creation** - Check `.output` directory permissions
- **Firefox compatibility** - Test with `pnpm dev:firefox`

### Runtime Issues
- **oRPC connection** - Verify background script is running
- **Content script injection** - Check URL matches in manifest
- **Message passing** - Use unique `source` identifiers
- **Storage persistence** - Use `browser.storage.local` API

## Dependencies Management

### Production Dependencies
- Keep **oRPC** packages updated for bug fixes
- **Ant Design v6** for latest features and security
- **React 19** for latest capabilities
- **Tailwind CSS v4** for utility classes

### Development Dependencies
- **WXT modules** for extended functionality
- **TypeScript** for type safety
- **Biome** for consistent code style
- **PostCSS** for Tailwind CSS processing

### Update Strategy
- Use `pnpm outdated` to check for updates
- Test thoroughly after major version updates
- Review changelogs for breaking changes
- Update AGENTS.md when architecture changes
