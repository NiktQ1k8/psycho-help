import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Result } from 'antd';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import { SLUG } from '@/shared/config/slug';
import { AppContext } from './';

type TProps = {
  children: ReactNode;
};

export const AppContextProvider = ({ children }: TProps) => {
  const [isAppLoading, setAppLoading] = useState(true);
  const hasCheckedSession = useRef(false);
  const { pathname } = useLocation();
  const skipUserRequest =
    pathname === SLUG.LOGOUT || pathname === SLUG.RESET_PASSWORD;

  const getUser = useAuth((state) => state.getUser);

  const { fetching, error } = useFetch(async () => {
    try {
      setAppLoading(true);
      await getUser();
    } finally {
      setAppLoading(false);
    }
  });

  useEffect(() => {
    if (skipUserRequest) {
      if (pathname === SLUG.LOGOUT) hasCheckedSession.current = true;
      setAppLoading(false);
      return;
    }
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      void fetching();
    }
  }, [fetching, pathname, skipUserRequest]);

  const memoizedValues = useMemo(() => ({ isAppLoading }), [isAppLoading]);

  if (!skipUserRequest && error.message && error.status !== 401) {
    return (
      <Result
        status="error"
        title="Не удалось проверить авторизацию"
        subTitle={error.message}
        extra={
          <Button
            type="primary"
            loading={isAppLoading}
            onClick={() => void fetching()}
          >
            Повторить
          </Button>
        }
      />
    );
  }

  return (
    <AppContext.Provider value={memoizedValues}>{children}</AppContext.Provider>
  );
};
