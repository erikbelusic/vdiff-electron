import { useState, useCallback, useRef } from 'react';

let nextId = 1;

function useComments(repoPath, branch) {
  const [comments, setComments] = useState([]);
  const repoPathRef = useRef(repoPath);
  const branchRef = useRef(branch);
  repoPathRef.current = repoPath;
  branchRef.current = branch;

  const saveToDisk = useCallback((updatedComments) => {
    const repo = repoPathRef.current;
    const br = branchRef.current;
    if (repo && br) {
      window.electronAPI.saveComments(repo, br, updatedComments);
    }
  }, []);

  const loadFromDisk = useCallback(async (repo, br) => {
    if (!repo || !br) {
      setComments([]);
      return [];
    }
    const loaded = await window.electronAPI.loadComments(repo, br);
    if (loaded.length > 0) {
      const maxId = Math.max(...loaded.map((c) => c.id));
      if (maxId >= nextId) nextId = maxId + 1;
    }
    setComments(loaded);
    return loaded;
  }, []);

  const addComment = useCallback((comment) => {
    const id = nextId++;
    const newComment = { ...comment, id };
    setComments((prev) => {
      const updated = [...prev, newComment];
      saveToDisk(updated);
      return updated;
    });
    return id;
  }, [saveToDisk]);

  const updateComment = useCallback((id, text) => {
    setComments((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, text } : c));
      saveToDisk(updated);
      return updated;
    });
  }, [saveToDisk]);

  const deleteComment = useCallback((id) => {
    setComments((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToDisk(updated);
      return updated;
    });
  }, [saveToDisk]);

  const clearAll = useCallback(() => {
    setComments([]);
    saveToDisk([]);
  }, [saveToDisk]);

  const pruneForFiles = useCallback((validFilePaths) => {
    setComments((prev) => {
      const validSet = new Set(validFilePaths);
      const updated = prev.filter((c) => validSet.has(c.filePath));
      if (updated.length !== prev.length) {
        saveToDisk(updated);
      }
      return updated;
    });
  }, [saveToDisk]);

  const getCommentsForFile = useCallback(
    (filePath) => comments.filter((c) => c.filePath === filePath),
    [comments]
  );

  return { comments, addComment, updateComment, deleteComment, clearAll, getCommentsForFile, loadFromDisk, pruneForFiles };
}

export default useComments;
