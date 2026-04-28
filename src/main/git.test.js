import { describe, test, expect } from 'vitest';
import { parseWorktreePorcelain } from './git.js';

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
