import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import SettingsDialog from './SettingsDialog';

test('renders with current expiry value', () => {
  render(<SettingsDialog commentExpiryDays={30} onSave={vi.fn()} onCancel={vi.fn()} />);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByDisplayValue('30')).toBeInTheDocument();
});

test('calls onSave with updated value', async () => {
  const onSave = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={onSave} onCancel={vi.fn()} />);
  const input = screen.getByDisplayValue('30');
  await userEvent.clear(input);
  await userEvent.type(input, '60');
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSave).toHaveBeenCalledWith(60);
});

test('calls onCancel when Cancel is clicked', async () => {
  const onCancel = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={vi.fn()} onCancel={onCancel} />);
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalled();
});

test('calls onCancel when Escape is pressed', async () => {
  const onCancel = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={vi.fn()} onCancel={onCancel} />);
  await userEvent.keyboard('{Escape}');
  expect(onCancel).toHaveBeenCalled();
});

test('clamps value to min 1', () => {
  const onSave = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={onSave} onCancel={vi.fn()} />);
  const input = screen.getByDisplayValue('30');
  fireEvent.change(input, { target: { value: '-5' } });
  fireEvent.submit(input.closest('form'));
  expect(onSave).toHaveBeenCalledWith(1);
});

test('clamps value to max 365', () => {
  const onSave = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={onSave} onCancel={vi.fn()} />);
  const input = screen.getByDisplayValue('30');
  fireEvent.change(input, { target: { value: '999' } });
  fireEvent.submit(input.closest('form'));
  expect(onSave).toHaveBeenCalledWith(365);
});

test('calls onCancel when overlay is clicked', async () => {
  const onCancel = vi.fn();
  render(<SettingsDialog commentExpiryDays={30} onSave={vi.fn()} onCancel={onCancel} />);
  // Click on the overlay (parent of dialog)
  const dialog = screen.getByRole('dialog');
  await userEvent.click(dialog.parentElement);
  expect(onCancel).toHaveBeenCalled();
});
