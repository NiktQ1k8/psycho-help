import type { FC } from 'react';
import type { TNews } from '@/entities/news/types';
import { NewsCard } from '../news-card';
import styles from './NewsList.module.scss';

interface Props {
  news: TNews[];
}

const NewsList: FC<Props> = ({ news }) => {
  return (
    <div className={styles.list}>
      {news.map((newsItem) => (
        <NewsCard newsItem={newsItem} key={newsItem.id} />
      ))}
    </div>
  );
};

export default NewsList;
