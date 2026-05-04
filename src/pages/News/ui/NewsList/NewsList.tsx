import type { TNews } from '@/entities/news/types';
import styles from './NewsList.module.scss';
import { NewsCard } from './components/NewsCard/NewsCard';

interface INewsListProps {
  news: TNews[];
}

export const NewsList = ({ news }: INewsListProps) => {
  if (news.length === 0) {
    return <p role="status">Новостей пока нет.</p>;
  }

  return (
    <ul className={styles.list}>
      {news.map((newsItem) => (
        <li className={styles.item} key={newsItem.id}>
          <NewsCard news={newsItem} />
        </li>
      ))}
    </ul>
  );
};
