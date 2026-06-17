import { useCallback } from 'react';

export const useLoadMore = (
  enabled: boolean,
  fetchNextPage: (options: { cancelRefetch: boolean }) => Promise<unknown>,
) =>
  useCallback(
    (target: HTMLLIElement | null) => {
      if (!enabled || !target) return;
      const load = () => void fetchNextPage({ cancelRefetch: false });
      if (typeof IntersectionObserver === 'undefined') {
        load();
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          load();
        },
        { rootMargin: '200px 0px' },
      );
      observer.observe(target);
      return () => observer.disconnect();
    },
    [enabled, fetchNextPage],
  );
