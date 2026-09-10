import { test, expect } from 'vitest';
import { fileFingerprint, pruneReviewedFiles } from './reviewedFiles';

test('fileFingerprint combines status, additions, and deletions', () => {
  expect(fileFingerprint({ status: 'M', additions: 5, deletions: 2 })).toBe('M:5:2');
});

test('pruneReviewedFiles keeps entries whose fingerprint still matches', () => {
  const reviewed = { 'a.js': 'M:5:2', 'b.js': 'A:10:0' };
  const files = [{ path: 'a.js', status: 'M', additions: 5, deletions: 2 }];
  expect(pruneReviewedFiles(reviewed, files)).toEqual({ 'a.js': 'M:5:2' });
});

test('pruneReviewedFiles drops entries for files no longer present', () => {
  const reviewed = { 'a.js': 'M:5:2' };
  expect(pruneReviewedFiles(reviewed, [])).toEqual({});
});

test('pruneReviewedFiles drops entries whose fingerprint changed', () => {
  const reviewed = { 'a.js': 'M:5:2' };
  const files = [{ path: 'a.js', status: 'M', additions: 6, deletions: 2 }];
  expect(pruneReviewedFiles(reviewed, files)).toEqual({});
});
