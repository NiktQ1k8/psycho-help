import { type QueryObserverOptions, queryOptions } from '@tanstack/react-query';
import type { TNews } from '@/entities/news/types';
import { $api } from '@/shared/api/http.ts';

export const newsItemQueryKey = {
  list: 'newsItem.list',
  byId: 'newsItem.byId',
};

export const newsItemQueries = {
  list: (options?: Partial<QueryObserverOptions<TNews[], Error>>) =>
    queryOptions<TNews[], Error>({
      queryKey: [newsItemQueryKey.list],
      queryFn: async () => (await $api.get<TNews[]>('/news/')).data,
      ...options,
    }),

  byId: (id: string, options?: Partial<QueryObserverOptions<TNews, Error>>) =>
    queryOptions<TNews, Error>({
      queryKey: [newsItemQueryKey.byId, id],
      queryFn: async () => (await $api.get<TNews>(`/news/${id}`)).data,
      enabled: !!id,
      ...options,
    }),
};
