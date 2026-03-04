import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, beforeEach } from 'vitest';
import PromptPanel from './PromptPanel';

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn(() => Promise.resolve()) },
  });
});

test('shows placeholder when no comments exist', () => {
  render(<PromptPanel comments={[]} onClose={vi.fn()} />);
  expect(screen.getByText('Click on any diff line to add a comment...')).toBeInTheDocument();
});

test('shows formatted export text when comments exist', () => {
  const comments = [{
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-1'],
    lineNum: '5',
    code: 'const x = 1;',
    text: 'Rename this',
  }];
  render(<PromptPanel comments={comments} onClose={vi.fn()} />);
  expect(screen.getByText(/Address the following feedback:/)).toBeInTheDocument();
  expect(screen.getByText(/src\/app.js:5/)).toBeInTheDocument();
});

test('close button calls onClose', async () => {
  const onClose = vi.fn();
  render(<PromptPanel comments={[]} onClose={onClose} />);
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(onClose).toHaveBeenCalled();
});

test('copy button copies export text and shows toast', async () => {
  const comments = [{
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-1'],
    lineNum: '5',
    code: 'const x = 1;',
    text: 'Rename this',
  }];
  render(<PromptPanel comments={comments} onClose={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: 'Copy to Clipboard' }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    expect.stringContaining('Address the following feedback:'),
  );
  expect(screen.getByText('Copied to clipboard!')).toBeInTheDocument();
});

test('copy button is hidden when no comments exist', () => {
  render(<PromptPanel comments={[]} onClose={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Copy to Clipboard' })).not.toBeInTheDocument();
});
