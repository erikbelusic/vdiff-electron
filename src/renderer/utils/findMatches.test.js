import { test, expect } from 'vitest';
import { findMatches } from './findMatches';

const hunks = [
  { lines: [{ content: 'const Foo = foo();' }, { content: 'nothing here' }] },
  { lines: [{ content: 'FOOfoo' }] },
];

test('returns no matches for an empty query', () => {
  expect(findMatches(hunks, '')).toEqual([]);
});

test('finds matches case-insensitively in document order', () => {
  expect(findMatches(hunks, 'foo')).toEqual([
    { hunkIdx: 0, lineIdx: 0, start: 6, end: 9 },
    { hunkIdx: 0, lineIdx: 0, start: 12, end: 15 },
    { hunkIdx: 1, lineIdx: 0, start: 0, end: 3 },
    { hunkIdx: 1, lineIdx: 0, start: 3, end: 6 },
  ]);
});

test('does not return overlapping matches', () => {
  const result = findMatches([{ lines: [{ content: 'aaaa' }] }], 'aa');
  expect(result.map((m) => m.start)).toEqual([0, 2]);
});

test('returns no matches when the query is not present', () => {
  expect(findMatches(hunks, 'xyz')).toEqual([]);
});
