import { newsQueries } from '@/entities/news/api/queries';
import { NewsBanner } from '@/pages/news-page/components/news-banner/NewsBanner';
import { NewsHero } from '@/pages/news-page/components/news-hero/NewsHero';
import { NewsList } from '@/pages/news-page/components/news-list/NewsList';
import Loader from '@/shared/ui/loader/loader';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import styles from './NewsPage.module.scss';

export const NewsPage = () => {
  const { data: news, isLoading, error } = useQuery(newsQueries.list());

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (!news || error) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <div className={styles.news}>
      <NewsHero />

      <div className={styles.listWrapper}>
        <NewsList news={news} />

        <NewsBanner />
      </div>
    </div>
  );
};
