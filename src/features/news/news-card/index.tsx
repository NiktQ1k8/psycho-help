import type { FC } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { News } from '@/entities/news/types';
import newsLink from '@/shared/assets/images/news/news-link.svg';
import styles from './NewsCard.module.scss';

// import Img from '@/shared/ui/img/Img';
// import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';

interface Props {
  newsItem: News;
  linkToDetails?: boolean;
}

export const NewsCard: FC<Props> = ({ newsItem, linkToDetails = true }) => {
  const content = (
    <div className={styles.wrapper}>
      {/* По моему мнению намного красивее с картинкой, но в макете её нет((( */}
      {/* {newsItem.image && (
        <div className={styles.photoWrapper}>
          <Img
            className={styles.photo}
            photo={`${import.meta.env.VITE_REACT_APP_IMAGE_URL}` + newsItem.image}
            altPhoto={altPhoto}
          />
        </div>
      )} */}
      <div className={styles.cardHeader}>
        {newsItem.type && <div className={styles.type}>{newsItem.type}</div>}
        <div className={styles.date}>
          {dayjs(newsItem.date).format('DD.MM.YYYY')}
        </div>
      </div>
      <p className={styles.title}>{newsItem.title}</p>
      {newsItem.description && (
        <p className={styles.description}>{newsItem.description}</p>
      )}
      <img src={newsLink} className={styles.externalLink} />
    </div>
  );

  if (!linkToDetails) return content;

  return (
    <Link
      to={`/news/${newsItem.slug}`}
      className={styles.link}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {content}
    </Link>
  );
};
