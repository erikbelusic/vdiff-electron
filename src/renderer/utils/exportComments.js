function generateExport(comments, { brief = false } = {}) {
  if (comments.length === 0) return '';

  if (brief) {
    let out = '';
    comments.forEach((c) => {
      const lineLabel = c.lineNum || '?';
      out += '- ' + c.filePath + ':' + lineLabel + '\n';
      c.text.split('\n').forEach((line) => {
        out += '  - ' + line + '\n';
      });
    });
    return out.trimEnd() + '\n';
  }

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

    const commentLines = c.text.split('\n');
    if (commentLines.length === 1) {
      out += '   Comment: ' + c.text + '\n\n';
    } else {
      out += '   Comment:\n';
      commentLines.forEach((cl) => {
        out += '     ' + cl + '\n';
      });
      out += '\n';
    }
  });

  return out.trimEnd() + '\n';
}

export { generateExport };
