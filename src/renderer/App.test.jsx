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
  };
});

test('shows welcome screen when no repos are configured', async () => {
  render(<App />);
  expect(
    await screen.findByRole('button', { name: /add repository/i }),
  ).toBeInTheDocument();
});
