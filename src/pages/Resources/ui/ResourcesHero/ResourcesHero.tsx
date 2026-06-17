import styles from './ResourcesHero.module.scss';
import ResourcesImage from './assets/resources-hero.svg';

export const ResourcesHero = () => (
  <div className={styles.hero}>
    <div className={styles.info}>
      <h1 className={styles.title}>Полезные материалы</h1>
      <p className={styles.features}>
        Психологические тесты • Материалы о тревожности • Статьи по психологии •
        Опросы
      </p>
    </div>
    <img className={styles.image} alt="" src={ResourcesImage} />
  </div>
);
