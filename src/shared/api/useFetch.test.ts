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
