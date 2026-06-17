import { articleMocks } from '@/entities/article/model/mock';
import { ResourceEntities } from '../../model/entities';
import { useResourcePagination } from '../../model/useResourcePagination';
import styles from './ArticlesList.module.scss';
import { ArticleCard } from './components/ArticleCard/ArticleCard';

export const ArticlesList = () => {
  const { items: articles, loadMoreRef } = useResourcePagination(
    ResourceEntities.ARTICLES,
    articleMocks,
  );

  return (
    <ul className={styles.list} aria-label="Статьи" role="list">
      {articles.map((item, index) => (
        <li
          key={item.id}
          ref={index === articles.length - 1 ? loadMoreRef : undefined}
        >
          <ArticleCard article={item} />
        </li>
      ))}
    </ul>
  );
};
