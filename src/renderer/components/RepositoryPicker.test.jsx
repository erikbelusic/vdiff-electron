import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi } from 'vitest';
import RepositoryPicker from './RepositoryPicker';

const repos = ['/Users/test/Code/project-a', '/Users/test/Code/project-b'];

function renderPicker(overrides = {}) {
  const props = {
    repositories: repos,
    selectedRepo: repos[0],
    onSelectRepo: vi.fn(),
    onAddRepository: vi.fn(),
    onRemoveRepository: vi.fn(),
    ...overrides,
  };
  render(<RepositoryPicker {...props} />);
  return props;
}

test('shows the selected repository name', () => {
  renderPicker();
  expect(screen.getByText('project-a')).toBeInTheDocument();
});

test('shows "Select a repository" when none is selected', () => {
  renderPicker({ selectedRepo: null });
  expect(screen.getByText('Select a repository')).toBeInTheDocument();
});

test('opens dropdown and shows all repos when clicked', async () => {
  renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));

  expect(screen.getByRole('option', { name: /project-a/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /project-b/i })).toBeInTheDocument();
});

test('calls onSelectRepo when a different repo is clicked', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('option', { name: /project-b/i }));

  expect(props.onSelectRepo).toHaveBeenCalledWith(repos[1]);
});

test('calls onAddRepository when add button is clicked in dropdown', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('button', { name: /add repository/i }));

  expect(props.onAddRepository).toHaveBeenCalledOnce();
});

test('calls onRemoveRepository when remove button is clicked', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('button', { name: /remove project-a/i }));

  expect(props.onRemoveRepository).toHaveBeenCalledWith(repos[0]);
  expect(props.onSelectRepo).not.toHaveBeenCalled();
});

test('closes dropdown after selecting a repo', async () => {
  renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('option', { name: /project-b/i }));

  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
