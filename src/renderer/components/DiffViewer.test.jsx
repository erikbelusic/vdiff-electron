import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach, vi } from 'vitest';
import DiffViewer from './DiffViewer';

const MOCK_DIFF = `diff --git a/src/app.js b/src/app.js
--- a/src/app.js
+++ b/src/app.js
@@ -1,3 +1,3 @@ function init() {
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 4;`;

beforeEach(() => {
  window.electronAPI = {
    getFileDiff: vi.fn(async () => MOCK_DIFF),
  };
});

test('shows placeholder when no file is selected', () => {
  render(<DiffViewer repoPath="/repo" filePath={null} />);
  expect(screen.getByText('Select a file to view its diff')).toBeInTheDocument();
});

test('renders diff lines with additions and deletions', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" />);

  // With syntax highlighting, text is split across spans, so use a function matcher
  expect(await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  )).toBeInTheDocument();
  expect(screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 2;',
  )).toBeInTheDocument();
});

test('renders hunk header', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" />);

  expect(
    await screen.findByText(/@@ -1,3 \+1,3 @@ function init\(\)/),
  ).toBeInTheDocument();
});

test('collapses and expands hunk when header is clicked', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" />);

  const header = await screen.findByRole('button', { expanded: true });
  expect(screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const a = 1;',
  )).toBeInTheDocument();

  await userEvent.click(header);
  expect(screen.queryByText((_, el) =>
    el?.tagName === 'TD' && el.textContent === 'const a = 1;',
  )).not.toBeInTheDocument();

  await userEvent.click(header);
  expect(screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const a = 1;',
  )).toBeInTheDocument();
});
