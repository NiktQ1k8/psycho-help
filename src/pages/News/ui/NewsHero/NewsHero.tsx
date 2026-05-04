import styles from './NewsHero.module.scss';
import newsHero from './assets/hero.png';

export const NewsHero = () => {
  return (
    <header className={styles.hero}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <h1 className={styles.title}>Новости</h1>
          <p className={styles.text}>
            Здесь вы всегда будете в курсе последних событий, анонсов и
            изменений в работе нашей Службы психологической помощи.
          </p>
        </div>
        <img src={newsHero} className={styles.image} alt="" />
      </div>
    </header>
  );
};
