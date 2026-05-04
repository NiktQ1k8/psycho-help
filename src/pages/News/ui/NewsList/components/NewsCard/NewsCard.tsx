import { Link } from 'react-router-dom';
import type { TNews } from '@/entities/news/types';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { getImageSrc } from '@/shared/lib/getImageSrc';
import styles from './NewsCard.module.scss';
import link from './assets/link.svg';

interface INewsCardProps {
  news: TNews;
}

export const NewsCard = ({ news }: INewsCardProps) => {
  const image = news.images?.find(Boolean);

  return (
    <article className={styles.article}>
      <Link
        className={styles.link}
        to={`${SLUG.NEWS}/${encodeURIComponent(news.id)}`}
        aria-label={news.title}
      >
        {image && (
          <div className={styles.imageWrapper}>
            <img
              className={styles.image}
              src={getImageSrc(image)}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className={styles.header}>
          {news.type && <span className={styles.type}>{news.type}</span>}
          {news.date && (
            <time className={styles.date} dateTime={news.date}>
              {moscowDate(news.date).toFormat('dd.MM.yyyy')}
            </time>
          )}
        </div>
        <h2 className={styles.title}>{news.title}</h2>
        <img className={styles.icon} src={link} width={25} height={25} alt="" />
      </Link>
    </article>
  );
};
