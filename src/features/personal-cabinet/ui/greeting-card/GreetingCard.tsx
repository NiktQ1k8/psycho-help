import type { FC } from 'react';
import egorImg from '@/shared/assets/images/cabinet/egor.png';
import styles from './greeting-card.module.scss';

interface GreetingCardProps {
  userName: string;
  onBookClick: () => void;
}

const GreetingCard: FC<GreetingCardProps> = ({ userName, onBookClick }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h2 className={styles.title}>Здравствуйте, {userName}!</h2>
        <p className={styles.text}>
          Ваши записи и свободные окна — здесь.
          <br />
          Выберите удобное время или специалиста.
        </p>
        <button className={styles.button} onClick={onBookClick}>
          Записаться
        </button>
      </div>
      <div className={styles.illustration}>
        <img src={egorImg} alt="Иллюстрация" className={styles.image} />
      </div>
    </div>
  );
};

export default GreetingCard;
