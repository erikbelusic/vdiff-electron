import { test, expect } from 'vitest';
import { parseDiff } from './parseDiff';

const SIMPLE_DIFF = `diff --git a/src/app.js b/src/app.js
index abc1234..def5678 100644
--- a/src/app.js
+++ b/src/app.js
@@ -10,7 +10,8 @@ function init() {
   const a = 1;
-  const b = 2;
+  const b = 3;
+  const c = 4;
   return a + b;`;

test('parses a simple diff with one file', () => {
  const result = parseDiff(SIMPLE_DIFF);
  expect(result).toHaveLength(1);
  expect(result[0].file).toBe('src/app.js');
  expect(result[0].additions).toBe(2);
  expect(result[0].deletions).toBe(1);
  expect(result[0].hunks).toHaveLength(1);
});

test('parses hunk header and context', () => {
  const result = parseDiff(SIMPLE_DIFF);
  const hunk = result[0].hunks[0];
  expect(hunk.header).toContain('@@ -10,7 +10,8 @@');
  expect(hunk.context).toBe('function init() {');
});

test('parses line types correctly', () => {
  const result = parseDiff(SIMPLE_DIFF);
  const lines = result[0].hunks[0].lines;

  expect(lines[0]).toEqual({
    type: 'context',
    oldNum: 10,
    newNum: 10,
    content: '  const a = 1;',
  });

  expect(lines[1]).toEqual({
    type: 'deletion',
    oldNum: 11,
    newNum: null,
    content: '  const b = 2;',
  });

  expect(lines[2]).toEqual({
    type: 'addition',
    oldNum: null,
    newNum: 11,
    content: '  const b = 3;',
  });

  expect(lines[3]).toEqual({
    type: 'addition',
    oldNum: null,
    newNum: 12,
    content: '  const c = 4;',
  });

  expect(lines[4]).toEqual({
    type: 'context',
    oldNum: 12,
    newNum: 13,
    content: '  return a + b;',
  });
});

const MULTI_FILE_DIFF = `diff --git a/file1.js b/file1.js
--- a/file1.js
+++ b/file1.js
@@ -1,3 +1,3 @@
 line1
-line2
+line2-modified
 line3
diff --git a/file2.js b/file2.js
--- a/file2.js
+++ b/file2.js
@@ -1,2 +1,3 @@
 hello
+world
 end`;

test('parses multiple files', () => {
  const result = parseDiff(MULTI_FILE_DIFF);
  expect(result).toHaveLength(2);
  expect(result[0].file).toBe('file1.js');
  expect(result[1].file).toBe('file2.js');
});

const DELETED_FILE_DIFF = `diff --git a/old.txt b/old.txt
deleted file mode 100644
index abc1234..0000000
--- a/old.txt
+++ /dev/null
@@ -1,2 +1,0 @@
-line1
-line2`;

test('handles deleted files', () => {
  const result = parseDiff(DELETED_FILE_DIFF);
  expect(result[0].file).toBe('old.txt (deleted)');
  expect(result[0].deletions).toBe(2);
});

const RENAMED_FILE_DIFF = `diff --git a/old-name.js b/new-name.js
similarity index 95%
rename from old-name.js
rename to new-name.js
--- a/old-name.js
+++ b/new-name.js
@@ -1,3 +1,3 @@
 const a = 1;
-const b = 2;
+const b = 3;
 const c = 3;`;

test('handles renamed files', () => {
  const result = parseDiff(RENAMED_FILE_DIFF);
  expect(result[0].file).toContain('\u2192');
  expect(result[0].file).toContain('new-name.js');
});

const MULTI_HUNK_DIFF = `diff --git a/big.js b/big.js
--- a/big.js
+++ b/big.js
@@ -5,3 +5,3 @@ function a() {
 line5
-line6
+line6-changed
 line7
@@ -20,3 +20,4 @@ function b() {
 line20
+new-line
 line21
 line22`;

test('handles multiple hunks in one file', () => {
  const result = parseDiff(MULTI_HUNK_DIFF);
  expect(result[0].hunks).toHaveLength(2);
  expect(result[0].hunks[0].lines[0].oldNum).toBe(5);
  expect(result[0].hunks[1].lines[0].oldNum).toBe(20);
});

test('returns empty array for empty input', () => {
  expect(parseDiff('')).toEqual([]);
});
