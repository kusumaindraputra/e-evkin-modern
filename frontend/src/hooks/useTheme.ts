import { useState, useEffect, useCallback } from 'react';
import { theme as antdTheme } from 'antd';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'evkin-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyThemeToDOM(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Apply on first render
  useEffect(() => {
    applyThemeToDOM(getInitialTheme());
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const isDark = mode === 'dark';

  const algorithm = isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return { mode, toggle, isDark, algorithm };
}
