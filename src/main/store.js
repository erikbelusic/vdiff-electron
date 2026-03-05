import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

const storePath = path.join(app.getPath('userData'), 'repositories.json');

function readStore() {
  try {
    const data = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { repositories: [], lastOpened: null };
  }
}

function writeStore(data) {
  fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
}

export function getRepositories() {
  return readStore().repositories;
}

export function addRepository(repoPath) {
  const store = readStore();
  if (!store.repositories.includes(repoPath)) {
    store.repositories.push(repoPath);
  }
  store.lastOpened = repoPath;
  writeStore(store);
  return store.repositories;
}

export function removeRepository(repoPath) {
  const store = readStore();
  store.repositories = store.repositories.filter((r) => r !== repoPath);
  if (store.lastOpened === repoPath) {
    store.lastOpened = null;
  }
  writeStore(store);
  return store.repositories;
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
