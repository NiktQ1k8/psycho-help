import { queryOptions } from '@tanstack/react-query';
import { $api } from '@/shared/api/http.ts';
import type { ResponseError } from '@/shared/api';
import type { News } from '@/entities/news/types';

export const newsQueryKey = {
  list: 'news.list',
  // bySlug: 'news.bySlug',
  byId: 'news.byId',
};

export const newsQueries = {
  list: (params?: { skip?: number; take?: number }) =>
    queryOptions<News[], ResponseError>({
      queryKey: [newsQueryKey.list, params],
      queryFn: async () =>
        (await $api.get('/news/', { params: { skip: 0, take: 100, ...params } })).data,
    }),

  // bySlug: (slug: string) =>
  //   queryOptions<News, ResponseError>({
  //     queryKey: [newsQueryKey.bySlug, slug],
  //     queryFn: async () => (await $api.get(`/news/${slug}`)).data,
  //     enabled: !!slug,
  //   }),

  byId: (id: string) =>
    queryOptions<News, ResponseError>({
      queryKey: [newsQueryKey.byId, id],
      queryFn: async () => (await $api.get(`/news/${id}`)).data,
      enabled: !!id,
    }),
};
