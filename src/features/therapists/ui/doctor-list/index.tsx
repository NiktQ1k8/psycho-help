import type { FC } from 'react';
import type { Therapist } from '@/entities/therapist/types';
import { DoctorCard } from '../doctor';
import styles from './DoctorList.module.scss';

interface Props {
  doctors: Therapist[];
}

const DoctorList: FC<Props> = ({ doctors }) => {
  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Выбрать специалиста</h2>
      <div className={styles.list_wrapper}>
        {doctors.map((doctor) => (
          <DoctorCard doctor={doctor} key={doctor.id} />
        ))}
      </div>
    </div>
  );
};

export default DoctorList;
