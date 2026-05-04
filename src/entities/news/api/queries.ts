import { queryOptions } from '@tanstack/react-query';
import type { News } from '@/entities/news/types';
import type { ResponseError } from '@/shared/api';
import { $api } from '@/shared/api/http.ts';

export const newsQueryKey = {
  list: 'news.list',
  byId: 'news.byId',
};

export const newsQueries = {
  list: (params?: { skip?: number; take?: number }) =>
    queryOptions<News[], ResponseError>({
      queryKey: [newsQueryKey.list, params],
      queryFn: async () =>
        (
          await $api.get('/news/', {
            params: { skip: 0, take: 100, ...params },
          })
        ).data,
    }),

  byId: (id: string) =>
    queryOptions<News, ResponseError>({
      queryKey: [newsQueryKey.byId, id],
      queryFn: async () => (await $api.get(`/news/${id}`)).data,
      enabled: !!id,
    }),
};
