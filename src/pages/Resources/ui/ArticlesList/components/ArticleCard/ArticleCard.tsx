import { getArticlePreview } from '@/entities/article/lib/content';
import type { TArticle } from '@/entities/article/types';
import articleCover from '@/shared/assets/images/resources/article-cover.jpg';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './ArticleCard.module.scss';

interface IArticleCardProps {
  article: TArticle;
}

export const ArticleCard = ({ article }: IArticleCardProps) => {
  const { id } = article;
  const preview = getArticlePreview(article.text);

  return (
    <article className={styles.root}>
      <img
        className={styles.image}
        alt=""
        loading="lazy"
        src={article.image ?? articleCover}
        onError={({ currentTarget }) => {
          if (currentTarget.getAttribute('src') !== articleCover)
            currentTarget.src = articleCover;
        }}
      />
      <div className={styles.content}>
        <div className={styles.description}>
          <h2 className={styles.title}>{article.title}</h2>
          {preview && <p className={styles.text}>{preview}</p>}
          {(article.author || article.date) && (
            <div className={styles.info}>
              {article.author && <span>{article.author}</span>}
              {article.date && (
                <time className={styles.date} dateTime={article.date}>
                  {moscowDate(article.date).toFormat('dd.MM.yyyy')}
                </time>
              )}
            </div>
          )}
        </div>
        <ButtonLink
          className={styles.button}
          aria-label={`Читать статью «${article.title}»`}
          to={`${SLUG.ARTICLE}/${id}`}
          variant="secondary"
        >
          Читать
        </ButtonLink>
      </div>
    </article>
  );
};
