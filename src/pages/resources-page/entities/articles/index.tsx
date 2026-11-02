import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleCard } from '@/pages/resources-page/components';
import { TRANSLATES } from '@/pages/resources-page/consts';
import { articleMocks } from '@/pages/resources-page/entities/articles/mocks.ts';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
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
    navigate(`${SLUG.ARTICLE}/${id}`);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.articleList}>
        {articles.map((item, index) => {
          return (
            <ArticleCard
              bottomSlot={
                <ButtonLink
                  className={styles.readBtn}
                  variant="secondary"
                  // TODO: добавить настоящий id, когда появится бэк
                  onClick={handleOpenArticle.bind(null, MOCK_ARTICLE_ID)}
                >
                  {TRANSLATES.read}
                </ButtonLink>
              }
              data-testid="article-card"
              description={item.description}
              ellipseDescription
              hasHorizontalDesktopVersion
              info={{
                key: item.author,
                value: item.date,
              }}
              key={`articles-${index}`}
              title={item.title}
            />
          );
        })}
      </div>

      {isShowMoreVisible && (
        <ButtonLink className={styles.showMore} onClick={handleShowMore}>
          Показать ещё
        </ButtonLink>
      )}
    </div>
  );
};
