import { REASONS_TO_VISIT } from '@/features/home/config/constants';
import styles from './ReasonsBlock.module.scss';

const ReasonsBlock = () => {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {REASONS_TO_VISIT.map((item, index) => (
          <div className={styles.card} key={index}>
            <div className={styles.imageWrapper}>
              <img
                className={`${styles.image} ${index === 0 ? styles.mirroredImage : ''}`}
                alt="Иллюстрация"
                src={item.image}
              />
            </div>
            <p className={styles.text}>{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReasonsBlock;
