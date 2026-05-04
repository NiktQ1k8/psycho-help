import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { newsQueries } from '@/entities/news/api/queries';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import Loader from '@/shared/ui/loader/loader';
import { NewsBanner } from '../NewsBanner/NewsBanner';
import { NewsHero } from '../NewsHero/NewsHero';
import { NewsList } from '../NewsList/NewsList';
import styles from './News.module.scss';

export const News = () => {
  const {
    data: news,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(newsQueries.list());

  return (
    <div className={styles.news}>
      <NewsHero />
      <div className={styles.listWrapper}>
        <section
          className={styles.listContent}
          aria-label="Список новостей"
          aria-busy={isPending}
        >
          {isPending ? (
            <div role="status">
              <Loader inline />
            </div>
          ) : isError && !news ? (
            <div role="alert">
              <Result
                status="error"
                title="Не удалось загрузить новости"
                extra={
                  <div className={styles.actions}>
                    <ButtonLink
                      onClick={() => void refetch()}
                      disabled={isFetching}
                    >
                      Попробовать снова
                    </ButtonLink>
                  </div>
                }
              />
            </div>
          ) : (
            <>
              {isError && (
                <p role="alert">
                  Не удалось обновить новости. Показаны ранее загруженные
                  данные.
                </p>
              )}
              <NewsList news={news ?? []} />
            </>
          )}
        </section>
        <NewsBanner />
      </div>
    </div>
  );
};
