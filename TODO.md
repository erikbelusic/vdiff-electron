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
- [x] Bottom area: comment export panel (collapsible, like vdiff's prompt output panel)
- [x] "Prompt Output" panel showing all comments in LLM-friendly format
- [x] Same export format as vdiff CLI:
  ```
  Code Review Comments:
  - file:line
     Code: ...
     Comment: ...
  ```
- [x] "Copy to Clipboard" button with toast confirmation
- [x] Panel is collapsible/toggleable

### 7. Productionization & Distribution
- [x] App icon (.icns for macOS) in `assets/`, configured in forge.config.js
- [x] Configure DMG maker for macOS (hdiutil postMake hook)
- [x] Configure GitHub publisher (@electron-forge/publisher-github)
- [x] Update check notification — banner on launch if newer version exists on GitHub

### 8. Worktree Support

Goal: open multiple worktrees of the same project concurrently, each in its own tab, without polluting the repo list with one entry per worktree path. Add a project once (via any worktree path) and the app discovers siblings automatically via `git worktree list`.

**Decisions captured from design discussion:**
- Project identity: shared git common dir (`git rev-parse --git-common-dir`)
- Project display name: directory name of the main worktree (auto, not editable for now)
- Worktree label: branch name + directory suffix (covers stacked-branch worktree workflows)
- Picker UI: render flat until a project has 2+ worktrees, then render as two-level
- Adding a project: silent registration of the whole project (no confirmation dialog)
- Refresh: re-run `git worktree list` on picker open (cheap; door left open for other triggers)
- Storage migrations: versioned schema with a structured migration runner (no ad-hoc one-offs)

**Storage / migrations**
- [ ] Add `schemaVersion` field to `repositories.json` and a migration runner in `store.js` that applies ordered migrations on read
- [ ] Define v1 schema: replace flat `repositories: string[]` with `projects: [{ gitCommonDir, mainPath }]`; keep `lastOpened` as a worktree path string
- [ ] Write v0 → v1 migration: for each existing repo path, resolve its git common dir + main worktree, dedupe by common dir, and rewrite into the new shape
- [ ] Unit tests for the migration runner (idempotent re-runs, malformed/legacy inputs, dedupe behavior)

**Main process (git ops)**
- [x] Add `getGitCommonDir(path)` helper using `git rev-parse --git-common-dir`
- [x] Add `listWorktrees(path)` that runs `git worktree list --porcelain` and returns `[{ path, branch, head, detached }]`
- [ ] IPC: `project:list` returns `[{ id, name, mainPath, worktrees: [...] }]` (worktrees freshly fetched per call)
- [ ] IPC: `project:add(path)` resolves common dir, dedupes, persists, returns updated project list
- [ ] IPC: `project:remove(id)` removes a whole project (all its worktrees go with it)

**Renderer (picker UI)**
- [ ] Refactor `RepositoryPicker` to consume projects instead of flat paths; `onSelectRepo` still emits a worktree path
- [ ] Render flat single-worktree projects exactly as today (no visual change for users without worktrees)
- [ ] Render two-level UI for projects with 2+ worktrees: project header + indented worktree rows
- [ ] Worktree row label: `branch (dirSuffix)` e.g. `feature/foo (.feature-foo)`; show `(detached @ sha)` when detached
- [ ] Refresh project list (re-call `project:list`) when the picker opens
- [ ] Disabled state: a worktree path already open in another tab is greyed out (extend existing `disabledRepos` logic to operate on worktree paths)
- [ ] Remove button at the project level (removes the whole project); no per-worktree remove

**App wiring**
- [ ] Replace `getRepositories` calls in `App.jsx` with the new `project:list` flow; tabs continue to store a `repoPath` (worktree path) — no tab-shape changes
- [ ] On startup, if `lastOpened` points to a worktree path that no longer exists in any project's discovered worktrees, fall back gracefully (clear it)
- [ ] Welcome screen continues to work when there are zero projects

**Tests**
- [x] Unit tests for `listWorktrees` parser against fixture porcelain output (single worktree, multiple worktrees, detached HEAD, locked worktree)
- [ ] Component test: picker renders flat for 1-worktree projects, two-level for 2+
- [ ] Component test: selecting a worktree already open in another tab is disabled
- [ ] Component test: removing a project removes all its worktrees from the list

**Out of scope for this section (door left open):**
- Editable project labels
- Refreshing worktrees on tab switch / focus / interval
- Creating, removing, or pruning worktrees from the UI
- Per-worktree remove

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
