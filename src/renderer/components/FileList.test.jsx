import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import FileList from './FileList';

const files = [
  { path: 'src/main.js', status: 'M', staged: false },
  { path: 'src/components/App.jsx', status: 'A', staged: true },
  { path: 'old-file.txt', status: 'D', staged: false },
];

test('shows count of changed files', () => {
  render(<FileList files={files} selectedFile={null} onSelectFile={() => {}} />);
  expect(screen.getByText('3 changed files')).toBeInTheDocument();
});

test('shows singular "file" when only one changed', () => {
  render(<FileList files={[files[0]]} selectedFile={null} onSelectFile={() => {}} />);
  expect(screen.getByText('1 changed file')).toBeInTheDocument();
});

test('shows empty state when no files changed', () => {
  render(<FileList files={[]} selectedFile={null} onSelectFile={() => {}} />);
  expect(screen.getByText('No changed files')).toBeInTheDocument();
});

test('displays file names', () => {
  render(<FileList files={files} selectedFile={null} onSelectFile={() => {}} />);
  expect(screen.getByText(/main\.js/)).toBeInTheDocument();
  expect(screen.getByText(/App\.jsx/)).toBeInTheDocument();
  expect(screen.getByText(/old-file\.txt/)).toBeInTheDocument();
});

test('shows status badges with correct labels', () => {
  render(<FileList files={files} selectedFile={null} onSelectFile={() => {}} />);
  expect(screen.getByLabelText('Modified')).toHaveTextContent('M');
  expect(screen.getByLabelText('Added')).toHaveTextContent('A');
  expect(screen.getByLabelText('Deleted')).toHaveTextContent('D');
});

test('calls onSelectFile when a file is clicked', async () => {
  const handleSelect = vi.fn();
  render(<FileList files={files} selectedFile={null} onSelectFile={handleSelect} />);

  await userEvent.click(screen.getByTitle('src/main.js'));
  expect(handleSelect).toHaveBeenCalledWith('src/main.js');
});
