import newsHero from '@/shared/assets/images/news/news-hero.png';
import styles from './NewsHero.module.scss';

export const NewsHero = () => {
  return (
    <div className={styles.hero}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Новости</h2>
        <p className={styles.text}>
          Здесь вы всегда будете в курсе последних событий, анонсов и изменений в работе нашей
          Службы психологической помощи.
        </p>
        <img src={newsHero} className={styles.image} />
      </div>
    </div>
  );
};
