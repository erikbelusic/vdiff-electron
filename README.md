# vdiff-electron

GUI version of [vdiff](https://github.com/erikbelusic/vdiff) — a git diff viewer with line commenting and clipboard export for AI coding agents. Built with Electron, inspired by GitHub Desktop.

## Prerequisites

- [Node.js](https://nodejs.org/) v24+ (LTS)
- npm (comes with Node)
- Git

## Getting Started

```bash
npm install
npm start
```

This launches the Electron app with Vite hot-reload. Edit any file in `src/renderer/` and changes appear instantly without restarting.

## Scripts

| Command | What it does |
|---------|-------------|
| `npm start` | Launch the app in development mode with hot-reload |
| `npm test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode (re-runs on file changes) |
| `npm run package` | Package the app for your current platform (output in `out/`) |
| `npm run make` | Build distributable installers (future — not fully configured yet) |

## Project Structure

```
src/
  main/              # Electron main process (Node.js, runs in background)
    main.js          # App entry point — creates the browser window
    preload.js       # Preload script — bridge between main and renderer
  renderer/          # React app (runs in the Electron browser window)
    App.jsx          # Root React component
    renderer.jsx     # React entry point (mounts App into the DOM)
    index.css        # Global styles
    *.module.css     # Component-scoped styles (CSS Modules)
    *.test.jsx       # Tests live next to the files they test

forge.config.js          # Electron Forge config (packaging, plugins)
vite.main.config.mjs     # Vite config for the main process
vite.preload.config.mjs  # Vite config for the preload script
vite.renderer.config.mjs # Vite config for the renderer (React, CSS Modules)
vitest.config.mjs        # Test runner config
```

### Main vs Renderer

Electron apps have two contexts:

- **Main process** (`src/main/`) — Node.js environment. Manages windows, system dialogs, file access, git operations. Has full OS access.
- **Renderer process** (`src/renderer/`) — Browser environment. The React UI. Communicates with main process via IPC (inter-process communication) through the preload script.

## Testing

Tests use [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).

```bash
# Run all tests
npm test

# Watch mode — re-runs on save
npm run test:watch
```

Test files are co-located with source files: `App.jsx` → `App.test.jsx`.

Tests focus on **behavior** (what the user sees and interacts with), not implementation details. A rename refactor should never break tests.
