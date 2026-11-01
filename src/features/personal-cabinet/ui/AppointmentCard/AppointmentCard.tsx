import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import clsx from 'clsx';
import type { TAppointmentStatus } from '@/entities/appointment/types';
import styles from './AppointmentCard.module.scss';

interface IAppointmentCardProps {
  date: string;
  doctorName: string;
  address: string;
  type: 'upcoming' | 'past' | 'confirmation';
  status?: TAppointmentStatus;
  hasComment?: boolean;
  onConfirm?: () => void;
  onComment?: () => void;
  onCancel?: () => void;
  onEmergencyContact?: () => void;
  description?: string;
  disabled?: boolean;
}

const getStatusConfig = (status?: TAppointmentStatus) => {
  switch (status) {
    case 'cancelled':
      return { text: 'Отменено', dotClass: styles.dotDanger };
    case 'done':
      return { text: 'Завершено', dotClass: styles.dotNeutral };
    default:
      return { text: 'Ожидает', dotClass: styles.dotWarning };
  }
};

export const AppointmentCard = ({
  date,
  doctorName,
  address,
  type,
  status,
  hasComment,
  onConfirm,
  onComment,
  onCancel,
  onEmergencyContact,
  description,
  disabled = false,
}: IAppointmentCardProps) => {
  const statusConfig = getStatusConfig(status);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.date}>{date}</div>
        {type === 'confirmation' && (
          <ClockCircleOutlined className={styles.iconWarning} />
        )}
      </div>

      <div className={styles.infoList}>
        <div className={styles.infoItem}>
          <UserOutlined className={styles.icon} />
          <span>{doctorName}</span>
        </div>
        <div className={styles.infoItem}>
          <EnvironmentOutlined className={styles.icon} />
          <span className={styles.address} title={address}>
            {address}
          </span>
        </div>
      </div>

      {description && <p className={styles.description}>{description}</p>}

      <div className={styles.footer}>
        {(type === 'upcoming' || type === 'past') && (
          <div className={styles.status}>
            <span className={clsx(styles.statusDot, statusConfig.dotClass)} />
            {statusConfig.text}
          </div>
        )}

        <div className={styles.actions}>
          {type === 'confirmation' && (
            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
              disabled={disabled}
            >
              Подтвердить
            </button>
          )}

          {onEmergencyContact && (
            <button
              type="button"
              className={styles.contactButton}
              onClick={onEmergencyContact}
              disabled={disabled}
            >
              Экстренный контакт
            </button>
          )}

          {(type === 'upcoming' || type === 'confirmation') && onCancel && (
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
              disabled={disabled}
            >
              Отменить
            </button>
          )}

          {type === 'past' && hasComment && (
            <button
              type="button"
              className={styles.commentLink}
              onClick={onComment}
            >
              Посмотреть комментарий
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
