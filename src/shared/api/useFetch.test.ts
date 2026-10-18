import { useEffect } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it, vi } from 'vitest';
import { useFetch } from './useFetch';

it('использует актуальный запрос и формат ошибки без смены fetching', async () => {
  const firstRequest = vi.fn<() => Promise<string>>().mockResolvedValue('ok');
  const nextRequest = vi
    .fn<() => Promise<string>>()
    .mockRejectedValue(new Error('failure'));
  const { result, rerender } = renderHook(
    ({ request, message }) => useFetch(request, () => message),
    { initialProps: { request: firstRequest, message: 'Первая ошибка' } },
  );
  const fetching = result.current.fetching;
  rerender({ request: nextRequest, message: 'Актуальная ошибка' });
  expect(result.current.fetching).toBe(fetching);
  await act(async () => {
    expect(await fetching()).toBe(false);
  });
  expect(firstRequest).not.toHaveBeenCalled();
  expect(nextRequest).toHaveBeenCalledOnce();
  expect(result.current.error.message).toBe('Актуальная ошибка');
});

it('обновляет запрос до вызова из эффекта потребителя', async () => {
  const request = vi
    .fn<(value: string) => Promise<string>>()
    .mockResolvedValue('ok');
  const { result, rerender } = renderHook(
    ({ value }) => {
      const state = useFetch(() => request(value));
      const { fetching } = state;
      useEffect(() => {
        void fetching();
      }, [fetching, value]);
      return state;
    },
    { initialProps: { value: 'initial' } },
  );
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  rerender({ value: 'updated' });
  await waitFor(() => expect(result.current.isLoading).toBe(false));
  expect(request.mock.calls).toEqual([['initial'], ['updated']]);
  expect(result.current.isLoading).toBe(false);
});

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
