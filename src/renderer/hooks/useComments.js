import { useState, useCallback } from 'react';

let nextId = 1;

function useComments() {
  const [comments, setComments] = useState([]);

  const addComment = useCallback((comment) => {
    const id = nextId++;
    const newComment = { ...comment, id };
    setComments((prev) => [...prev, newComment]);
    return id;
  }, []);

  const updateComment = useCallback((id, text) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text } : c))
    );
  }, []);

  const deleteComment = useCallback((id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCommentsForFile = useCallback(
    (filePath) => comments.filter((c) => c.filePath === filePath),
    [comments]
  );

  return { comments, addComment, updateComment, deleteComment, getCommentsForFile };
}

export default useComments;
