import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import TopBar from './TopBar';

const defaultProps = {
  repositories: ['/repo'],
  selectedRepo: '/repo',
  onSelectRepo: vi.fn(),
  onAddRepository: vi.fn(),
  onRemoveRepository: vi.fn(),
  currentBranch: 'main',
  onTogglePromptPanel: vi.fn(),
  promptPanelOpen: false,
  compactOutput: false,
  onToggleCompactOutput: vi.fn(),
  onClearComments: vi.fn(),
  onOpenSettings: vi.fn(),
};

test('shows comment badge when commentCount > 0', () => {
  render(<TopBar {...defaultProps} commentCount={3} />);
  expect(screen.getByText('3 comments')).toBeInTheDocument();
});

test('shows singular "comment" for count of 1', () => {
  render(<TopBar {...defaultProps} commentCount={1} />);
  expect(screen.getByText('1 comment')).toBeInTheDocument();
});

test('does not show comment badge when commentCount is 0', () => {
  render(<TopBar {...defaultProps} commentCount={0} />);
  expect(screen.queryByText(/\d+ comments?$/)).not.toBeInTheDocument();
});

test('shows Prompt Output button when comments exist', () => {
  render(<TopBar {...defaultProps} commentCount={2} />);
  expect(screen.getByRole('button', { name: 'Prompt Output' })).toBeInTheDocument();
});

test('Prompt Output button calls onTogglePromptPanel', async () => {
  const onToggle = vi.fn();
  render(<TopBar {...defaultProps} commentCount={2} onTogglePromptPanel={onToggle} />);
  await userEvent.click(screen.getByRole('button', { name: 'Prompt Output' }));
  expect(onToggle).toHaveBeenCalled();
});

test('Prompt Output button is hidden when no comments', () => {
  render(<TopBar {...defaultProps} commentCount={0} />);
  expect(screen.queryByRole('button', { name: 'Prompt Output' })).not.toBeInTheDocument();
});

test('gear icon is always visible', () => {
  render(<TopBar {...defaultProps} commentCount={0} />);
  expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
});

test('gear icon calls onOpenSettings', async () => {
  const onOpen = vi.fn();
  render(<TopBar {...defaultProps} commentCount={0} onOpenSettings={onOpen} />);
  await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
  expect(onOpen).toHaveBeenCalled();
});
