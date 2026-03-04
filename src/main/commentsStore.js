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

export function getComments(repoPath) {
  const store = readStore();
  return store[repoPath] || [];
}

export function saveComments(repoPath, comments) {
  const store = readStore();
  store[repoPath] = comments;
  writeStore(store);
}
