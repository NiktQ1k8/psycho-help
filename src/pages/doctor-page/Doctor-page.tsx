import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Result } from 'antd';
import { therapistQueries } from '@/entities/therapist/queries';
import InfoBlock from '@/features/therapist/info-block/InfoBlock';
import { SLUG } from '@/shared/config/slug';
import { BackButton } from '@/shared/ui/back-button/BackButton';
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
        <Link className={styles.link} to={SLUG.MAIN}>
          Главная
        </Link>
        <span>/</span>
        <Link className={styles.link} to={SLUG.THERAPISTS}>
          Психологи
        </Link>
        <span>/</span>
        <p className={styles.link}>
          {[doctor.last_name, doctor.first_name, doctor.middle_name].join(' ')}
        </p>
      </div>
      <BackButton className={styles.mobileLink} text="Вернуться к списку" />
      <div className={styles.contentWrapper}>
        <InfoBlock therapist={doctor} />
      </div>
    </div>
  );
};

export default DoctorPage;
