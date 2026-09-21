import type { FC } from 'react';
import { Link } from 'react-router-dom';
import type { Therapist } from '@/entities/therapist/types';
import altPhoto from '@/shared/assets/images/altPhotos/User_Accounts_alt.png';
import Img from '@/shared/ui/img/Img';
import styles from './Doctor.module.scss';

interface Props {
  doctor: Therapist;
  linkToDetails?: boolean; // если true — карточка кликабельная
}

export const DoctorCard: FC<Props> = ({ doctor, linkToDetails = true }) => {
  const content = (
    <div className={styles.wrapper}>
      <Img
        className={styles.photo}
        photo={`${import.meta.env.VITE_REACT_APP_IMAGE_URL}` + doctor.photo}
        altPhoto={altPhoto}
      />

      <div className={styles.info}>
        <p className={styles.fio}>
          {[doctor.last_name, doctor.first_name].join(' ')}
        </p>

        <p className={styles.speciality}>{doctor.qualification}</p>
        <p className={styles.experience}>Опыт {doctor.experience}</p>

        <p className={styles.consult_label}>С чем работает:</p>
        <p className={styles.consult_areas}>{doctor.consult_areas}</p>
      </div>
    </div>
  );

  // Если ссылка на детальную страницу не нужна — просто возвращаем карточку
  if (!linkToDetails) return content;

  return (
    <Link
      to={`/therapists/${doctor.id}`}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {content}
    </Link>
  );
};
