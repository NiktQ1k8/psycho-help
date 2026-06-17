import { useInfiniteQuery } from '@tanstack/react-query';
import type { TResourceEntity } from './entities';
import { useLoadMore } from './useLoadMore';

const PAGE_SIZE = 6;

export const useResourcePagination = <T>(
  entity: TResourceEntity,
  mockItems: T[],
) => {
  const getPage = (skip: number) => mockItems.slice(skip, skip + PAGE_SIZE);

  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
    queryKey: ['resources', entity],
    networkMode: 'always',
    initialPageParam: 0,
    queryFn: ({ pageParam: skip }) => getPage(skip),
    getNextPageParam: (_page, _pages, skip) =>
      skip + PAGE_SIZE < mockItems.length ? skip + PAGE_SIZE : undefined,
    initialData: { pages: [getPage(0)], pageParams: [0] },
    staleTime: Infinity,
  });

  const loadMoreRef = useLoadMore(hasNextPage && !isFetching, fetchNextPage);

  return {
    items: data.pages.flat(),
    loadMoreRef,
  };
};
