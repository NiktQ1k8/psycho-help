import { BookingForm } from '@/features/booking-form/ui/BookingForm/BookingForm';
import styles from './MainHero.module.scss';
import ImageHero from './assets/main-hero.svg';

export const MainHero = () => {
  return (
    <section className={styles.root}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Помощь психолога для студентов и сотрудников
        </h1>
        <p className={styles.text}>
          Иногда справляться с трудностями в одиночку тяжело. Наши психологи
          помогут найти выход. Консультации бесплатны, конфиденциальны и
          доступны очно или онлайн
        </p>
        <BookingForm />
      </div>
      <img className={styles.image} alt="" src={ImageHero} />
    </section>
  );
};
