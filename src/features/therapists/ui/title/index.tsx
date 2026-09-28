import { BookingForm } from '@/features/booking-form/ui/BookingForm/BookingForm';
import doctorImg from '@/shared/assets/images/doctors/titleImg.svg';
import styles from './Title.module.scss';

const Title = () => {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Психологи</h1>
          <p className={styles.text}>
            На этой странице с психологами вы найдёте широкий выбор
            специалистов, которые помогут вам справиться с различными жизненными
            ситуациями.
          </p>
          <BookingForm />
        </div>
        <img
          src={doctorImg}
          alt="Изображение диалога с психологом"
          className={styles.titleImg}
        />
      </div>
    </div>
  );
};

export default Title;
