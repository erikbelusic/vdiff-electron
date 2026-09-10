import { describe, test, expect } from 'vitest';
import { parseWorktreePorcelain, parseCommitLog, parseCommitNameStatus, parseNumStatOutput } from './git.js';

const SINGLE_WORKTREE = `worktree /repo/main
HEAD abc1234567890abc1234567890abc1234567890ab
branch refs/heads/main`;

const MULTI_WORKTREE = `worktree /repo/main
HEAD abc1234567890abc1234567890abc1234567890ab
branch refs/heads/main

worktree /repo/main.feature-foo
HEAD def4567890abc1234567890abc1234567890abcd
branch refs/heads/feature/foo

worktree /repo/main.fix-bar
HEAD ghi7890abc1234567890abc1234567890abcdef12
branch refs/heads/fix/bar`;

const DETACHED_WORKTREE = `worktree /repo/main
HEAD abc1234567890abc1234567890abc1234567890ab
branch refs/heads/main

worktree /repo/main.detached
HEAD def4567890abc1234567890abc1234567890abcd
detached`;

const LOCKED_WORKTREE = `worktree /repo/main
HEAD abc1234567890abc1234567890abc1234567890ab
branch refs/heads/main

worktree /repo/main.locked-branch
HEAD def4567890abc1234567890abc1234567890abcd
branch refs/heads/some-branch
locked reason: manually locked for testing`;

describe('parseWorktreePorcelain', () => {
  test('parses a single worktree', () => {
    const result = parseWorktreePorcelain(SINGLE_WORKTREE);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/repo/main');
    expect(result[0].branch).toBe('main');
    expect(result[0].head).toBe('abc1234567890abc1234567890abc1234567890ab');
    expect(result[0].detached).toBe(false);
    expect(result[0].locked).toBe(false);
  });

  test('parses multiple worktrees', () => {
    const result = parseWorktreePorcelain(MULTI_WORKTREE);
    expect(result).toHaveLength(3);
    expect(result[0].path).toBe('/repo/main');
    expect(result[0].branch).toBe('main');
    expect(result[1].path).toBe('/repo/main.feature-foo');
    expect(result[1].branch).toBe('feature/foo');
    expect(result[2].path).toBe('/repo/main.fix-bar');
    expect(result[2].branch).toBe('fix/bar');
  });

  test('parses detached HEAD worktree', () => {
    const result = parseWorktreePorcelain(DETACHED_WORKTREE);
    expect(result).toHaveLength(2);
    expect(result[1].detached).toBe(true);
    expect(result[1].branch).toBeUndefined();
  });

  test('parses locked worktree', () => {
    const result = parseWorktreePorcelain(LOCKED_WORKTREE);
    expect(result).toHaveLength(2);
    expect(result[1].locked).toBe(true);
    expect(result[1].branch).toBe('some-branch');
  });

  test('returns empty array for empty input', () => {
    expect(parseWorktreePorcelain('')).toEqual([]);
  });
});

describe('parseCommitLog', () => {
  test('parses commit log lines into commit objects', () => {
    const output = [
      'abc123full\x1fabc123\x1fJane Doe\x1f2 hours ago\x1fFix login bug',
      'def456full\x1fdef456\x1fJohn Smith\x1f1 day ago\x1fAdd tests',
    ].join('\n');
    const result = parseCommitLog(output);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      hash: 'abc123full',
      shortHash: 'abc123',
      author: 'Jane Doe',
      relativeDate: '2 hours ago',
      subject: 'Fix login bug',
    });
    expect(result[1].subject).toBe('Add tests');
  });

  test('returns empty array for empty input', () => {
    expect(parseCommitLog('')).toEqual([]);
  });
});

describe('parseNumStatOutput', () => {
  test('parses numstat lines into a path-keyed map', () => {
    const output = '5\t2\tsrc/main.js\n10\t0\tsrc/new.js';
    expect(parseNumStatOutput(output)).toEqual({
      'src/main.js': { additions: 5, deletions: 2 },
      'src/new.js': { additions: 10, deletions: 0 },
    });
  });

  test('treats "-" counts (binary files) as zero', () => {
    const output = '-\t-\tsrc/image.png';
    expect(parseNumStatOutput(output)).toEqual({
      'src/image.png': { additions: 0, deletions: 0 },
    });
  });

  test('returns empty object for empty input', () => {
    expect(parseNumStatOutput('')).toEqual({});
  });
});

describe('parseCommitNameStatus', () => {
  test('parses added, modified, and deleted files with stats', () => {
    const output = 'A\tsrc/new.js\nM\tsrc/main.js\nD\tsrc/old.js';
    const numStats = {
      'src/new.js': { additions: 10, deletions: 0 },
      'src/main.js': { additions: 5, deletions: 2 },
      'src/old.js': { additions: 0, deletions: 8 },
    };
    const result = parseCommitNameStatus(output, numStats);
    expect(result).toEqual([
      { path: 'src/new.js', status: 'A', additions: 10, deletions: 0 },
      { path: 'src/main.js', status: 'M', additions: 5, deletions: 2 },
      { path: 'src/old.js', status: 'D', additions: 0, deletions: 8 },
    ]);
  });

  test('strips similarity score from rename/copy status and uses the new path', () => {
    const output = 'R100\tsrc/old-name.js\tsrc/new-name.js';
    const numStats = { 'src/new-name.js': { additions: 1, deletions: 1 } };
    const result = parseCommitNameStatus(output, numStats);
    expect(result).toEqual([
      { path: 'src/new-name.js', status: 'R', additions: 1, deletions: 1 },
    ]);
  });

  test('returns empty array for empty input', () => {
    expect(parseCommitNameStatus('', {})).toEqual([]);
  });
});
