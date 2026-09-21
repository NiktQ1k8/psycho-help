import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { newsItemQueries } from '@/entities/news/api/queries';
import NewsList from '@/features/news/news-list';
import newsHeroImage from '@/shared/assets/images/news/news-hero-image.png';
import telegramIcon from '@/shared/assets/images/news/telegram-icon.svg';
import Loader from '@/shared/ui/loader/loader';
import styles from './NewsPage.module.scss';

// import { Button } from '@/shared/ui';

export const NewsPage = () => {
  const { data: news, isLoading, error } = useQuery(newsItemQueries.list());

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }
  if (!news || error) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.blue}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Новости</h1>
          <img
            src={newsHeroImage}
            alt="Изображение новости"
            className={styles.image}
          />
          <p className={styles.text}>
            Здесь вы всегда будете в курсе последних событий, анонсов и
            изменений в работе нашей Службы психологической помощи.
          </p>
        </div>
      </div>

      <div className={styles.listWrapper}>
        <NewsList news={news} />

        <div className={styles.telegramBanner}>
          <h2 className={styles.telegramTitle}>Новости в нашем Telegram</h2>
          <p className={styles.telegramText}>
            Подпишитесь, чтобы узнавать актуальную информацию самыми первыми
          </p>
          <img
            src={telegramIcon}
            alt="Telegram"
            className={styles.telegramIcon}
          />
          <a
            href="https://vk.com/spp_polytech"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            Подписаться
            {/* <Button variant="primary">Подписаться</Button> */}
          </a>
        </div>
      </div>
    </div>
  );
};
