import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import DOMPurify from 'dompurify';
import { newsQueries } from '@/entities/news/api/queries';
import { SLUG } from '@/shared/config/slug';
import dayjs from '@/shared/lib/dayjs';
import { getImageSrc } from '@/shared/lib/getImageSrc';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { Gallery } from '@/shared/ui/gallery/Gallery';
import Loader from '@/shared/ui/loader/loader';
import styles from './NewsItem.module.scss';
import ChevronLeft from './assets/chevron-left.svg?react';

export const NewsItem = () => {
  const { id } = useParams();
  const {
    data: newsItem,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useQuery(newsQueries.byId(id ?? ''));

  if (id && isPending) {
    return (
      <div className={styles.wrapper} role="status">
        <Loader inline />
      </div>
    );
  }

  if (isError && !newsItem) {
    return (
      <div className={styles.wrapper} role="alert">
        <Result
          status="error"
          title="Не удалось загрузить новость"
          extra={
            <div className={styles.actions}>
              <ButtonLink onClick={() => void refetch()} disabled={isFetching}>
                Попробовать снова
              </ButtonLink>
              <ButtonLink to={SLUG.NEWS}>Все новости</ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className={styles.wrapper}>
        <Result
          status="404"
          title="Новость не найдена"
          extra={
            <div className={styles.actions}>
              <ButtonLink to={SLUG.NEWS}>Все новости</ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <article className={styles.wrapper}>
      {isError && (
        <p role="alert">
          Не удалось обновить новость. Показаны ранее загруженные данные.
        </p>
      )}
      <header>
        <div className={styles.newsHeader}>
          <Link to={SLUG.NEWS} className={styles.backButton}>
            <ChevronLeft aria-hidden />
            Новости
          </Link>
          <div className={styles.info}>
            <time dateTime={newsItem.date}>
              {dayjs(newsItem.date).tz().format('DD.MM.YYYY')}
            </time>
            {newsItem.type && <span>{newsItem.type}</span>}
          </div>
        </div>
        <h1 className={styles.title}>{newsItem.title}</h1>
      </header>
      <Gallery
        key={newsItem.id}
        images={newsItem.images?.map(getImageSrc)}
        title={newsItem.title}
      />

      {newsItem.text && (
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(newsItem.text, {
              USE_PROFILES: { html: true },
            }),
          }}
        />
      )}

      <ButtonLink
        className={styles.bottomBtn}
        icon={<ChevronLeft aria-hidden />}
        variant="secondary"
        to={SLUG.NEWS}
      >
        Другие новости
      </ButtonLink>
    </article>
  );
};
