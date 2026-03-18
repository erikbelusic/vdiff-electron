import { renderHook, act } from '@testing-library/react';
import { test, expect } from 'vitest';
import useTabs from './useTabs';

test('reorderTabs moves a tab forward', () => {
  const { result } = renderHook(() => useTabs());
  act(() => { result.current.addTab('/repo-b'); });
  act(() => { result.current.addTab('/repo-c'); });
  const ids = result.current.tabs.map((t) => t.id);
  act(() => { result.current.reorderTabs(0, 2); });
  expect(result.current.tabs.map((t) => t.id)).toEqual([ids[1], ids[2], ids[0]]);
});

test('reorderTabs moves a tab backward', () => {
  const { result } = renderHook(() => useTabs());
  act(() => { result.current.addTab('/repo-b'); });
  act(() => { result.current.addTab('/repo-c'); });
  const ids = result.current.tabs.map((t) => t.id);
  act(() => { result.current.reorderTabs(2, 0); });
  expect(result.current.tabs.map((t) => t.id)).toEqual([ids[2], ids[0], ids[1]]);
});

test('reorderTabs with same index is a no-op', () => {
  const { result } = renderHook(() => useTabs());
  act(() => { result.current.addTab('/repo-b'); });
  const ids = result.current.tabs.map((t) => t.id);
  act(() => { result.current.reorderTabs(1, 1); });
  expect(result.current.tabs.map((t) => t.id)).toEqual(ids);
});
