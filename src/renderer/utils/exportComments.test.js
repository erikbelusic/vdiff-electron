import { test, expect } from 'vitest';
import { generateExport } from './exportComments';

test('returns empty string for no comments', () => {
  expect(generateExport([])).toBe('');
});

test('formats single-line code comment', () => {
  const comments = [{
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-1'],
    lineNum: '5',
    code: 'const x = 1;',
    text: 'Rename this variable',
  }];

  expect(generateExport(comments)).toBe(
    'Code Review Comments:\n' +
    '\n' +
    '- src/app.js:5\n' +
    '   Code: const x = 1;\n' +
    '   Comment: Rename this variable\n'
  );
});

test('formats multi-line code comment', () => {
  const comments = [{
    id: 1,
    filePath: 'src/utils.js',
    lineIds: ['0-0', '0-1', '0-2'],
    lineNum: '10-12',
    code: 'function foo() {\n  return 42;\n}',
    text: 'Extract magic number',
  }];

  expect(generateExport(comments)).toBe(
    'Code Review Comments:\n' +
    '\n' +
    '- src/utils.js:10-12\n' +
    '   Code:\n' +
    '     function foo() {\n' +
    '       return 42;\n' +
    '     }\n' +
    '   Comment: Extract magic number\n'
  );
});

test('formats multiple comments with blank line between them', () => {
  const comments = [
    {
      id: 1,
      filePath: 'a.js',
      lineIds: ['0-0'],
      lineNum: '1',
      code: 'let a = 1;',
      text: 'Use const',
    },
    {
      id: 2,
      filePath: 'b.js',
      lineIds: ['0-3'],
      lineNum: '7',
      code: 'console.log(x);',
      text: 'Remove debug log',
    },
  ];

  expect(generateExport(comments)).toBe(
    'Code Review Comments:\n' +
    '\n' +
    '- a.js:1\n' +
    '   Code: let a = 1;\n' +
    '   Comment: Use const\n' +
    '\n' +
    '- b.js:7\n' +
    '   Code: console.log(x);\n' +
    '   Comment: Remove debug log\n'
  );
});

test('formats multi-line comment text', () => {
  const comments = [{
    id: 1,
    filePath: 'src/app.js',
    lineIds: ['0-1'],
    lineNum: '5',
    code: 'const x = 1;',
    text: 'This should be renamed.\nAlso consider using a constant.',
  }];

  expect(generateExport(comments)).toBe(
    'Code Review Comments:\n' +
    '\n' +
    '- src/app.js:5\n' +
    '   Code: const x = 1;\n' +
    '   Comment:\n' +
    '     This should be renamed.\n' +
    '     Also consider using a constant.\n'
  );
});

test('uses ? for missing lineNum', () => {
  const comments = [{
    id: 1,
    filePath: 'file.js',
    lineIds: ['0-0'],
    lineNum: '',
    code: 'x',
    text: 'Fix this',
  }];

  const result = generateExport(comments);
  expect(result).toContain('- file.js:?\n');
});
