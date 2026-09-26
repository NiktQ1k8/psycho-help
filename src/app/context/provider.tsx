import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/api/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import { AppContext } from './';

interface IProps {
  children: ReactNode;
}

export const AppContextProvider = ({ children }: IProps) => {
  const [isAppLoading, setAppLoading] = useState(true);

  const getUser = useAuth((state) => state.getUser);

  const { fetching } = useFetch(async () => {
    try {
      setAppLoading(true);
      await getUser();
    } finally {
      setAppLoading(false);
    }
  });

  useEffect(() => {
    fetching();
  }, [fetching]);

  const memoizedValues = useMemo(() => ({ isAppLoading }), [isAppLoading]);

  return (
    <AppContext.Provider value={memoizedValues}>{children}</AppContext.Provider>
  );
};
