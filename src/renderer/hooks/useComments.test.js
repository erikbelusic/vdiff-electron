import { renderHook, act } from '@testing-library/react';
import { test, expect } from 'vitest';
import useComments from './useComments';

test('starts with empty comments', () => {
  const { result } = renderHook(() => useComments());
  expect(result.current.comments).toEqual([]);
});

test('addComment adds a comment with auto-generated id', () => {
  const { result } = renderHook(() => useComments());
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
  const { result } = renderHook(() => useComments());
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
  const { result } = renderHook(() => useComments());
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
  const { result } = renderHook(() => useComments());
  act(() => {
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-0'], lineNum: '1', code: 'a', text: 'Comment A' });
    result.current.addComment({ filePath: 'b.js', lineIds: ['0-0'], lineNum: '1', code: 'b', text: 'Comment B' });
    result.current.addComment({ filePath: 'a.js', lineIds: ['0-1'], lineNum: '2', code: 'a2', text: 'Comment A2' });
  });
  const aComments = result.current.getCommentsForFile('a.js');
  expect(aComments).toHaveLength(2);
  expect(aComments.every((c) => c.filePath === 'a.js')).toBe(true);
});
