import { useState, useCallback } from 'react';

function createTab(repoPath = null) {
  return {
    id: crypto.randomUUID(),
    repoPath,
    currentBranch: null,
    changedFiles: [],
    selectedFile: null,
  };
}

function useTabs() {
  const [tabs, setTabs] = useState([createTab()]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const addTab = useCallback((repoPath = null) => {
    const newTab = createTab(repoPath);
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    return newTab.id;
  }, []);

  const closeTab = useCallback((id) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      setActiveTabId((currentActive) => {
        if (currentActive !== id) return currentActive;
        const newIdx = Math.min(idx, next.length - 1);
        return next[newIdx].id;
      });
      return next;
    });
  }, []);

  const switchTab = useCallback((id) => {
    setActiveTabId(id);
  }, []);

  const updateTab = useCallback((id, patch) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const findTabByRepo = useCallback((repoPath, excludeTabId) => {
    return tabs.find(
      (t) => t.id !== excludeTabId && t.repoPath === repoPath
    );
  }, [tabs]);

  return { tabs, activeTab, activeTabId, addTab, closeTab, switchTab, updateTab, findTabByRepo };
}

export { createTab };
export default useTabs;
