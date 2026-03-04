# vdiff-electron - Project Plan

A GUI version of [vdiff](~/Code/vdiff) built with Electron, inspired by GitHub Desktop's UI.
Core value: view git diffs + comment on lines + export to clipboard for AI coding agents.

---

## Tech Stack

- **Electron Forge** with Vite plugin (scaffolding, packaging, dev server)
- **React** (JSX, no TypeScript)
- **CSS Modules** for scoped styling
- **Git** via `simple-git` npm package (or raw child_process exec)
- **GitHub Dark theme** (matching the existing vdiff viewer)

**Workflow**: Commit after every line item. Each checkbox = one commit.

---

## MVP Features

### 1. Project Scaffolding
- [x] Initialize Electron Forge project with Vite + React template
- [x] Set up project structure: `src/main/` (electron), `src/renderer/` (react)
- [x] Configure CSS Modules
- [x] Get a blank window rendering a React app with hot-reload
- [x] Set up Vitest + React Testing Library (test runner, first passing test)

### 2. Project Selection (Repository Management)
- [x] Welcome/landing screen when no repo is selected
- [x] "Add Repository" button - opens native folder picker dialog
- [x] Validate selected folder is a git repository
- [x] Persist list of added repos (store in electron-store or JSON file in app data)
- [x] Repository list in sidebar/dropdown (like GitHub Desktop's top-left repo picker)
- [x] Remove repository from list (doesn't delete files)
- [x] Show current branch name next to repo name
- [x] Remember last-opened repo on app restart

### 3. GitHub Desktop-Style Layout
- [x] Top bar: repo selector, current branch display
- [x] Left sidebar: changed files list with +/- stats and icons (added/modified/deleted)
- [x] Right pane: diff viewer for selected file

### 4. Diff Viewer - Uncommitted Changes
- [x] Show all uncommitted changes (staged + unstaged) like GitHub Desktop
- [x] File list in sidebar with change type indicators (M, A, D, R)
- [x] Addition/deletion line counts per file
- [x] Click file in sidebar to view its diff
- [x] Diff rendering: line numbers, +/- prefixes, color-coded lines (green/red/gray)
- [x] Collapsible hunk headers with @@ line info
- [x] Syntax highlighting (highlight.js or similar)
- [x] Auto-refresh when files change (watch filesystem or poll)

### 5. Line Commenting System
- [x] Click a diff line to add a comment (single line)
- [x] Click + drag or shift+click for multiline selection
- [x] Comment input textarea with save/cancel
- [x] Visual indicators on commented lines (purple border like vdiff)
- [x] Edit existing comments by clicking them
- [x] Delete comments (x button)
- [x] Comment count badge in toolbar
- [x] Keyboard shortcuts: Cmd/Ctrl+Enter to save, Escape to cancel

### 6. Export to Clipboard
- [ ] Bottom area: comment export panel (collapsible, like vdiff's prompt output panel)
- [ ] "Prompt Output" panel showing all comments in LLM-friendly format
- [x] Same export format as vdiff CLI:
  ```
  Code Review Comments:
  - file:line
     Code: ...
     Comment: ...
  ```
- [ ] "Copy to Clipboard" button with toast confirmation
- [ ] Panel is collapsible/toggleable

---

## Future Enhancements

### Project Management
- [ ] Auto-scan directories (~/Code, ~/Projects, etc.) to discover git repos
- [ ] Drag-and-drop folder onto app to add repo
- [ ] Recent repositories list
- [ ] Repository search/filter
- [ ] Repository grouping/categorization

### Branch Management
- [ ] Branch switcher dropdown (like GitHub Desktop)
- [ ] Create new branch
- [ ] Branch list with filter/search
- [ ] Pull/push buttons
- [ ] Merge branch UI
- [ ] Conflict resolution viewer

### Commit History
- [ ] Commit log view (list of past commits)
- [ ] Click commit to view its diff
- [ ] Commit graph visualization
- [ ] Filter commits by author, date, message

### Advanced Diff Modes
- [ ] Branch diff (all changes on current branch vs base)
- [ ] Compare arbitrary branches/commits
- [ ] Side-by-side diff view (in addition to unified)
- [ ] Word-level diff highlighting
- [ ] Image diff support
- [ ] Binary file handling

### Enhanced Commenting
- [ ] Persist comments across sessions (per-repo storage)
- [ ] Comment templates / quick reactions
- [ ] Export format customization (different AI agents may prefer different formats)
- [ ] Direct paste into terminal / AI agent integration
- [ ] Comment threads / replies

### UI Polish
- [ ] Light/dark theme toggle
- [ ] Customizable font size
- [ ] Keyboard shortcut overlay (? key)
- [ ] File search/filter in sidebar
- [ ] Minimap for large diffs
- [ ] Breadcrumb navigation for deep file paths

### Distribution
- [ ] macOS .dmg packaging
- [ ] Auto-update support (electron-updater)
- [ ] Windows build
- [ ] Linux AppImage/deb build
- [ ] Code signing

### Integration
- [ ] Open file in VS Code / editor of choice
- [ ] Terminal integration (open repo in terminal)
- [ ] GitHub/GitLab PR integration
- [ ] Stacked diffs support (aviator-cli integration from vdiff)
