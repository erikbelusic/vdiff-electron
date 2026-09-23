import { execFile } from 'node:child_process';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

function run(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        error.stdout = stdout;
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

export async function getGitCommonDir(dirPath) {
  try {
    const result = (await run(['rev-parse', '--git-common-dir'], dirPath)).trim();
    return path.resolve(dirPath, result);
  } catch {
    return null;
  }
}

export function parseWorktreePorcelain(output) {
  const worktrees = [];
  for (const block of output.trim().split('\n\n')) {
    const lines = block.trim().split('\n');
    const wt = { detached: false, locked: false };
    for (const line of lines) {
      if (line.startsWith('worktree ')) wt.path = line.slice(9);
      else if (line.startsWith('HEAD ')) wt.head = line.slice(5);
      else if (line.startsWith('branch ')) wt.branch = line.slice(7).replace('refs/heads/', '');
      else if (line === 'detached') wt.detached = true;
      else if (line.startsWith('locked')) wt.locked = true;
    }
    if (wt.path) worktrees.push(wt);
  }
  return worktrees;
}

export async function listWorktrees(dirPath) {
  try {
    const output = await run(['worktree', 'list', '--porcelain'], dirPath);
    return parseWorktreePorcelain(output);
  } catch {
    return [];
  }
}

export function isGitRepo(dirPath) {
  return run(['rev-parse', '--git-dir'], dirPath)
    .then(() => true)
    .catch(() => false);
}

export async function getCurrentBranch(dirPath) {
  try {
    const branch = (await run(['rev-parse', '--abbrev-ref', 'HEAD'], dirPath)).trim();
    if (branch === 'HEAD') {
      // Detached HEAD — use short SHA instead
      return (await run(['rev-parse', '--short', 'HEAD'], dirPath)).trim();
    }
    return branch;
  } catch {
    return null;
  }
}

export function parseNumStatOutput(output) {
  const stats = {};
  for (const line of output.split('\n')) {
    if (!line) continue;
    const [add, del, file] = line.split('\t');
    if (!file) continue;
    if (!stats[file]) stats[file] = { additions: 0, deletions: 0 };
    // Binary files show '-' for counts
    if (add !== '-') stats[file].additions += parseInt(add, 10);
    if (del !== '-') stats[file].deletions += parseInt(del, 10);
  }
  return stats;
}

async function getNumStats(dirPath) {
  const stats = {};
  // Staged changes
  const staged = await run(['diff', '--cached', '--numstat'], dirPath).catch(() => '');
  // Unstaged changes
  const unstaged = await run(['diff', '--numstat'], dirPath).catch(() => '');

  for (const output of [staged, unstaged]) {
    const parsed = parseNumStatOutput(output);
    for (const [file, fileStats] of Object.entries(parsed)) {
      if (!stats[file]) stats[file] = { additions: 0, deletions: 0 };
      stats[file].additions += fileStats.additions;
      stats[file].deletions += fileStats.deletions;
    }
  }
  return stats;
}

export async function getChangedFiles(dirPath) {
  // Get both staged and unstaged changes in one call
  const output = await run(
    ['status', '--porcelain=v1', '-uall'],
    dirPath,
  );

  const numStats = await getNumStats(dirPath);

  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const staged = line[0];
      const unstaged = line[1];
      const filePath = line.slice(3);

      // Determine the change type to display
      let status;
      if (staged === '?' || unstaged === '?') {
        status = 'A'; // untracked = new file
      } else if (staged === 'A' || unstaged === 'A') {
        status = 'A';
      } else if (staged === 'D' || unstaged === 'D') {
        status = 'D';
      } else if (staged === 'R' || unstaged === 'R') {
        status = 'R';
      } else {
        status = 'M';
      }

      const stats = numStats[filePath] || { additions: 0, deletions: 0 };

      return {
        path: filePath,
        status,
        staged: staged !== ' ' && staged !== '?',
        additions: stats.additions,
        deletions: stats.deletions,
      };
    });
}

export async function getFileDiff(dirPath, filePath) {
  try {
    // Diff working tree against HEAD to capture both staged and unstaged changes
    const diff = await run(['diff', 'HEAD', '--', filePath], dirPath)
      .catch(() => '');
    if (diff) return diff;

    // Untracked file — diff against empty tree to show all lines as additions
    const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf899d15363da7b23';
    return await run(
      ['diff', EMPTY_TREE, '--', filePath],
      dirPath,
    ).catch(async () => {
      // File not in index at all — use diff --no-index
      try {
        await run(['diff', '--no-index', '--', '/dev/null', filePath], dirPath);
        return '';
      } catch (err) {
        // git diff --no-index exits with 1 when there are differences
        return err.stdout || '';
      }
    });
  } catch {
    return '';
  }
}

// Full contents of the file's new version — the working tree copy, or the
// file as of `sha` when reviewing a commit. Used to expand diff context.
export async function getFileContent(dirPath, filePath, sha) {
  try {
    if (sha) return await run(['show', `${sha}:${filePath}`], dirPath);
    return await readFile(path.join(dirPath, filePath), 'utf8');
  } catch {
    return null;
  }
}

const COMMIT_LOG_FORMAT = '%H%x1f%h%x1f%an%x1f%ar%x1f%s';

export function parseCommitLog(output) {
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const [hash, shortHash, author, relativeDate, subject] = line.split('\x1f');
      return { hash, shortHash, author, relativeDate, subject };
    });
}

export async function getRecentCommits(dirPath, limit = 50) {
  try {
    const output = await run(['log', `-n${limit}`, `--pretty=format:${COMMIT_LOG_FORMAT}`], dirPath);
    return parseCommitLog(output);
  } catch {
    return [];
  }
}

export function parseCommitNameStatus(output, numStats) {
  return output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split('\t');
      const status = parts[0][0]; // strip rename/copy similarity score, e.g. R100 -> R
      const filePath = parts[parts.length - 1]; // new path for renames/copies
      const stats = numStats[filePath] || { additions: 0, deletions: 0 };
      return {
        path: filePath,
        status,
        additions: stats.additions,
        deletions: stats.deletions,
      };
    });
}

export async function getCommitChangedFiles(dirPath, sha) {
  try {
    const [nameStatus, numstat] = await Promise.all([
      run(['show', '--format=', '--name-status', sha], dirPath),
      run(['show', '--format=', '--numstat', sha], dirPath),
    ]);
    return parseCommitNameStatus(nameStatus, parseNumStatOutput(numstat));
  } catch {
    return [];
  }
}

export async function getCommitFileDiff(dirPath, sha, filePath) {
  try {
    return await run(['show', sha, '--', filePath], dirPath);
  } catch (err) {
    return err.stdout || '';
  }
}
