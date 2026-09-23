/**
 * Finds every case-insensitive occurrence of `query` in the diff's line content.
 * Returns matches in document order: { hunkIdx, lineIdx, start, end }.
 */
export function findMatches(hunks, query) {
  if (!query) return [];
  const needle = query.toLowerCase();
  const matches = [];
  hunks.forEach((hunk, hunkIdx) => {
    hunk.lines.forEach((line, lineIdx) => {
      const haystack = line.content.toLowerCase();
      let pos = haystack.indexOf(needle);
      while (pos !== -1) {
        matches.push({ hunkIdx, lineIdx, start: pos, end: pos + needle.length });
        pos = haystack.indexOf(needle, pos + needle.length);
      }
    });
  });
  return matches;
}
