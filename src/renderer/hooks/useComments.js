import { useState, useCallback, useRef } from 'react';
import { pruneReviewedFiles } from '../utils/reviewedFiles';

let nextId = 1;

function useComments(repoPath, branch) {
  const [comments, setComments] = useState([]);
  const [generalComment, setGeneralCommentState] = useState('');
  const [reviewedFiles, setReviewedFilesState] = useState({});
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

  const saveReviewedToDisk = useCallback((updatedReviewedFiles) => {
    const repo = repoPathRef.current;
    const br = branchRef.current;
    if (repo && br && window.electronAPI.saveReviewedFiles) {
      window.electronAPI.saveReviewedFiles(repo, br, updatedReviewedFiles);
    }
  }, []);

  const loadFromDisk = useCallback(async (repo, br) => {
    if (!repo || !br) {
      setComments([]);
      setGeneralCommentState('');
      setReviewedFilesState({});
      return [];
    }
    const loaded = await window.electronAPI.loadComments(repo, br);
    if (loaded.length > 0) {
      const maxId = Math.max(...loaded.map((c) => c.id));
      if (maxId >= nextId) nextId = maxId + 1;
    }
    setComments(loaded);
    const general = window.electronAPI.loadGeneralComment
      ? await window.electronAPI.loadGeneralComment(repo, br)
      : '';
    setGeneralCommentState(general || '');
    const reviewed = window.electronAPI.loadReviewedFiles
      ? await window.electronAPI.loadReviewedFiles(repo, br)
      : {};
    setReviewedFilesState(reviewed || {});
    return loaded;
  }, []);

  const setGeneralComment = useCallback((text) => {
    setGeneralCommentState(text);
    const repo = repoPathRef.current;
    const br = branchRef.current;
    if (repo && br && window.electronAPI.saveGeneralComment) {
      window.electronAPI.saveGeneralComment(repo, br, text);
    }
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
    setGeneralCommentState('');
    const repo = repoPathRef.current;
    const br = branchRef.current;
    if (repo && br && window.electronAPI.saveGeneralComment) {
      window.electronAPI.saveGeneralComment(repo, br, '');
    }
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

  const toggleReviewed = useCallback((filePath, fingerprint) => {
    setReviewedFilesState((prev) => {
      const next = { ...prev };
      if (next[filePath]) {
        delete next[filePath];
      } else {
        next[filePath] = fingerprint;
      }
      saveReviewedToDisk(next);
      return next;
    });
  }, [saveReviewedToDisk]);

  const pruneReviewedForFiles = useCallback((files) => {
    setReviewedFilesState((prev) => {
      const pruned = pruneReviewedFiles(prev, files);
      if (Object.keys(pruned).length !== Object.keys(prev).length) {
        saveReviewedToDisk(pruned);
      }
      return pruned;
    });
  }, [saveReviewedToDisk]);

  const getCommentsForFile = useCallback(
    (filePath) => comments.filter((c) => c.filePath === filePath),
    [comments]
  );

  return { comments, generalComment, setGeneralComment, addComment, updateComment, deleteComment, clearAll, getCommentsForFile, loadFromDisk, pruneForFiles, reviewedFiles, toggleReviewed, pruneReviewedForFiles };
}

export default useComments;
