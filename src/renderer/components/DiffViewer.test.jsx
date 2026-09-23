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
    getCommitFileDiff: vi.fn(async () => MOCK_DIFF),
    getFileContent: vi.fn(async () => null),
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

test('fetches the commit diff instead of the working diff when a commit is selected', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" commit="abc123" {...defaultProps} />);

  await screen.findByText(/@@ -1,3 \+1,3 @@ function init\(\)/);
  expect(window.electronAPI.getCommitFileDiff).toHaveBeenCalledWith('/repo', 'abc123', 'src/app.js');
  expect(window.electronAPI.getFileDiff).not.toHaveBeenCalled();
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

  // Click first line's gutter (sets anchor)
  await userEvent.click(firstLine.closest('tr').querySelector('td'));
  // Shift+click last line's gutter (selects range)
  await userEvent.click(lastLine.closest('tr').querySelector('td'), { shiftKey: true });

  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
});

test('clicking a diff line opens comment textarea', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  await userEvent.click(line.closest('tr').querySelector('td'));

  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

test('commented lines have visual indicator', async () => {
  const savedComment = {
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-2'],
    lineNum: '2',
    code: 'const b = 3;',
    text: 'Fix this',
  };
  render(
    <DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} comments={[savedComment]} />
  );

  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  const row = line.closest('tr');
  // The row should have the commented class which applies a purple left border
  expect(row.className).toMatch(/commented/);
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
  await userEvent.click(line.closest('tr').querySelector('td'));

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

test('clicking comment text opens edit with pre-filled text', async () => {
  const onUpdateComment = vi.fn();
  const savedComment = {
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-2'],
    lineNum: '2',
    code: 'const b = 3;',
    text: 'Original comment',
  };
  render(
    <DiffViewer
      repoPath="/repo"
      filePath="src/app.js"
      {...defaultProps}
      comments={[savedComment]}
      onUpdateComment={onUpdateComment}
    />
  );

  // Wait for diff, then click the comment text to edit
  await screen.findByText('Original comment');
  await userEvent.click(screen.getByText('Original comment'));

  // Should show textarea with existing text
  const textarea = screen.getByPlaceholderText('Add a comment...');
  expect(textarea.value).toBe('Original comment');

  // Clear and type new text, then save
  await userEvent.clear(textarea);
  await userEvent.type(textarea, 'Updated comment');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));

  expect(onUpdateComment).toHaveBeenCalledWith(1, 'Updated comment');
});

test('clicking delete removes comment', async () => {
  const onDeleteComment = vi.fn();
  const savedComment = {
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-2'],
    lineNum: '2',
    code: 'const b = 3;',
    text: 'Delete me',
  };
  render(
    <DiffViewer
      repoPath="/repo"
      filePath="src/app.js"
      {...defaultProps}
      comments={[savedComment]}
      onDeleteComment={onDeleteComment}
    />
  );

  await screen.findByText('Delete me');
  await userEvent.click(screen.getByRole('button', { name: 'Delete comment' }));

  expect(onDeleteComment).toHaveBeenCalledWith(1);
});

test('Cmd+Enter saves comment', async () => {
  const onAddComment = vi.fn();
  render(
    <DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} onAddComment={onAddComment} />
  );

  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  await userEvent.click(line.closest('tr').querySelector('td'));

  const textarea = screen.getByPlaceholderText('Add a comment...');
  await userEvent.type(textarea, 'Keyboard save');
  // Simulate Cmd+Enter
  await userEvent.type(textarea, '{Meta>}{Enter}{/Meta}');

  expect(onAddComment).toHaveBeenCalledWith(
    expect.objectContaining({ text: 'Keyboard save' }),
  );
});

test('Escape cancels comment input', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);

  const line = await screen.findByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const b = 3;',
  );
  await userEvent.click(line.closest('tr').querySelector('td'));

  expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  expect(screen.queryByPlaceholderText('Add a comment...')).not.toBeInTheDocument();
});

test('⌘F opens a find bar that counts matches case-insensitively', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);
  await screen.findByText(/@@ -1,3/);

  await userEvent.keyboard('{Meta>}f{/Meta}');
  const input = screen.getByRole('textbox', { name: 'Find in diff' });
  expect(input).toHaveFocus();

  await userEvent.type(input, 'CONST B');
  expect(screen.getByText('1 of 2')).toBeInTheDocument();
});

test('Enter, Shift+Enter, and ⌘G step through matches and wrap around', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);
  await screen.findByText(/@@ -1,3/);

  await userEvent.keyboard('{Meta>}f{/Meta}');
  await userEvent.type(screen.getByRole('textbox', { name: 'Find in diff' }), 'const');
  expect(screen.getByText('1 of 4')).toBeInTheDocument();

  await userEvent.keyboard('{Enter}');
  expect(screen.getByText('2 of 4')).toBeInTheDocument();

  await userEvent.keyboard('{Shift>}{Enter}{Enter}{/Shift}');
  expect(screen.getByText('4 of 4')).toBeInTheDocument();

  await userEvent.keyboard('{Meta>}g{/Meta}');
  expect(screen.getByText('1 of 4')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Previous match' }));
  expect(screen.getByText('4 of 4')).toBeInTheDocument();
});

test('shows "No results" when nothing matches', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);
  await screen.findByText(/@@ -1,3/);

  await userEvent.keyboard('{Meta>}f{/Meta}');
  await userEvent.type(screen.getByRole('textbox', { name: 'Find in diff' }), 'zzz');
  expect(screen.getByText('No results')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Next match' })).toBeDisabled();
});

test('Escape closes the find bar', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);
  await screen.findByText(/@@ -1,3/);

  await userEvent.keyboard('{Meta>}f{/Meta}');
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('textbox', { name: 'Find in diff' })).not.toBeInTheDocument();
});

test('navigating to a match in a collapsed hunk expands it', async () => {
  render(<DiffViewer repoPath="/repo" filePath="src/app.js" {...defaultProps} />);
  await userEvent.click(await screen.findByRole('button', { expanded: true }));

  await userEvent.keyboard('{Meta>}f{/Meta}');
  await userEvent.type(screen.getByRole('textbox', { name: 'Find in diff' }), 'const a');
  expect(screen.getByRole('button', { expanded: true })).toBeInTheDocument();
  expect(screen.getByText((_, el) =>
    el.tagName === 'TD' && el.textContent === 'const a = 1;',
  )).toBeInTheDocument();
});

// A 50-line file where line 25 changed; the hunk shows lines 22–28
const FULL_FILE = Array.from({ length: 50 }, (_, i) => (i === 24 ? 'changed 25' : `line ${i + 1}`)).join('\n') + '\n';
const MIDDLE_DIFF = `diff --git a/notes.txt b/notes.txt
--- a/notes.txt
+++ b/notes.txt
@@ -22,7 +22,7 @@
 line 22
 line 23
 line 24
-line 25
+changed 25
 line 26
 line 27
 line 28`;

const codeCell = (text) => (_, el) => el?.tagName === 'TD' && el.textContent === text;

async function renderMiddleDiff() {
  window.electronAPI.getFileDiff = vi.fn(async () => MIDDLE_DIFF);
  window.electronAPI.getFileContent = vi.fn(async () => FULL_FILE);
  render(<DiffViewer repoPath="/repo" filePath="notes.txt" {...defaultProps} />);
  await screen.findByText('21 hidden lines');
}

test('shows how many lines are hidden above and below the changes', async () => {
  await renderMiddleDiff();
  expect(screen.getByText('21 hidden lines')).toBeInTheDocument();
  expect(screen.getByText('22 hidden lines')).toBeInTheDocument();
  expect(screen.queryByText(codeCell('line 21'))).not.toBeInTheDocument();
});

test('expanding up reveals the lines just above the hunk, 20 at a time', async () => {
  await renderMiddleDiff();
  await userEvent.click(screen.getByRole('button', { name: 'Expand up' }));

  expect(screen.getByText(codeCell('line 21'))).toBeInTheDocument();
  expect(screen.getByText(codeCell('line 2'))).toBeInTheDocument();
  expect(screen.queryByText(codeCell('line 1'))).not.toBeInTheDocument();
  expect(screen.getByText('1 hidden line')).toBeInTheDocument();
});

test('expanding down reveals the lines just below the hunk', async () => {
  await renderMiddleDiff();
  await userEvent.click(screen.getByRole('button', { name: 'Expand down' }));

  expect(screen.getByText(codeCell('line 29'))).toBeInTheDocument();
  expect(screen.getByText(codeCell('line 48'))).toBeInTheDocument();
  expect(screen.queryByText(codeCell('line 49'))).not.toBeInTheDocument();
  expect(screen.getByText('2 hidden lines')).toBeInTheDocument();
});

test('expanding all on every gap shows the whole file', async () => {
  await renderMiddleDiff();
  for (const button of screen.getAllByRole('button', { name: 'Expand all' })) {
    await userEvent.click(button);
  }

  expect(screen.getByText(codeCell('line 1'))).toBeInTheDocument();
  expect(screen.getByText(codeCell('line 50'))).toBeInTheDocument();
  expect(screen.queryByText(/hidden line/)).not.toBeInTheDocument();
});

test('find also searches expanded lines', async () => {
  await renderMiddleDiff();
  await userEvent.keyboard('{Meta>}f{/Meta}');
  await userEvent.type(screen.getByRole('textbox', { name: 'Find in diff' }), 'line 1');
  expect(screen.getByText('No results')).toBeInTheDocument();

  await userEvent.click(screen.getAllByRole('button', { name: 'Expand all' })[0]);
  // line 1, line 10–19
  expect(screen.getByText('1 of 11')).toBeInTheDocument();
});

test('shows no expanders when the file content is unavailable', async () => {
  window.electronAPI.getFileDiff = vi.fn(async () => MIDDLE_DIFF);
  render(<DiffViewer repoPath="/repo" filePath="notes.txt" {...defaultProps} />);
  await screen.findByText(codeCell('changed 25'));
  expect(screen.queryByRole('button', { name: 'Expand all' })).not.toBeInTheDocument();
});
