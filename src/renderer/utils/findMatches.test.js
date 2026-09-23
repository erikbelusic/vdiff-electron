import { test, expect } from 'vitest';
import { findMatches } from './findMatches';

const lines = [
  { content: 'const Foo = foo();' },
  { content: 'nothing here' },
  { content: 'FOOfoo' },
];

test('returns no matches for an empty query', () => {
  expect(findMatches(lines, '')).toEqual([]);
});

test('finds matches case-insensitively in order', () => {
  expect(findMatches(lines, 'foo')).toEqual([
    { line: lines[0], start: 6, end: 9 },
    { line: lines[0], start: 12, end: 15 },
    { line: lines[2], start: 0, end: 3 },
    { line: lines[2], start: 3, end: 6 },
  ]);
});

test('does not return overlapping matches', () => {
  const result = findMatches([{ content: 'aaaa' }], 'aa');
  expect(result.map((m) => m.start)).toEqual([0, 2]);
});

test('returns no matches when the query is not present', () => {
  expect(findMatches(lines, 'xyz')).toEqual([]);
});
