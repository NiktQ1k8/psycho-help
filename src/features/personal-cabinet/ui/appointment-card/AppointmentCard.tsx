import type { FC } from 'react';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';
import clsx from 'clsx';
import type { AppointmentStatus } from '@/entities/appointment/types';
import styles from './AppointmentCard.module.scss';

interface AppointmentCardProps {
  date: string;
  doctorName: string;
  address: string;
  type: 'upcoming' | 'past' | 'confirmation';
  status?: AppointmentStatus | string;
  hasComment?: boolean;
  onConfirm?: () => void;
  onComment?: () => void;
  onCancel?: () => void;
}

const getStatusConfig = (status?: string) => {
  switch (status?.toLocaleLowerCase()) {
    /*     case 'approved':
    case 'accepted':
      return { text: 'Подтверждено', dotClass: styles.dotSuccess }; */
    case 'cancelled':
      return { text: 'Отменено', dotClass: styles.dotDanger };
    case 'done':
      return { text: 'Завершено', dotClass: styles.dotNeutral };
    default:
      return { text: 'Ожидает', dotClass: styles.dotWarning };
  }
};

const AppointmentCard: FC<AppointmentCardProps> = ({
  date,
  doctorName,
  address,
  type,
  status,
  hasComment,
  onConfirm,
  onComment,
  onCancel,
}) => {
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
          <span>{address}</span>
        </div>
      </div>

      <div className={styles.footer}>
        {(type === 'upcoming' || type === 'past') && (
          <div className={styles.status}>
            <span
              className={clsx(styles.statusDot, statusConfig.dotClass)}
            ></span>
            {statusConfig.text}
          </div>
        )}

        <div className={styles.actions}>
          {type === 'confirmation' && (
            <button className={styles.confirmButton} onClick={onConfirm}>
              Подтвердить
            </button>
          )}

          {(type === 'upcoming' || type === 'confirmation') && onCancel && (
            <button className={styles.cancelButton} onClick={onCancel}>
              Отменить
            </button>
          )}

          {/* Пока что убрал кнопку с оценкой */}
          {type === 'past' && hasComment && (
            <button className={styles.commentLink} onClick={onComment}>
              Посмотреть комментарий
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
