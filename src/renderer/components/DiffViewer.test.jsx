import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, beforeEach, vi } from 'vitest';
import DiffViewer from './DiffViewer';

const defaultProps = {
  comments: [],
  onAddComment: vi.fn(),
  onUpdateComment: vi.fn(),
  onDeleteComment: vi.fn(),
};

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
  render(<DiffViewer repoPath="/repo" filePath={null} {...defaultProps} />);
  expect(screen.getByText('Select a file to view its diff')).toBeInTheDocument();
});

test('renders diff lines with additions and deletions', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  // With syntax highlighting, text is split across spans, so use a function matcher
  expect(await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  )).toBeInTheDocument();
  expect(screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 2;',
  )).toBeInTheDocument();
});

test('renders hunk header', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  expect(
    await screen.findByText(/@@ -1,3 \+1,3 @@ function init\(\)/),
  ).toBeInTheDocument();
});

test('collapses and expands hunk when header is clicked', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

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

test('shift+click selects range and opens comment input', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  // Wait for diff to render
  const firstLine = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const a = 1;',
  );
  const lastLine = screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );

  // Click first line (sets anchor)
  await userEvent.click(firstLine.closest('tr'));
  // Shift+click last line (selects range)
  await userEvent.click(lastLine.closest('tr'), { shiftKey: true });

  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
});

test('clicking a diff line opens comment textarea', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  await userEvent.click(line.closest('tr'));

  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

test('saving a comment displays it below the line', async () => {
  const onAddComment = vi.fn();
  const { rerender } = render(
    <DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} onAddComment={onAddComment} />
  );

  // Click a line to open comment input
  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  await userEvent.click(line.closest('tr'));

  // Type and save
  const textarea = screen.getByPlaceholderText('Add a comment...');
  await userEvent.type(textarea, 'Fix this variable');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onAddComment).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'Fix this variable' }),
  );

  // Re-render with the saved comment in props
  const savedComment = {
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-2'],  // hunk 0, line index 2 (the addition line)
    lineNum: '2',
    code: 'const b = 3;',
    text: 'Fix this variable',
  };
  rerender(
    <DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} comments={[savedComment]} />
  );

  expect(screen.getByText('Fix this variable')).toBeInTheDocument();
  expect(screen.getByText('Line 2')).toBeInTheDocument();
});
