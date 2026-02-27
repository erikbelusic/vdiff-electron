# vdiff-electron

## Project Overview

GUI version of [vdiff](~/Code/vdiff) - a git diff viewer with line commenting and clipboard export for AI coding agents. Built with Electron, inspired by GitHub Desktop's UI.

## Tech Stack

- **Electron Forge** with Vite plugin
- **React** (JSX, no TypeScript)
- **CSS Modules** for styling
- **Vitest** + **React Testing Library** for unit/component tests
- **Playwright** (or @electron/test) for E2E tests

## Project Structure

```
src/
  main/          # Electron main process (Node.js)
  renderer/      # React app (runs in browser window)
    components/  # React components
    hooks/       # Custom React hooks
    utils/       # Shared utilities (git operations, diff parsing, etc.)
```

## Workflow

- **Commit after every TODO line item.** Each checkbox in TODO.md = one commit.
- Keep commits small and focused on the single item completed.
- Mark the TODO item as [x] in the same commit.

## Testing

- Use **Vitest** for unit tests and component tests (it shares Vite's config, zero extra setup)
- Use **React Testing Library** for testing React components
- Test files live next to source: `Component.jsx` → `Component.test.jsx`
- Run tests: `npm test`
- Git-related logic should be tested with mocked git output (don't require a real repo in tests)
- Diff parsing logic (ported from vdiff) should have thorough unit tests with real diff fixtures
- **Test behavior, not implementation.** If a refactor renames methods/classes/variables but app behavior stays the same, zero tests should fail or need updating. This means:
  - Assert on what the user sees and interacts with (rendered text, clicks, visible state changes), not on internal method calls or component internals
  - Don't assert on class names, internal state, or implementation details
  - Use React Testing Library queries like `getByText`, `getByRole` — avoid `querySelector` or testing internal component state
  - For utility functions, test inputs → outputs, not how the function internally computes them
- **When in doubt about how to test something, ask the user**

## Key Design Decisions

- No TypeScript - plain JSX for simplicity
- CSS Modules (scoped styles, no utility framework)
- GitHub Dark theme matching the existing vdiff viewer
- Comment export format must match vdiff CLI output exactly:
  ```
  Code Review Comments:
  - file:line
     Code: ...
     Comment: ...
  ```

## Reference

- Original vdiff CLI: `~/Code/vdiff/`
  - `viewer.html` has the diff parser, commenting system, and export logic to port
  - `vdiff.sh` has the git diff capture modes
