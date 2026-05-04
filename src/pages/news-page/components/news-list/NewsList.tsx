import type { FC } from 'react';
import type { News } from '@/entities/news/types';
import { NewsCard } from '@/pages/news-page/components/news-card/NewsCard';
import styles from './NewsList.module.scss';

interface Props {
  news: News[];
}

export const NewsList: FC<Props> = ({ news }) => {
  return (
    <div className={styles.list}>
      {news.map((newsItem) => (
        <NewsCard news={newsItem} key={newsItem.id} />
      ))}
    </div>
  );
};
