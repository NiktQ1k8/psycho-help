import clsx from 'clsx';
import styles from './Loader.module.scss';

interface ILoaderProps {
  inline?: boolean;
}

const Loader = ({ inline = false }: ILoaderProps) => {
  return (
    <div className={clsx(styles.loader__wrapper, inline && styles.inline)}>
      <span className={styles.loader__item} aria-hidden />
      <span className={styles.loader__text}>Загрузка...</span>
    </div>
  );
};

export default Loader;
