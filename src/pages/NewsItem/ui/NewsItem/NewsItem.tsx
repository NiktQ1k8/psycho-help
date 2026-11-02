import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import DOMPurify from 'dompurify';
import { newsQueries } from '@/entities/news/api/queries';
import { SLUG } from '@/shared/config/slug';
import { moscowDate } from '@/shared/lib/date-time';
import { getImageSrc } from '@/shared/lib/getImageSrc';
import { BackButton } from '@/shared/ui/back-button/BackButton';
import ChevronLeft from '@/shared/ui/back-button/assets/chevron-left.svg?react';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import { Gallery } from '@/shared/ui/gallery/Gallery';
import Loader from '@/shared/ui/loader/loader';
import styles from './NewsItem.module.scss';

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
          extra={
            <div className={styles.actions}>
              <ButtonLink disabled={isFetching} onClick={() => void refetch()}>
                Попробовать снова
              </ButtonLink>
              <ButtonLink to={SLUG.NEWS}>Все новости</ButtonLink>
            </div>
          }
          status="error"
          title={
            <h1 className={styles.statusTitle}>Не удалось загрузить новость</h1>
          }
        />
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className={styles.wrapper}>
        <Result
          extra={
            <div className={styles.actions}>
              <ButtonLink to={SLUG.NEWS}>Все новости</ButtonLink>
            </div>
          }
          status="404"
          title={<h1 className={styles.statusTitle}>Новость не найдена</h1>}
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
          <BackButton text="Новости" to={SLUG.NEWS} />
          <div className={styles.info}>
            <time dateTime={newsItem.date}>
              {moscowDate(newsItem.date).toFormat('dd.MM.yyyy')}
            </time>
            {newsItem.type && <span>{newsItem.type}</span>}
          </div>
        </div>
        <h1 className={styles.title}>{newsItem.title}</h1>
      </header>
      <Gallery
        images={newsItem.images?.map(getImageSrc)}
        key={newsItem.id}
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
        to={SLUG.NEWS}
        variant="secondary"
      >
        Другие новости
      </ButtonLink>
    </article>
  );
};
