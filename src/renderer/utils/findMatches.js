/**
 * Finds every case-insensitive occurrence of `query` in the given lines' content.
 * Returns matches in order: { line, start, end }, where `line` is the matched
 * entry from `lines`.
 */
export function findMatches(lines, query) {
  if (!query) return [];
  const needle = query.toLowerCase();
  const matches = [];
  lines.forEach((line) => {
    const haystack = line.content.toLowerCase();
    let pos = haystack.indexOf(needle);
    while (pos !== -1) {
      matches.push({ line, start: pos, end: pos + needle.length });
      pos = haystack.indexOf(needle, pos + needle.length);
    }
  });
  return matches;
}
