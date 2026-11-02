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
  const { pathname } = useLocation();
  const skipUserRequest =
    pathname === SLUG.LOGOUT || pathname === SLUG.RESET_PASSWORD;
  const [isSessionLoading, setAppLoading] = useState(!skipUserRequest);
  const hasCheckedSession = useRef(false);
  const isAppLoading = !skipUserRequest && isSessionLoading;

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
        extra={
          <Button
            loading={isAppLoading}
            type="primary"
            onClick={() => void fetching()}
          >
            Повторить
          </Button>
        }
        status="error"
        subTitle={error.message}
        title="Не удалось проверить авторизацию"
      />
    );
  }

  return (
    <AppContext.Provider value={memoizedValues}>{children}</AppContext.Provider>
  );
};
