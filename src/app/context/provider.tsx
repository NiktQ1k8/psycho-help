import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { useAuth } from '@/features/auth/api/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import { AppContext } from './';

interface IProps {
  children: ReactElement;
}

export const AppContextProvider = ({ children }: IProps) => {
  const [isAppLoading, setAppLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const { getUser } = useAuth();

  const { fetching, error } = useFetch(async () => {
    try {
      setAppLoading(true);
      await getUser();
      setIsError(true);
    } finally {
      setAppLoading(false);
    }
  });

  useEffect(() => {
    fetching();
  }, [fetching]);

  const memoizedValues = useMemo(
    () => ({
      isError,
      isAppLoading,
      error: error?.message,
      setAppLoading,
    }),
    [error, isAppLoading, isError],
  );

  return (
    <AppContext.Provider value={memoizedValues}>{children}</AppContext.Provider>
  );
};
