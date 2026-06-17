import { useInfiniteQuery } from '@tanstack/react-query';
import { testQueries } from '@/entities/test/api/queries';
import { getRequestErrorMessage } from '@/shared/api/errors';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { useLoadMore } from '../../model/useLoadMore';
import styles from './TestsList.module.scss';
import { TestCard } from './components/TestCard/TestCard';

export const TestsList = () => {
  const catalog = useInfiniteQuery(testQueries.list());
  const { data, fetchNextPage, hasNextPage, isFetchNextPageError, isFetching } =
    catalog;
  const loadMoreRef = useLoadMore(
    hasNextPage && !isFetching && !catalog.isError,
    fetchNextPage,
  );
  const tests = data?.pages.flat() ?? [];

  return (
    <div className={styles.root}>
      {catalog.isPending && <p role="status">Загружаем тесты…</p>}
      {catalog.isSuccess && tests.length === 0 && (
        <p role="status">Пока нет опубликованных тестов.</p>
      )}
      {tests.length > 0 && (
        <ul
          className={styles.list}
          aria-busy={catalog.isFetchingNextPage}
          aria-label="Тесты"
          role="list"
        >
          {tests.map((item, index) => (
            <li
              className={styles.item}
              key={item.id}
              ref={index === tests.length - 1 ? loadMoreRef : undefined}
            >
              <TestCard test={item} />
            </li>
          ))}
        </ul>
      )}
      {catalog.isError && (
        <div>
          <p role="alert">
            {getRequestErrorMessage(
              catalog.error,
              'Не удалось загрузить тесты. Повторите попытку.',
            )}
          </p>
          <ButtonLink
            disabled={isFetching}
            variant="secondary"
            onClick={() => {
              if (isFetchNextPageError)
                void fetchNextPage({ cancelRefetch: false });
              else void catalog.refetch();
            }}
          >
            Повторить загрузку
          </ButtonLink>
        </div>
      )}
    </div>
  );
};
