import { useCallback, useRef, useState } from 'react';
import { AxiosError } from 'axios';
import type { ResponseError } from '@/shared/api';

export type UseFetchReturn = {
  isLoading: boolean;
  error: ResponseError;
  fetching: () => Promise<boolean>;
};

// Вместо "any" используем дженерик T
// Теперь можно строго типизировать возвращаемое значение функции
export function useFetch<T>(foo: () => Promise<T>): UseFetchReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ResponseError>({
    message: '',
    status: undefined,
  });

  const fooRef = useRef(foo);
  fooRef.current = foo;

  const fetching = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      await fooRef.current();
      setError({ message: '', status: undefined });
      return true;
    } catch (e) {
      if (e instanceof AxiosError) {
        const detail = e.response?.data?.detail;
        const message =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg: string }) => d.msg).join(', ')
              : e.message;
        setError({ message, status: e.response?.status });
      } else if (e instanceof Error) {
        setError({ message: e.message, status: undefined });
      } else {
        setError({ message: 'unknown error', status: undefined });
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { fetching, isLoading, error };
}
