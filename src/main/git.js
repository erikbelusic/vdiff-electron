import { execFile } from 'node:child_process';

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

async function getNumStats(dirPath) {
  const stats = {};
  // Staged changes
  const staged = await run(['diff', '--cached', '--numstat'], dirPath).catch(() => '');
  // Unstaged changes
  const unstaged = await run(['diff', '--numstat'], dirPath).catch(() => '');

  for (const output of [staged, unstaged]) {
    for (const line of output.split('\n')) {
      if (!line) continue;
      const [add, del, file] = line.split('\t');
      if (!file) continue;
      if (!stats[file]) stats[file] = { additions: 0, deletions: 0 };
      // Binary files show '-' for counts
      if (add !== '-') stats[file].additions += parseInt(add, 10);
      if (del !== '-') stats[file].deletions += parseInt(del, 10);
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
    // Try staged diff first, fall back to unstaged
    const staged = await run(['diff', '--cached', '--', filePath], dirPath)
      .catch(() => '');
    const unstaged = await run(['diff', '--', filePath], dirPath)
      .catch(() => '');

    if (staged && unstaged) return staged + '\n' + unstaged;
    if (staged) return staged;
    if (unstaged) return unstaged;

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
