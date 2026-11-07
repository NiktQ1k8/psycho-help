import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/entities/auth/model/useAuth';
import ModalWindow from '@/features/auth/modal/modal';
import { useAppointmentBooking } from '@/features/personal-cabinet/model/appointment-booking';
import { SLUG } from '@/shared/config/slug';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import OfflineIcon from '../../assets/offline.svg?react';
import OnlineIcon from '../../assets/online.svg?react';
import styles from './BookingForm.module.scss';

export const BookingForm = () => {
  const formatName = useId();
  const landingFormat = useAppointmentBooking((state) => state.landingFormat);
  const setFormat = useAppointmentBooking((state) => state.setLandingFormat);
  const format = landingFormat === 'Online' ? 'online' : 'offline';
  const [isModalOpen, setModalOpen] = useState(false);
  const isAuth = useAuth((state) => state.isAuth);
  const navigate = useNavigate();

  const goToBooking = () => {
    const roles = useAuth.getState().user?.roles;
    const hasOtherRole = roles?.some(({ code }) => code !== 'user');
    navigate(
      hasOtherRole
        ? `${SLUG.CABINET}`
        : `${SLUG.CABINET}?tab=userAppointments&format=${format}`,
    );
  };

  const handleBooking = () => {
    if (isAuth) {
      goToBooking();
    } else {
      setModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    if (useAuth.getState().isAuth) {
      goToBooking();
    }
  };

  return (
    <>
      <div className={styles.root}>
        <fieldset className={styles.options}>
          <legend className={styles.legend}>Формат консультации</legend>
          <label
            className={clsx(
              styles.option,
              format === 'offline' && styles.option__selected,
            )}
          >
            <input
              className={styles.radio}
              checked={format === 'offline'}
              name={formatName}
              type="radio"
              value="offline"
              onChange={() => setFormat('Offline')}
            />
            <OfflineIcon className={styles.icon} aria-hidden />
            <span>лично</span>
          </label>
          <label
            className={clsx(
              styles.option,
              format === 'online' && styles.option__selected,
            )}
          >
            <input
              className={styles.radio}
              checked={format === 'online'}
              name={formatName}
              type="radio"
              value="online"
              onChange={() => setFormat('Online')}
            />
            <OnlineIcon className={styles.icon} aria-hidden />
            <span>онлайн</span>
          </label>
        </fieldset>
        <ButtonLink className={styles.submit} onClick={handleBooking}>
          Записаться
        </ButtonLink>
      </div>
      <ModalWindow isOpen={isModalOpen} onClose={handleModalClose} />
    </>
  );
};
