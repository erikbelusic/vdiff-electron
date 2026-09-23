import { test, expect } from 'vitest';
import { computeGaps, revealGap, splitFileLines } from './contextGaps';

const fileLines = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`);

test('splitFileLines drops the empty entry after a trailing newline', () => {
  expect(splitFileLines('a\nb\n')).toEqual(['a', 'b']);
  expect(splitFileLines('a\nb')).toEqual(['a', 'b']);
});

test('computes gaps before, between, and after hunks', () => {
  const hunks = [
    { header: '@@ -5,3 +5,4 @@' },
    { header: '@@ -20,3 +21,3 @@' },
  ];
  expect(computeGaps(hunks, 50)).toEqual([
    { start: 1, end: 4, oldOffset: 0 },
    { start: 9, end: 20, oldOffset: -1 },
    { start: 24, end: 50, oldOffset: -1 },
  ]);
});

test('handles hunks with an empty new side and headers without counts', () => {
  const hunks = [{ header: '@@ -3,2 +2,0 @@' }, { header: '@@ -10 +8 @@' }];
  expect(computeGaps(hunks, 20)).toEqual([
    { start: 1, end: 2, oldOffset: 0 },
    { start: 3, end: 7, oldOffset: 2 },
    { start: 9, end: 20, oldOffset: 2 },
  ]);
});

test('a hunk starting at line 1 leaves an empty leading gap', () => {
  const [first] = computeGaps([{ header: '@@ -1,3 +1,3 @@' }], 3);
  expect(revealGap(first, { top: 5, bottom: 5 }, fileLines).hidden).toBe(0);
});

test('reveals lines from the top and bottom of a gap with old and new numbers', () => {
  const gap = { start: 9, end: 20, oldOffset: -1 };
  const { topLines, bottomLines, hidden } = revealGap(gap, { top: 2, bottom: 3 }, fileLines);
  expect(topLines).toEqual([
    { type: 'context', oldNum: 8, newNum: 9, content: 'line 9' },
    { type: 'context', oldNum: 9, newNum: 10, content: 'line 10' },
  ]);
  expect(bottomLines.map((l) => l.newNum)).toEqual([18, 19, 20]);
  expect(hidden).toBe(7);
});

test('never reveals more lines than the gap holds', () => {
  const gap = { start: 9, end: 20, oldOffset: 0 };
  const { topLines, bottomLines, hidden } = revealGap(gap, { top: 10, bottom: 10 }, fileLines);
  expect(topLines).toHaveLength(10);
  expect(bottomLines).toHaveLength(2);
  expect(hidden).toBe(0);
});
