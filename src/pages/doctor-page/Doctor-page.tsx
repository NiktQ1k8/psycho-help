import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { therapistQueries } from '@/entities/therapist/api';
import InfoBlock from '@/features/therapist/info-block/InfoBlock';
import Loader from '@/shared/ui/loader/loader';
import styles from './DoctorPage.module.scss';

const DoctorPage = () => {
  const { id } = useParams();

  const {
    data: doctor,
    isLoading,
    error,
  } = useQuery(therapistQueries.byId(id!));

  useEffect(() => {
    window.scroll(0, 0);
  }, []);

  if (isLoading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div>
        <Result status={'error'} title={error?.message} />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.links}>
        <Link to={'/'} className={styles.link}>
          Главная
        </Link>
        <span>/</span>
        <Link to={'/therapists'} className={styles.link}>
          Психологи
        </Link>
        <span>/</span>
        <p className={styles.link}>
          {[doctor.last_name, doctor.first_name, doctor.middle_name].join(' ')}
        </p>
      </div>
      <Link
        to={'/therapists'}
        className={[styles.link, styles.mobileLink].join(' ')}
      >
        Вернуться к списку
      </Link>
      <div className={styles.contentWrapper}>
        <InfoBlock therapist={doctor} />
      </div>
    </div>
  );
};

export default DoctorPage;
