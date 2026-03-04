import { useState, useCallback, useRef } from 'react';

let nextId = 1;

function useComments(repoPath) {
  const [comments, setComments] = useState([]);
  const repoPathRef = useRef(repoPath);
  repoPathRef.current = repoPath;

  const saveToDisk = useCallback((updatedComments) => {
    const repo = repoPathRef.current;
    if (repo) {
      window.electronAPI.saveComments(repo, updatedComments);
    }
  }, []);

  const loadFromDisk = useCallback(async (repo) => {
    if (!repo) {
      setComments([]);
      return [];
    }
    const loaded = await window.electronAPI.loadComments(repo);
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
