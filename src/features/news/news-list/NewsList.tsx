import type { FC } from 'react';
import type { TNews } from '@/entities/news/types';
import { NewsCard } from '../news-card/NewsCard';
import styles from './NewsList.module.scss';

interface INewsListProps {
  news: TNews[];
}

const NewsList: FC<INewsListProps> = ({ news }) => {
  return (
    <div className={styles.list}>
      {news.map((newsItem) => (
        <NewsCard newsItem={newsItem} key={newsItem.id} />
      ))}
    </div>
  );
};

export default NewsList;
