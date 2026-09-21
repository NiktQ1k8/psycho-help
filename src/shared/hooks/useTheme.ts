import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') return 'dark';
  if (stored === 'light') return 'light';
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const updateFavicon = (theme: Theme) => {
  const faviconLink =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (faviconLink) {
    faviconLink.href = theme === 'dark' ? '/favicon_dark.ico' : '/favicon.ico';
  }
};

export function useTheme() {
  const [currentTheme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    try {
      localStorage.setItem('theme', currentTheme);
    } catch {
      /* ignore */
    }
  }, [currentTheme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateFavicon(getSystemTheme());

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      updateFavicon(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-theme') {
          const current =
            root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
          setThemeState(current);
        }
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue === 'dark' ? 'dark' : 'light';
        setThemeState(newTheme);
        try {
          root.setAttribute('data-theme', newTheme);
        } catch {
          /* ignore */
        }
      }
    };

    window.addEventListener('storage', onStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('theme', t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light')),
    [],
  );

  return { currentTheme, setTheme, toggleTheme } as const;
}
