import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from 'vitest';
import CommitPicker from './CommitPicker';

const commits = [
  { hash: 'abc123full', shortHash: 'abc123', author: 'Jane', relativeDate: '2 hours ago', subject: 'Fix login bug' },
  { hash: 'def456full', shortHash: 'def456', author: 'John', relativeDate: '1 day ago', subject: 'Add tests' },
];

beforeEach(() => {
  window.electronAPI = {
    getRecentCommits: vi.fn(async () => commits),
  };
});

test('shows the current branch name when no commit is selected', () => {
  render(<CommitPicker repoPath="/repo" currentBranch="main" selectedCommit={null} onSelectCommit={vi.fn()} />);
  expect(screen.getByText('main')).toBeInTheDocument();
});

test('opens dropdown and lists recent commits plus a Working Changes option', async () => {
  render(<CommitPicker repoPath="/repo" currentBranch="main" selectedCommit={null} onSelectCommit={vi.fn()} />);
  await userEvent.click(screen.getByText('main'));

  expect(screen.getByRole('option', { name: 'Working Changes' })).toBeInTheDocument();
  expect(await screen.findByText('Fix login bug')).toBeInTheDocument();
  expect(screen.getByText('Add tests')).toBeInTheDocument();
});

test('selecting a commit calls onSelectCommit with its hash', async () => {
  const onSelectCommit = vi.fn();
  render(<CommitPicker repoPath="/repo" currentBranch="main" selectedCommit={null} onSelectCommit={onSelectCommit} />);
  await userEvent.click(screen.getByText('main'));

  await userEvent.click(await screen.findByText('Fix login bug'));
  expect(onSelectCommit).toHaveBeenCalledWith('abc123full');
});

test('selecting Working Changes calls onSelectCommit with null', async () => {
  const onSelectCommit = vi.fn();
  render(<CommitPicker repoPath="/repo" currentBranch="main" selectedCommit="abc123full" onSelectCommit={onSelectCommit} />);
  await userEvent.click(screen.getByText(/abc123/));

  await userEvent.click(screen.getByRole('option', { name: 'Working Changes' }));
  expect(onSelectCommit).toHaveBeenCalledWith(null);
});

test('shows selected commit hash and subject in the badge', async () => {
  const onSelectCommit = vi.fn();
  const { rerender } = render(
    <CommitPicker repoPath="/repo" currentBranch="main" selectedCommit={null} onSelectCommit={onSelectCommit} />
  );
  await userEvent.click(screen.getByText('main'));
  await userEvent.click(await screen.findByText('Fix login bug'));

  // Parent would set selectedCommit from onSelectCommit; simulate that here.
  rerender(
    <CommitPicker repoPath="/repo" currentBranch="main" selectedCommit="abc123full" onSelectCommit={onSelectCommit} />
  );

  expect(screen.getByText((_, el) =>
    el.tagName === 'SPAN' && el.textContent.includes('abc123') && el.textContent.includes('Fix login bug'),
  )).toBeInTheDocument();
});
