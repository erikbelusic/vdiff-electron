import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const storePath = path.join(app.getPath('userData'), 'comments.json');

function readStore() {
  try {
    const data = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function getComments(repoPath, branch) {
  const store = readStore();
  const repo = store[repoPath];
  if (!repo || !repo[branch]) return [];
  repo[branch].lastSeen = Date.now();
  writeStore(store);
  return repo[branch].comments || [];
}

export function saveComments(repoPath, branch, comments) {
  const store = readStore();
  if (!store[repoPath]) store[repoPath] = {};
  const existing = store[repoPath][branch] || {};
  store[repoPath][branch] = {
    ...existing,
    lastSeen: Date.now(),
    comments,
  };
  writeStore(store);
}

export function getGeneralComment(repoPath, branch) {
  const store = readStore();
  const repo = store[repoPath];
  if (!repo || !repo[branch]) return '';
  repo[branch].lastSeen = Date.now();
  writeStore(store);
  return repo[branch].generalComment || '';
}

export function saveGeneralComment(repoPath, branch, generalComment) {
  const store = readStore();
  if (!store[repoPath]) store[repoPath] = {};
  const existing = store[repoPath][branch] || { comments: [] };
  store[repoPath][branch] = {
    ...existing,
    lastSeen: Date.now(),
    generalComment,
  };
  writeStore(store);
}

export function getReviewedFiles(repoPath, key) {
  const store = readStore();
  const repo = store[repoPath];
  if (!repo || !repo[key]) return {};
  repo[key].lastSeen = Date.now();
  writeStore(store);
  return repo[key].reviewedFiles || {};
}

export function saveReviewedFiles(repoPath, key, reviewedFiles) {
  const store = readStore();
  if (!store[repoPath]) store[repoPath] = {};
  const existing = store[repoPath][key] || {};
  store[repoPath][key] = {
    ...existing,
    lastSeen: Date.now(),
    reviewedFiles,
  };
  writeStore(store);
}

export function pruneExpiredBranches(expiryDays) {
  const store = readStore();
  const cutoff = Date.now() - expiryDays * 24 * 60 * 60 * 1000;
  let changed = false;
  for (const repo of Object.keys(store)) {
    for (const branch of Object.keys(store[repo])) {
      if (store[repo][branch].lastSeen < cutoff) {
        delete store[repo][branch];
        changed = true;
      }
    }
    if (Object.keys(store[repo]).length === 0) {
      delete store[repo];
    }
  }
  if (changed) writeStore(store);
}
