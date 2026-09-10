export function fileFingerprint(file) {
  return `${file.status}:${file.additions}:${file.deletions}`;
}

export function pruneReviewedFiles(reviewedFiles, files) {
  const fileMap = Object.fromEntries(files.map((f) => [f.path, fileFingerprint(f)]));
  const pruned = {};
  for (const [path, fp] of Object.entries(reviewedFiles)) {
    if (fileMap[path] === fp) {
      pruned[path] = fp;
    }
  }
  return pruned;
}
