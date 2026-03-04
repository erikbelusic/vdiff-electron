import { renderHook, act } from '@testing-library/react';
import { test, expect, beforeEach } from 'vitest';
import useComments from './useComments';

beforeEach(() => {
  window.electronAPI = {
    ...window.electronAPI,
    loadComments: async () => [],
    saveComments: async () => {},
  };
});

test('starts with empty comments', () => {
  const { result } = renderHook(() => useComments());
  expect(result.current.comments).toEqual([]);
});

test('addComment adds a comment with auto-generated id', () => {
  const { result } = renderHook(() => useComments('/repo'));
  act(() => {
    result.current.addComment({
      filePath: 'src/app.js',
      lineIds: ['0-1'],
      lineNum: '5',
      code: 'const x = 1;',
      text: 'Rename this variable',
    });
  });
  expect(result.current.comments).toHaveLength(1);
  expect(result.current.comments[0]).toMatchObject({
    filePath: 'src/app.js',
    lineIds: ['0-1'],
    lineNum: '5',
    code: 'const x = 1;',
    text: 'Rename this variable',
  });
  expect(result.current.comments[0].id).toBeDefined();
});

test('updateComment updates the text of a comment', () => {
  const { result } = renderHook(() => useComments('/repo'));
  let id;
  act(() => {
    id = result.current.addComment({
      filePath: 'src/app.js',
      lineIds: ['0-1'],
      lineNum: '5',
      code: 'const x = 1;',
      text: 'Original',
    });
  });
  act(() => {
    result.current.updateComment(id, 'Updated text');
  });
  expect(result.current.comments[0].text).toBe('Updated text');
});

test('deleteComment removes a comment', () => {
  const { result } = renderHook(() => useComments('/repo'));
  let id;
  act(() => {
    id = result.current.addComment({
      filePath: 'src/app.js',
      lineIds: ['0-1'],
      lineNum: '5',
      code: 'const x = 1;',
      text: 'Delete me',
    });
  });
  act(() => {
    result.current.deleteComment(id);
  });
  expect(result.current.comments).toHaveLength(0);
});

test('getCommentsForFile filters by file path', () => {
  const { result } = renderHook(() => useComments('/repo'));
  act(() => {
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-0'], lineNum: '1', code: 'a', text: 'Comment A' });
    result.current.addComment({ filePath: 'b.js', lineIds: ['0-0'], lineNum: '1', code: 'b', text: 'Comment B' });
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-1'], lineNum: '2', code: 'a2', text: 'Comment A2' });
  });
  const aComments = result.current.getCommentsForFile('a.js');
  expect(aComments).toHaveLength(2);
  expect(aComments.every((c) => c.filePath === 'a.js')).toBe(true);
});

test('pruneForFiles removes comments for files not in the list', () => {
  const { result } = renderHook(() => useComments('/repo'));
  act(() => {
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-0'], lineNum: '1', code: 'a', text: 'Comment A' });
    result.current.addComment({ filePath: 'b.js', lineIds: ['0-0'], lineNum: '1', code: 'b', text: 'Comment B' });
    result.current.addComment({ filePath: 'c.js', lineIds: ['0-0'], lineNum: '1', code: 'c', text: 'Comment C' });
  });
  act(() => {
    result.current.pruneForFiles(['a.js', 'c.js']);
  });
  expect(result.current.comments).toHaveLength(2);
  expect(result.current.comments.map((c) => c.filePath)).toEqual(['a.js', 'c.js']);
});

test('loadFromDisk loads persisted comments', async () => {
  const saved = [
    { id: 10, filePath: 'x.js', lineIds: ['0-0'], lineNum: '1', code: 'x', text: 'Persisted' },
  ];
  window.electronAPI.loadComments = async () => saved;
  const { result } = renderHook(() => useComments('/repo'));
  await act(async () => {
    await result.current.loadFromDisk('/repo');
  });
  expect(result.current.comments).toEqual(saved);
});

test('mutations call saveComments', () => {
  let savedData;
  window.electronAPI.saveComments = async (_repo, comments) => { savedData = comments; };
  const { result } = renderHook(() => useComments('/repo'));
  act(() => {
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-0'], lineNum: '1', code: 'a', text: 'Hi' });
  });
  expect(savedData).toHaveLength(1);
  expect(savedData[0].text).toBe('Hi');
});
