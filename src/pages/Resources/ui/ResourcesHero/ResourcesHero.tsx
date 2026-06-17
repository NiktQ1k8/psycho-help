import styles from './ResourcesHero.module.scss';
import ResourcesImage from './assets/resources-hero.svg';

export const ResourcesHero = () => (
  <div className={styles.root}>
    <div className={styles.info}>
      <h1 className={styles.title} id="resources-title">
        Полезные материалы
      </h1>
      <p className={styles.text}>
        Психологические тесты • Материалы о тревожности • Статьи по психологии •
        Опросы
      </p>
    </div>
    <img className={styles.image} alt="" src={ResourcesImage} />
  </div>
);
