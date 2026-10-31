import { useState } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'antd';
import { clsx } from 'clsx';
import { authQueries } from '@/entities/auth/api';
import styles from './UserAvatar.module.scss';

type TUserAvatarProps = {
  userId?: string;
  size?: 'large_' | 'medium' | 'small';
};

export const UserAvatar = ({
  userId = '',
  size = 'large_',
}: TUserAvatarProps) => {
  const { data, dataUpdatedAt } = useQuery(authQueries.avatar(userId));
  const [failedSrc, setFailedSrc] = useState('');
  // Бэк перезаписывает фото по тому же URL — после загрузки обновляем кеш браузера.
  const src = data?.avatar_url ? `${data.avatar_url}?v=${dataUpdatedAt}` : '';

  return (
    <div className={clsx(styles.avatar, styles[size])}>
      {src && src !== failedSrc ? (
        <Image
          width="100%"
          height="100%"
          src={src}
          alt="Аватар пользователя"
          role="button"
          tabIndex={0}
          aria-label="Открыть фотографию"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          preview={{ mask: 'Посмотреть', destroyOnHidden: true }}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <UserOutlined className={styles.icon} />
      )}
    </div>
  );
};
