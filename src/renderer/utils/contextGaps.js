// Lines revealed per click of an "expand up" / "expand down" control
export const EXPAND_STEP = 20;

export function splitFileLines(content) {
  const lines = content.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines;
}

// Line ranges (1-based, inclusive) a hunk covers in the old and new file.
// A zero-count side (e.g. "+4,0") names the line *before* the change.
function hunkRange(header) {
  const m = header.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
  const oldCount = m[2] === undefined ? 1 : Number(m[2]);
  const newCount = m[4] === undefined ? 1 : Number(m[4]);
  const oldStart = oldCount === 0 ? Number(m[1]) + 1 : Number(m[1]);
  const newStart = newCount === 0 ? Number(m[3]) + 1 : Number(m[3]);
  return { oldStart, oldEnd: oldStart + oldCount - 1, newStart, newEnd: newStart + newCount - 1 };
}

/**
 * The unchanged stretches of the new file hidden between hunks: one before the
 * first hunk, one between each pair, and one after the last (hunks.length + 1
 * in total). Each is { start, end, oldOffset } in new-file line numbers;
 * oldOffset converts a new line number to its old one. Empty gaps have end < start.
 */
export function computeGaps(hunks, totalLines) {
  const gaps = [];
  let prevEnd = 0;
  let prevOldEnd = 0;
  for (const hunk of hunks) {
    const r = hunkRange(hunk.header);
    gaps.push({ start: prevEnd + 1, end: r.newStart - 1, oldOffset: r.oldStart - r.newStart });
    prevEnd = r.newEnd;
    prevOldEnd = r.oldEnd;
  }
  gaps.push({ start: prevEnd + 1, end: totalLines, oldOffset: prevOldEnd - prevEnd });
  return gaps;
}

/**
 * Splits a gap into the lines revealed at its top (below the previous hunk),
 * the lines revealed at its bottom (above the next hunk), and how many remain hidden.
 */
export function revealGap(gap, expansion, fileLines) {
  const size = Math.max(0, gap.end - gap.start + 1);
  const top = Math.min(expansion?.top ?? 0, size);
  const bottom = Math.min(expansion?.bottom ?? 0, size - top);
  const toLine = (n) => ({ type: 'context', oldNum: n + gap.oldOffset, newNum: n, content: fileLines[n - 1] ?? '' });
  const range = (from, count) => Array.from({ length: count }, (_, i) => toLine(from + i));
  return {
    topLines: range(gap.start, top),
    bottomLines: range(gap.end - bottom + 1, bottom),
    hidden: size - top - bottom,
  };
}
