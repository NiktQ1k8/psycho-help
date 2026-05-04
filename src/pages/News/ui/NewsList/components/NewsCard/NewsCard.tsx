import { Link } from 'react-router-dom';
import type { TNews } from '@/entities/news/types';
import { SLUG } from '@/shared/config/slug';
import dayjs from '@/shared/lib/dayjs';
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
              {dayjs(news.date).tz().format('DD.MM.YYYY')}
            </time>
          )}
        </div>
        <h2 className={styles.title}>{news.title}</h2>
        <img src={link} width={25} height={25} alt="" />
      </Link>
    </article>
  );
};
