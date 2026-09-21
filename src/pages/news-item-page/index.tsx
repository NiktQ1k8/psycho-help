import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Link, useNavigate } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import dayjs from 'dayjs';
import { newsItemQueries } from '@/entities/news/api/queries';
import chevronLeft from '@/shared/assets/images/news/chevron-left.svg';
import { Button } from '@/shared/ui';
import Loader from '@/shared/ui/loader/loader';
import styles from './NewsItemPage.module.scss';

export const NewsItemPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    data: newsItem,
    isLoading,
    error,
  } = useQuery(newsItemQueries.bySlug(slug!));

  useEffect(() => {
    window.scroll(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.newsItemHeader}>
        <Link
          to="/news"
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          <img src={chevronLeft} alt="Назад" />
          Новости
        </Link>
        <div className={styles.info}>
          <p>{dayjs(newsItem.date).format('DD.MM.YYYY')}</p>
          <p>{newsItem.type}</p>
        </div>
      </div>
      <h1 className={styles.title}>{newsItem.title}</h1>
      {newsItem.image && (
        <div className={styles.imageWrapper}>
          <img
            src={`${import.meta.env.VITE_REACT_APP_IMAGE_URL}${newsItem.image}`}
            alt={newsItem.title}
          />
        </div>
      )}

      {newsItem.text && (
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: newsItem.text }}
        />
      )}

      <Button
        className={styles.bottomBtn}
        icon={<LeftOutlined />}
        variant="secondary"
        onClick={() => navigate(-1)}
      >
        Другие новости
      </Button>
    </div>
  );
};
