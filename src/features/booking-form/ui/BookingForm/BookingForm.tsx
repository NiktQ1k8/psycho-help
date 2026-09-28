import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/features/auth/api/useAuth';
import ModalWindow from '@/features/auth/modal/modal';
import { Button } from '@/shared/ui/button';
import OfflineIcon from '../../assets/offline.svg?react';
import OnlineIcon from '../../assets/online.svg?react';
import styles from './BookingForm.module.scss';

type TFormat = 'offline' | 'online';

export const BookingForm = () => {
  const formatName = useId();
  const [format, setFormat] = useState<TFormat>('offline');
  const [isModalOpen, setModalOpen] = useState(false);
  const isAuth = useAuth((state) => state.isAuth);
  const navigate = useNavigate();

  const goToBooking = () => {
    const roles = useAuth.getState().user?.roles;
    const hasOtherRole = roles?.some(({ code }) => code !== 'user');
    navigate(
      hasOtherRole
        ? '/cabinet?tab=main'
        : `/cabinet?tab=userAppointments&format=${format}`,
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
              type="radio"
              name={formatName}
              value="offline"
              checked={format === 'offline'}
              onChange={() => setFormat('offline')}
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
              type="radio"
              name={formatName}
              value="online"
              checked={format === 'online'}
              onChange={() => setFormat('online')}
            />
            <OnlineIcon className={styles.icon} aria-hidden />
            <span>онлайн</span>
          </label>
        </fieldset>
        <Button className={styles.submit} type="button" onClick={handleBooking}>
          Записаться
        </Button>
      </div>
      <ModalWindow isOpen={isModalOpen} onClose={handleModalClose} />
    </>
  );
};
