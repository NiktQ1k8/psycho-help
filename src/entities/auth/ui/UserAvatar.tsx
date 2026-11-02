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
          alt="Аватар пользователя"
          aria-label="Открыть фотографию"
          height="100%"
          preview={{ cover: 'Посмотреть' }}
          role="button"
          src={src}
          tabIndex={0}
          width="100%"
          onError={() => setFailedSrc(src)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
        />
      ) : (
        <UserOutlined className={styles.icon} />
      )}
    </div>
  );
};
