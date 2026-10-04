import { type FC, useState } from 'react';
import { ButtonLink } from '@/shared/ui/button-link/ButtonLink';
import styles from './CookieBanner.module.scss';
import CookieDocumet from './assets/cookie.pdf';

const LOCAL_STORAGE_KEY = 'cookieBanner';

export const CookieBanner: FC = () => {
  const [isShown, setIsShown] = useState(
    () => !localStorage.getItem(LOCAL_STORAGE_KEY),
  );

  if (!isShown) {
    return null;
  }

  return (
    <div className={styles.root}>
      <p>
        Этот сайт использует файлы{' '}
        <a className={styles.link} href={CookieDocumet} target="_blank">
          cookie
        </a>{' '}
        для лучшей работы
      </p>
      <ButtonLink
        onClick={() => {
          localStorage.setItem(LOCAL_STORAGE_KEY, 'true');
          setIsShown(false);
        }}
      >
        Хорошо
      </ButtonLink>
    </div>
  );
};
