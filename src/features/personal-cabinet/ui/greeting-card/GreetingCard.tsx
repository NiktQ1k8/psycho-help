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
          className={styles.button}
          to={`${SLUG.CABINET}?tab=userAppointments`}
        >
          Записаться
        </ButtonLink>
      </div>
      <div className={styles.illustration}>
        <img className={styles.image} alt="Иллюстрация" src={egorImg} />
      </div>
    </div>
  );
};

export default GreetingCard;
