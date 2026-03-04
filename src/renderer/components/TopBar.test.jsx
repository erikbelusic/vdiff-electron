import { render, screen } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import TopBar from './TopBar';

const defaultProps = {
  repositories: ['/repo'],
  selectedRepo: '/repo',
  onSelectRepo: vi.fn(),
  onAddRepository: vi.fn(),
  onRemoveRepository: vi.fn(),
  currentBranch: 'main',
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
  expect(screen.queryByText(/comment/)).not.toBeInTheDocument();
});
