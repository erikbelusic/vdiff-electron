import { describe, test, expect, vi } from 'vitest';

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/test-userData' } }));
vi.mock('node:fs', () => ({ default: { readFileSync: vi.fn(() => { throw new Error(); }), writeFileSync: vi.fn() } }));

const { applyMigrations } = await import('./store.js');

function makeGitOps({ commonDirMap = {}, worktreesMap = {} } = {}) {
  return {
    getGitCommonDir: vi.fn((p) => Promise.resolve(commonDirMap[p] ?? null)),
    listWorktrees: vi.fn((p) => Promise.resolve(worktreesMap[p] ?? [])),
  };
}

describe('applyMigrations', () => {
  test('v0→v1: converts flat repositories to projects', async () => {
    const store = { repositories: ['/repo/main'], lastOpened: '/repo/main' };
    const gitOps = makeGitOps({
      commonDirMap: { '/repo/main': '/repo/.git' },
      worktreesMap: { '/repo/main': [{ path: '/repo/main', branch: 'main' }] },
    });

    const result = await applyMigrations(store, gitOps);

    expect(result.schemaVersion).toBe(1);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toEqual({ gitCommonDir: '/repo/.git', mainPath: '/repo/main' });
    expect(result.lastOpened).toBe('/repo/main');
  });

  test('v0→v1: deduplicates paths sharing the same gitCommonDir', async () => {
    const store = {
      repositories: ['/repo/main', '/repo/main.feature-foo'],
    };
    const gitOps = makeGitOps({
      commonDirMap: {
        '/repo/main': '/repo/.git',
        '/repo/main.feature-foo': '/repo/.git',
      },
      worktreesMap: {
        '/repo/main': [{ path: '/repo/main' }, { path: '/repo/main.feature-foo' }],
      },
    });

    const result = await applyMigrations(store, gitOps);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].gitCommonDir).toBe('/repo/.git');
  });

  test('v0→v1: multiple distinct projects remain separate', async () => {
    const store = {
      repositories: ['/proj-a/main', '/proj-b/main'],
    };
    const gitOps = makeGitOps({
      commonDirMap: {
        '/proj-a/main': '/proj-a/.git',
        '/proj-b/main': '/proj-b/.git',
      },
      worktreesMap: {
        '/proj-a/main': [{ path: '/proj-a/main' }],
        '/proj-b/main': [{ path: '/proj-b/main' }],
      },
    });

    const result = await applyMigrations(store, gitOps);

    expect(result.projects).toHaveLength(2);
  });

  test('v0→v1: falls back to path as key when git fails', async () => {
    const store = { repositories: ['/repo/main'] };
    const gitOps = makeGitOps({}); // getGitCommonDir returns null

    const result = await applyMigrations(store, gitOps);

    expect(result.projects).toHaveLength(1);
    expect(result.projects[0].gitCommonDir).toBe('/repo/main');
    expect(result.projects[0].mainPath).toBe('/repo/main');
  });

  test('v0→v1: handles empty repositories list', async () => {
    const store = { repositories: [] };
    const result = await applyMigrations(store, makeGitOps());
    expect(result.projects).toEqual([]);
    expect(result.schemaVersion).toBe(1);
  });

  test('v0→v1: handles missing repositories key', async () => {
    const store = {};
    const result = await applyMigrations(store, makeGitOps());
    expect(result.projects).toEqual([]);
  });

  test('idempotent: schemaVersion 1 store is returned unchanged', async () => {
    const store = {
      schemaVersion: 1,
      projects: [{ gitCommonDir: '/repo/.git', mainPath: '/repo/main' }],
      lastOpened: '/repo/main',
    };
    const gitOps = makeGitOps();

    const result = await applyMigrations(store, gitOps);

    expect(result).toEqual(store);
    expect(gitOps.getGitCommonDir).not.toHaveBeenCalled();
  });

  test('preserves compactOutput and commentExpiryDays across migration', async () => {
    const store = {
      repositories: [],
      compactOutput: true,
      commentExpiryDays: 7,
    };
    const result = await applyMigrations(store, makeGitOps());
    expect(result.compactOutput).toBe(true);
    expect(result.commentExpiryDays).toBe(7);
  });
});
