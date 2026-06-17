import { articleMocks } from '@/entities/article/model/mock';
import { ResourceEntities } from '../../model/entities';
import { useResourcePagination } from '../../model/useResourcePagination';
import styles from './ArticlesList.module.scss';
import { ArticleCard } from './components/ArticleCard/ArticleCard';

export const ArticlesList = () => {
  const {
    items: articles,
    hasMore,
    loadMoreRef,
  } = useResourcePagination(ResourceEntities.ARTICLES, articleMocks);

  return (
    <div className={styles.wrapper}>
      <ul className={styles.articleList} aria-label="Статьи" role="list">
        {articles.map((item) => (
          <li key={item.id}>
            <ArticleCard article={item} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className={styles.loadMoreTrigger} aria-hidden ref={loadMoreRef} />
      )}
    </div>
  );
};
