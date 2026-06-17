import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { TResourceEntity } from './entities';

const PAGE_SIZE = 6;

export const useResourcePagination = <T>(
  entity: TResourceEntity,
  mockItems: T[],
) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const getPage = (skip: number, take: number) => ({
    items: mockItems.slice(skip, skip + take),
    has_more: skip + take < mockItems.length,
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['resources', entity],
      initialPageParam: 0,
      queryFn: ({ pageParam: skip }) => getPage(skip, PAGE_SIZE),
      getNextPageParam: (lastPage, _pages, skip) =>
        lastPage.has_more ? skip + PAGE_SIZE : undefined,
      initialData: { pages: [getPage(0, PAGE_SIZE)], pageParams: [0] },
      staleTime: Infinity,
    });

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        observer.disconnect();
        void fetchNextPage();
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [data.pages.length, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    items: data.pages.flatMap((page) => page.items),
    hasMore: hasNextPage,
    loadMoreRef,
  };
};
