import styles from './Loader.module.scss';

const Loader = () => {
  return (
    <div className={styles.loader__wrapper}>
      <span className={styles.loader__item}></span>
      <span className={styles.loader__text}>Загрузка...</span>
    </div>
  );
};

export default Loader;
