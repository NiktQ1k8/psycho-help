import { useCallback, useRef, useState } from 'react';
import { isAxiosError } from 'axios';
import { getErrorMessage } from './errors';
import type { TResponseError } from './types';

export type TUseFetchReturn = {
  isLoading: boolean;
  error: TResponseError;
  fetching: () => Promise<boolean>;
  clearError: () => void;
};

export function useFetch<T>(
  foo: () => Promise<T>,
  formatError: (error: unknown) => string = getErrorMessage,
): TUseFetchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<TResponseError>({
    message: '',
    status: undefined,
  });

  const requestRef = useRef({ foo, formatError });
  requestRef.current = { foo, formatError };

  const clearError = useCallback(() => {
    setError({ message: '', status: undefined });
  }, []);

  const fetching = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError({ message: '', status: undefined });
      await requestRef.current.foo();
      return true;
    } catch (e) {
      setError({
        message: requestRef.current.formatError(e),
        status: isAxiosError(e) ? e.response?.status : undefined,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetching, isLoading, error, clearError };
}
