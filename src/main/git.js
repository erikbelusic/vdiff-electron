import { execFile } from 'node:child_process';

function run(args, cwd) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
}

export function isGitRepo(dirPath) {
  return run(['rev-parse', '--git-dir'], dirPath)
    .then(() => true)
    .catch(() => false);
}

export function getCurrentBranch(dirPath) {
  return run(['rev-parse', '--abbrev-ref', 'HEAD'], dirPath)
    .then((out) => out.trim())
    .catch(() => null);
}

export async function getChangedFiles(dirPath) {
  // Get both staged and unstaged changes in one call
  const output = await run(
    ['status', '--porcelain=v1', '-uall'],
    dirPath,
  );

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

      return {
        path: filePath,
        status,
        staged: staged !== ' ' && staged !== '?',
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

    // Untracked file — show entire contents as addition
    const content = await run(['show', ':' + filePath], dirPath)
      .catch(() => null);
    if (content !== null) return content;

    // Truly untracked — read via diff against empty tree
    return run(
      ['diff', '--no-index', '/dev/null', filePath],
      dirPath,
    ).catch((err) => {
      // git diff --no-index exits with 1 when there are differences
      if (err.stdout) return err.stdout;
      return '';
    });
  } catch {
    return '';
  }
}
