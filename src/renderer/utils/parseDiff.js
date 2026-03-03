/**
 * Parses a unified diff string into a structured format.
 * Ported from the original vdiff viewer.html parser.
 *
 * @param {string} raw - Raw unified diff output from git
 * @returns {Array<{file: string, additions: number, deletions: number, hunks: Array}>}
 */
export function parseDiff(raw) {
  const lines = raw.split('\n');
  const files = [];
  let currentFile = null;
  let currentHunk = null;
  let oldNum = 0;
  let newNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('diff --git')) {
      currentFile = { file: '', additions: 0, deletions: 0, hunks: [] };
      files.push(currentFile);
      currentHunk = null;
      continue;
    }

    if (!currentFile) continue;

    if (line.startsWith('+++ b/')) {
      // Don't overwrite if rename already set the name
      if (!currentFile.renamed) {
        currentFile.file = line.substring(6);
      }
      continue;
    }

    if (line.startsWith('+++ /dev/null')) {
      // Deleted file — extract name from diff --git header
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        if (lines[j].startsWith('diff --git')) {
          const match = lines[j].match(/diff --git a\/(.+) b\//);
          if (match) {
            currentFile.file = match[1] + ' (deleted)';
          }
          break;
        }
      }
      continue;
    }

    if (line.startsWith('rename from ')) {
      currentFile.file = line.substring(12);
      continue;
    }

    if (line.startsWith('rename to ')) {
      currentFile.file += ' \u2192 ' + line.substring(10);
      currentFile.renamed = true;
      continue;
    }

    if (
      line.startsWith('--- ') ||
      line.startsWith('index ') ||
      line.startsWith('old mode') ||
      line.startsWith('new mode') ||
      line.startsWith('new file') ||
      line.startsWith('deleted file') ||
      line.startsWith('similarity') ||
      line.startsWith('Binary files')
    ) {
      continue;
    }

    const hunkMatch = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
    if (hunkMatch) {
      oldNum = parseInt(hunkMatch[1], 10);
      newNum = parseInt(hunkMatch[2], 10);
      currentHunk = {
        header: line,
        context: hunkMatch[3].trim(),
        lines: [],
      };
      currentFile.hunks.push(currentHunk);
      continue;
    }

    if (!currentHunk) continue;

    if (line.startsWith('\\')) continue; // "No newline at end of file"

    if (line.startsWith('+')) {
      currentHunk.lines.push({
        type: 'addition',
        oldNum: null,
        newNum: newNum,
        content: line.substring(1),
      });
      currentFile.additions++;
      newNum++;
    } else if (line.startsWith('-')) {
      currentHunk.lines.push({
        type: 'deletion',
        oldNum: oldNum,
        newNum: null,
        content: line.substring(1),
      });
      currentFile.deletions++;
      oldNum++;
    } else {
      currentHunk.lines.push({
        type: 'context',
        oldNum: oldNum,
        newNum: newNum,
        content: line.startsWith(' ') ? line.substring(1) : line,
      });
      oldNum++;
      newNum++;
    }
  }

  return files;
}
