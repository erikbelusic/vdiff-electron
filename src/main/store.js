import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { getGitCommonDir, listWorktrees } from './git.js';

const storePath = path.join(app.getPath('userData'), 'repositories.json');

function readStore() {
  try {
    const data = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { schemaVersion: 1, projects: [], lastOpened: null };
  }
}

function writeStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

// --- Migration logic (exported for testing) ---

export async function applyMigrations(store, gitOps = { getGitCommonDir, listWorktrees }) {
  const version = store.schemaVersion ?? 0;
  let current = store;
  if (version < 1) current = await migrateV0toV1(current, gitOps);
  return current;
}

async function migrateV0toV1(store, { getGitCommonDir: gitCommonDir, listWorktrees: gitWorktrees }) {
  const paths = store.repositories || [];
  const seen = new Map(); // gitCommonDir → { gitCommonDir, mainPath }
  for (const repoPath of paths) {
    const commonDir = await gitCommonDir(repoPath).catch(() => null);
    const key = commonDir || repoPath;
    if (!seen.has(key)) {
      const worktrees = await gitWorktrees(repoPath).catch(() => []);
      const main = worktrees.find((wt) => wt.path === repoPath)
        ? repoPath
        : (worktrees[0]?.path || repoPath);
      seen.set(key, { gitCommonDir: key, mainPath: main });
    }
  }
  return {
    schemaVersion: 1,
    projects: Array.from(seen.values()),
    lastOpened: store.lastOpened || null,
    compactOutput: store.compactOutput,
    commentExpiryDays: store.commentExpiryDays,
  };
}

export async function migrateStore() {
  let store = readStore();
  if ((store.schemaVersion ?? 0) >= 1) return;
  store = await applyMigrations(store);
  writeStore(store);
}

// --- Project CRUD ---

export async function getProjects() {
  return readStore().projects || [];
}

export async function addProject(repoPath) {
  const store = readStore();
  const commonDir = await getGitCommonDir(repoPath);
  if (!commonDir) throw new Error('Not a git repository');
  const projects = store.projects || [];
  const exists = projects.some((p) => p.gitCommonDir === commonDir);
  if (!exists) {
    const worktrees = await listWorktrees(repoPath);
    const main = worktrees.find((wt) => wt.path === repoPath)
      ? repoPath
      : (worktrees[0]?.path || repoPath);
    projects.push({ gitCommonDir: commonDir, mainPath: main });
    store.projects = projects;
    writeStore(store);
  }
  return projects;
}

export function removeProject(gitCommonDir) {
  const store = readStore();
  store.projects = (store.projects || []).filter((p) => p.gitCommonDir !== gitCommonDir);
  if (store.lastOpened) {
    // clear lastOpened if it belonged to this project (checked at runtime)
    // we can't know the worktree paths here without calling git, so leave it;
    // App.jsx handles the stale-lastOpened fallback on startup
  }
  writeStore(store);
  return store.projects;
}

export function getLastOpened() {
  return readStore().lastOpened;
}

export function setLastOpened(repoPath) {
  const store = readStore();
  store.lastOpened = repoPath;
  writeStore(store);
}

export function getCompactOutput() {
  return readStore().compactOutput || false;
}

export function setCompactOutput(value) {
  const store = readStore();
  store.compactOutput = value;
  writeStore(store);
}

export function getCommentExpiryDays() {
  return readStore().commentExpiryDays || 30;
}

export function setCommentExpiryDays(value) {
  const store = readStore();
  store.commentExpiryDays = value;
  writeStore(store);
}

// Keep old API shims so existing IPC handlers continue to work during transition
export function getRepositories() {
  const store = readStore();
  return (store.projects || []).map((p) => p.mainPath);
}

export function addRepository(repoPath) {
  return addProject(repoPath).then((projects) => projects.map((p) => p.mainPath));
}

export function removeRepository(repoPath) {
  const store = readStore();
  const project = (store.projects || []).find((p) => p.mainPath === repoPath);
  if (project) removeProject(project.gitCommonDir);
  return getRepositories();
}
