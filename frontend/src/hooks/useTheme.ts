import { useEffect } from 'react';
import { theme as antdTheme } from 'antd';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const getSystemTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: getSystemTheme(),
      toggle: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'evkin-theme',
    }
  )
);

function applyThemeToDOM(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function useTheme() {
  const { mode, toggle, setMode } = useThemeStore();
  
  // Sync with DOM whenever mode changes
  useEffect(() => {
    applyThemeToDOM(mode);
  }, [mode]);

  const isDark = mode === 'dark';
  const algorithm = isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return { mode, toggle, setMode, isDark, algorithm };
}

