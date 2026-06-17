import { useParams } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import { articleMocks } from '@/entities/article/model/mock';
import { ResourceUnavailable } from '@/features/resources/ui/ResourceUnavailable/ResourceUnavailable';
import { SLUG } from '@/shared/config/slug';
import { usePageTitle } from '@/shared/hooks/usePageTitle';
import { moscowDate } from '@/shared/lib/date-time';
import { sanitizeHtml } from '@/shared/lib/html';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './Article.module.scss';

export const Article = () => {
  const { id } = useParams();
  const article = articleMocks.find((item) => item.id === id);
  usePageTitle(article?.title ?? 'Статья');

  if (!article) {
    return (
      <ResourceUnavailable
        text="Статья не найдена"
        to={SLUG.RESOURCES_ARTICLES}
      />
    );
  }

  return (
    <article className={styles.wrapper} aria-labelledby="article-title">
      <div>
        <div className={styles.top}>
          <BackButton
            darkColor="var(--labels-brand-tetriary)"
            text="Полезные материалы"
            to={SLUG.RESOURCES_ARTICLES}
          />

          <div className={styles.info}>
            {article.date && (
              <time dateTime={article.date}>
                {moscowDate(article.date).toFormat('dd.MM.yyyy')}
              </time>
            )}
            {article.author && <p>{article.author}</p>}
          </div>
        </div>
        <h1 className={styles.title} id="article-title">
          {article.title}
        </h1>
      </div>
      <div
        className={styles.content}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.text) }}
      />

      <ButtonLink
        className={styles.bottomBtn}
        icon={<LeftOutlined aria-hidden />}
        to={SLUG.RESOURCES_ARTICLES}
        variant="secondary"
      >
        Другие статьи
      </ButtonLink>
    </article>
  );
};
