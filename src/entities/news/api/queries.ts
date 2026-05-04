import { queryOptions } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { TNews } from '@/entities/news/types';
import { $api } from '@/shared/api/http.ts';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

const getMockNews = async () => (await import('../model/mock')).mockNews;

export const newsQueryKey = {
  list: 'news.list',
  byId: 'news.byId',
};

export const newsQueries = {
  list: (params?: { skip?: number; take?: number }) =>
    queryOptions({
      queryKey: [newsQueryKey.list, params],
      queryFn: async ({ signal }) => {
        const { skip = 0, take = 100 } = params ?? {};

        if (!FEATURE_FLAGS.newsFromBackend) {
          return (await getMockNews()).slice(skip, skip + take);
        }

        return (
          await $api.get<TNews[]>('/news/', { params: { skip, take }, signal })
        ).data;
      },
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: [newsQueryKey.byId, id],
      queryFn: async ({ signal }) => {
        if (!FEATURE_FLAGS.newsFromBackend) {
          return (await getMockNews()).find((item) => item.id === id) ?? null;
        }

        try {
          return (
            await $api.get<TNews>(`/news/${encodeURIComponent(id)}`, { signal })
          ).data;
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 404) {
            return null;
          }
          throw error;
        }
      },
      enabled: !!id,
    }),
};
