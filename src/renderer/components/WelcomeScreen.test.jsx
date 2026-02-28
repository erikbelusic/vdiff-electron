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
