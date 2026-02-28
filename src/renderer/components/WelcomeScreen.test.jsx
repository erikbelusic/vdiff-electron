import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import WelcomeScreen from './WelcomeScreen';

test('renders welcome message and add repository button', () => {
  render(<WelcomeScreen onAddRepository={() => {}} />);
  expect(screen.getByText('vdiff')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /add repository/i }),
  ).toBeInTheDocument();
});

test('calls onAddRepository when button is clicked', async () => {
  const handleAdd = vi.fn();
  render(<WelcomeScreen onAddRepository={handleAdd} />);

  await userEvent.click(
    screen.getByRole('button', { name: /add repository/i }),
  );
  expect(handleAdd).toHaveBeenCalledOnce();
});

test('displays an error message when provided', () => {
  render(
    <WelcomeScreen
      onAddRepository={() => {}}
      error="The selected folder is not a Git repository."
    />,
  );
  expect(
    screen.getByText('The selected folder is not a Git repository.'),
  ).toBeInTheDocument();
});

test('does not display an error when none is provided', () => {
  render(<WelcomeScreen onAddRepository={() => {}} />);
  expect(
    screen.queryByText(/not a Git repository/i),
  ).not.toBeInTheDocument();
});
