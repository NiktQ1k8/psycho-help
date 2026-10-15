import { act, renderHook } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it, vi } from 'vitest';
import { useFetch } from './useFetch';

it('показывает загрузку до завершения запроса', async () => {
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
    expect(await pending).toBe(true);
  });
  expect(result.current.isLoading).toBe(false);
  expect(result.current.error.message).toBe('');
});

it('показывает ошибку и очищает её после успешного повтора', async () => {
  const error = new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status: 422,
      statusText: 'Unprocessable Entity',
      headers: {},
      config: { headers: new AxiosHeaders() },
      data: { detail: 'Некорректный номер телефона' },
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
  expect(result.current.error).toEqual({
    message: 'Некорректный номер телефона',
    status: 422,
  });
  expect(result.current.isLoading).toBe(false);
  await act(async () => {
    expect(await result.current.fetching()).toBe(true);
  });
  expect(result.current.error).toEqual({ message: '', status: undefined });
  expect(result.current.isLoading).toBe(false);
});
