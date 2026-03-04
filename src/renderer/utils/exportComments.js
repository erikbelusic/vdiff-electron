function generateExport(comments) {
  if (comments.length === 0) return '';

  let out = 'Code Review Comments:\n\n';

  comments.forEach((c) => {
    const lineLabel = c.lineNum || '?';
    out += '- ' + c.filePath + ':' + lineLabel + '\n';

    const codeLines = c.code.split('\n');
    if (codeLines.length === 1) {
      out += '   Code: ' + codeLines[0].trim() + '\n';
    } else {
      out += '   Code:\n';
      codeLines.forEach((cl) => {
        out += '     ' + cl + '\n';
      });
    }

    out += '   Comment: ' + c.text + '\n\n';
  });

  return out.trimEnd() + '\n';
}

export { generateExport };
