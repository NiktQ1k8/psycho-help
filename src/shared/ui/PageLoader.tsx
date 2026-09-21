import styles from './PageLoader.module.scss';

const PageLoader = () => (
  <div className={styles.loaderCenter}>
    <div className={styles.loader__wrapper}>
      <span className={styles.loader__item}></span>
      <span className={styles.loader__text}>Загрузка...</span>
    </div>
  </div>
);

export default PageLoader;
