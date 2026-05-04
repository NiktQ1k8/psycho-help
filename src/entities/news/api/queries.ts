import { queryOptions } from '@tanstack/react-query';

const getMockNews = async () => (await import('../model/mock')).mockNews;

export const newsQueryKey = {
  list: 'news.list',
  byId: 'news.byId',
};

export const newsQueries = {
  list: (params?: { skip?: number; take?: number }) =>
    queryOptions({
      queryKey: [newsQueryKey.list, params],
      queryFn: async () => {
        const { skip = 0, take = 100 } = params ?? {};

        return (await getMockNews()).slice(skip, skip + take);
      },
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: [newsQueryKey.byId, id],
      queryFn: async () => {
        return (await getMockNews()).find((item) => item.id === id) ?? null;
      },
      enabled: !!id,
    }),
};
