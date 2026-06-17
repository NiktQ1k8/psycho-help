import { useEffect } from 'react';

export const usePageTitle = (title: string) => {
  useEffect(() => {
    const siteTitle = document.title;
    document.title = `${title} — ${siteTitle}`;
    return () => {
      document.title = siteTitle;
    };
  }, [title]);
};
