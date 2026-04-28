import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { test, expect, vi, describe } from 'vitest';
import RepositoryPicker from './RepositoryPicker';

const singleProjects = [
  { id: '/a/.git', name: 'project-a', mainPath: '/a/main', worktrees: [{ path: '/a/main', branch: 'main' }] },
  { id: '/b/.git', name: 'project-b', mainPath: '/b/main', worktrees: [{ path: '/b/main', branch: 'main' }] },
];

const multiProject = [
  {
    id: '/repo/.git',
    name: 'repo',
    mainPath: '/repo/main',
    worktrees: [
      { path: '/repo/main', branch: 'main' },
      { path: '/repo/main.feature-foo', branch: 'feature/foo' },
    ],
  },
];

function renderPicker(overrides = {}) {
  const props = {
    projects: singleProjects,
    selectedRepo: singleProjects[0].mainPath,
    onSelectRepo: vi.fn(),
    onAddRepository: vi.fn(),
    onRemoveProject: vi.fn(),
    onRefreshProjects: vi.fn(),
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

test('opens dropdown and shows all projects when clicked', async () => {
  renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  expect(screen.getByRole('option', { name: /project-a/i })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /project-b/i })).toBeInTheDocument();
});

test('calls onSelectRepo with worktree path when a project is clicked', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('option', { name: /project-b/i }));
  expect(props.onSelectRepo).toHaveBeenCalledWith('/b/main');
});

test('calls onAddRepository when add button is clicked', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('button', { name: /add repository/i }));
  expect(props.onAddRepository).toHaveBeenCalledOnce();
});

test('calls onRemoveProject with project id when remove is clicked', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('button', { name: /remove project-a/i }));
  expect(props.onRemoveProject).toHaveBeenCalledWith('/a/.git');
  expect(props.onSelectRepo).not.toHaveBeenCalled();
});

test('closes dropdown after selecting a repo', async () => {
  renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  await userEvent.click(screen.getByRole('option', { name: /project-b/i }));
  expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

test('calls onRefreshProjects when picker opens', async () => {
  const props = renderPicker();
  await userEvent.click(screen.getByRole('button', { expanded: false }));
  expect(props.onRefreshProjects).toHaveBeenCalledOnce();
});

describe('multi-worktree project', () => {
  test('renders two-level UI with project header and worktree rows', async () => {
    renderPicker({ projects: multiProject, selectedRepo: '/repo/main' });
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('repo')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /main \(main\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /feature\/foo/i })).toBeInTheDocument();
  });

  test('shows project name and branch in button when worktree is selected', () => {
    renderPicker({ projects: multiProject, selectedRepo: '/repo/main.feature-foo' });
    expect(screen.getByText('repo • feature/foo')).toBeInTheDocument();
  });

  test('disabled worktree path is greyed out and not selectable', async () => {
    const props = renderPicker({
      projects: multiProject,
      selectedRepo: '/repo/main',
      disabledRepoPaths: ['/repo/main.feature-foo'],
    });
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const disabledOption = screen.getByRole('option', { name: /feature\/foo/i });
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(disabledOption);
    expect(props.onSelectRepo).not.toHaveBeenCalled();
  });

  test('remove button is at project level, not per-worktree', async () => {
    renderPicker({ projects: multiProject, selectedRepo: '/repo/main' });
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const removeButtons = screen.getAllByRole('button', { name: /remove repo/i });
    expect(removeButtons).toHaveLength(1);
  });
});

describe('single-worktree project', () => {
  test('renders flat, same as before', async () => {
    renderPicker();
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByRole('option', { name: /project-a/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /project-b/i })).toBeInTheDocument();
  });

  test('disabled path is not selectable', async () => {
    const props = renderPicker({ disabledRepoPaths: ['/b/main'] });
    await userEvent.click(screen.getByRole('button', { expanded: false }));
    const disabledOption = screen.getByRole('option', { name: /project-b/i });
    expect(disabledOption).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(disabledOption);
    expect(props.onSelectRepo).not.toHaveBeenCalled();
  });
});
