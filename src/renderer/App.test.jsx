import { render, screen } from '@testing-library/react';
import { test, expect, beforeEach } from 'vitest';
import App from './App';

beforeEach(() => {
  window.electronAPI = {
    getRepositories: async () => [],
    getLastOpened: async () => null,
    selectFolder: async () => ({ path: null }),
    removeRepository: async () => [],
    setLastOpened: async () => {},
    getCompactOutput: async () => false,
    setCompactOutput: async () => {},
    getCurrentBranch: async () => 'main',
    getChangedFiles: async () => [],
    getFileDiff: async () => '',
    loadComments: async () => [],
    saveComments: async () => {},
    pruneExpiredBranches: async () => {},
    getCommentExpiryDays: async () => 30,
    setCommentExpiryDays: async () => {},
    checkForUpdate: async () => null,
  };
});

test('shows welcome screen when no repos are configured', async () => {
  render(<App />);
  expect(
    await screen.findByRole('button', { name: /add repository/i }),
  ).toBeInTheDocument();
});
