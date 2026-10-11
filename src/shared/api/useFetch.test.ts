import { act, renderHook } from '@testing-library/react';
import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { useFetch } from './useFetch';

describe('useFetch', () => {
  it('должен успешно вызвать foo и обновить состояния загрузки', async () => {
    const mockFoo = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useFetch(mockFoo));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error.message).toBe('');

    await act(async () => {
      await result.current.fetching();
    });

    expect(mockFoo).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error.message).toBe('');
  });

  it.each([
    ['Неверный пароль', 'Неверный пароль'],
    [
      [{ msg: 'Email is required' }, { msg: 'Invalid phone' }],
      'Email is required, Invalid phone',
    ],
  ])(
    'shows API error details and clears them after a successful retry (%j)',
    async (detail, message) => {
      const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
      };
      const error = new AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          headers: {},
          config,
          data: { detail },
        },
      );
      const request = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('ok');
      const { result } = renderHook(() => useFetch(request));
      await act(async () => {
        expect(await result.current.fetching()).toBe(false);
      });
      expect(result.current.error).toEqual({ message, status: 422 });
      await act(async () => {
        expect(await result.current.fetching()).toBe(true);
      });
      expect(result.current.error).toEqual({ message: '', status: undefined });
      expect(result.current.isLoading).toBe(false);
    },
  );

  it('reports loading while the request is still pending', async () => {
    let finish!: () => void;
    const request = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const { result } = renderHook(() => useFetch(() => request));
    let pending!: Promise<boolean>;
    act(() => {
      pending = result.current.fetching();
    });
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      finish();
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('должен обработать ошибку AxiosError и установить error', async () => {
    const headers = new AxiosHeaders();
    const config: InternalAxiosRequestConfig = { headers };
    const response: AxiosResponse = {
      status: 400,
      statusText: 'Bad Request',
      headers,
      config,
      data: null,
    };
    const axiosError = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      config,
      {},
      response,
    );
    const mockFoo = vi.fn().mockRejectedValue(axiosError);
    const { result } = renderHook(() => useFetch(mockFoo));

    await act(async () => {
      await result.current.fetching();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error.message).toBe('Request failed');
    expect(result.current.error.status).toBe(400);
  });
});
