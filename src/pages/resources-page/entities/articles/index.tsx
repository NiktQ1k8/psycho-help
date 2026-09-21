import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleCard } from '@/pages/resources-page/components';
import { TRANSLATES } from '@/pages/resources-page/consts';
import { articleMocks } from '@/pages/resources-page/entities/articles/mocks.ts';
import { Button } from '@/shared/ui/button';
import styles from './Articles.module.scss';

const initialArticles = articleMocks.slice(0, 6);

const MOCK_ARTICLE_ID = 1;

export const Articles = () => {
  const [articles, setArticles] = useState(initialArticles);
  const navigate = useNavigate();
  const handleShowMore = () => {
    setArticles(articleMocks);
  };

  const isShowMoreVisible = articles.length < articleMocks.length;

  const handleOpenArticle = (id: number | string) => {
    navigate(`/article/${id}`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.articleList}>
        {articles.map((item, index) => {
          return (
            <ArticleCard
              data-testid="article-card"
              ellipseDescription
              title={item.title}
              info={{
                key: item.author,
                value: item.date,
              }}
              description={item.description}
              bottomSlot={
                <Button
                  data-testid="read-article"
                  variant="secondary"
                  // TODO: добавить настоящий id, когда появится бэк
                  onClick={handleOpenArticle.bind(null, MOCK_ARTICLE_ID)}
                  className={styles.readBtn}
                >
                  {TRANSLATES.read}
                </Button>
              }
              hasHorizontalDesktopVersion
              key={`articles-${index}`}
            />
          );
        })}
      </div>

      {isShowMoreVisible && (
        <Button className={styles.showMore} onClick={handleShowMore}>
          Показать ещё
        </Button>
      )}
    </div>
  );
};
