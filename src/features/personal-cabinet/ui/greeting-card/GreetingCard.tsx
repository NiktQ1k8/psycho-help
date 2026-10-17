import type { FC } from 'react';
import egorImg from '@/shared/assets/images/cabinet/egor.png';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './greeting-card.module.scss';

interface IGreetingCardProps {
  userName: string;
}

const GreetingCard: FC<IGreetingCardProps> = ({ userName }) => {
  return (
    <div className={styles.card}>
      <div className={styles.content}>
        <h2 className={styles.title}>Здравствуйте, {userName}!</h2>
        <p className={styles.text}>
          Ваши записи и свободные окна — здесь.
          <br />
          Выберите удобное время или специалиста.
        </p>
        <ButtonLink
          to={`${SLUG.CABINET}?tab=userAppointments`}
          className={styles.button}
        >
          Записаться
        </ButtonLink>
      </div>
      <div className={styles.illustration}>
        <img src={egorImg} alt="Иллюстрация" className={styles.image} />
      </div>
    </div>
  );
};

export default GreetingCard;
