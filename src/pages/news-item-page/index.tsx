import { newsQueries } from '@/entities/news/api/queries';
import chevronLeft from '@/shared/assets/images/news/chevron-left.svg';
import dayjs from '@/shared/lib/dayjs';
import { sanitizeHtml } from '@/shared/lib/sanitizeHtml';
import { Button } from '@/shared/ui';
import Loader from '@/shared/ui/loader/loader';
import { LeftOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NewsItemPage.module.scss';

export const NewsItemPage = () => {
  // const { slug } = useParams();
  const { id } = useParams();
  const navigate = useNavigate();
  // const { data: news, isLoading, error } = useQuery(newsQueries.bySlug(slug!));
  const { data: news, isLoading, error } = useQuery(newsQueries.byId(id!));

  const safeText = useMemo(() => sanitizeHtml(news?.text ?? ''), [news?.text]);

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

  if (error || !news) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.newsHeader}>
        <Link to="/news" onClick={() => navigate(-1)} className={styles.backButton}>
          <img src={chevronLeft} alt="Назад" />
          Новости
        </Link>
        <div className={styles.info}>
          <p>{dayjs(news.event_date).tz().format('DD.MM.YYYY')}</p>
          <p>{news.type}</p>
        </div>
      </div>
      <h2 className={styles.title}>{news.title}</h2>
      {news.image && (
        <div className={styles.imageWrapper}>
          <img src={`${import.meta.env.VITE_REACT_APP_IMAGE_URL}${news.image}`} alt={news.title} />
        </div>
      )}

      {safeText && (
        <div className={styles.content} dangerouslySetInnerHTML={{ __html: safeText }} />
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
