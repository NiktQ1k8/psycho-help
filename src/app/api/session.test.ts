import axios, { AxiosError } from 'axios';
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser } from '@/entities/auth/types';
import { useApplication } from '@/features/personal-cabinet/model/application';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import { $api, $serviceClient } from '@/shared/api/http';
import { queryClient } from '@/shared/api/queryClient';
import { setupSession } from './setupSession';

const user: TUser = {
  id: 'test-user',
  first_name: 'Иван',
  last_name: 'Иванов',
  middle_name: null,
  phone_number: '+79990000000',
  email: 'student@example.com',
  social_media: null,
  study_group: null,
  roles: [{ code: 'user', name: 'Пользователь', description: null }],
};
const credentials = { email: user.email, password: 'LocalDemo123!' };
const registration = {
  ...credentials,
  first_name: user.first_name,
  last_name: user.last_name,
  phone_number: user.phone_number,
};
const response = (
  config: InternalAxiosRequestConfig,
  data: unknown = user,
): AxiosResponse => ({
  config,
  status: 200,
  statusText: 'OK',
  headers: {},
  data,
});
const fail = (config: InternalAxiosRequestConfig, status = 401): never => {
  throw new AxiosError(
    'Request failed',
    'ERR_BAD_RESPONSE',
    config,
    undefined,
    {
      ...response(config),
      status,
    },
  );
};

let requests: string[];
let respond: (
  config: InternalAxiosRequestConfig,
) => AxiosResponse | Promise<AxiosResponse>;
let cleanup: () => void;
const originalApiAdapter = $api.defaults.adapter;
const originalServiceAdapter = $serviceClient.defaults.adapter;
const originalApiUrl = $api.defaults.baseURL;
const originalServiceUrl = $serviceClient.defaults.baseURL;

beforeAll(() => {
  cleanup = setupSession();
});
beforeEach(() => {
  useAuth.getState().resetSession();
  requests = [];
  respond = (config) => response(config);
  const adapter: AxiosAdapter = async (config) => {
    expect(config.withCredentials).toBe(true);
    requests.push(axios.getUri(config));
    return respond(config);
  };
  $api.defaults.adapter = $serviceClient.defaults.adapter = adapter;
  $api.defaults.baseURL = $serviceClient.defaults.baseURL = '/api/';
});
afterEach(() => queryClient.clear());
afterAll(() => {
  cleanup();
  $api.defaults.adapter = originalApiAdapter;
  $serviceClient.defaults.adapter = originalServiceAdapter;
  $api.defaults.baseURL = originalApiUrl;
  $serviceClient.defaults.baseURL = originalServiceUrl;
});

describe('Авторизация и сессия', () => {
  it.each(['login', 'registration'] as const)(
    'успешный %s сохраняет пользователя и очищает старый кэш',
    async (action) => {
      queryClient.setQueryData(['application.list'], ['private data']);
      respond = (config) => {
        expect(config.method).toBe('post');
        expect(JSON.parse(config.data)).toEqual(
          action === 'login' ? credentials : registration,
        );
        return response(config);
      };
      if (action === 'login')
        await useAuth.getState().login(credentials.email, credentials.password);
      else await useAuth.getState().registration(registration);
      expect(requests).toEqual([
        action === 'login' ? '/api/users/login' : '/api/users/register',
      ]);
      expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
      expect(queryClient.getQueryData(['application.list'])).toBeUndefined();
    },
  );

  it('не запускает refresh при неверном пароле', async () => {
    respond = (config) => fail(config);
    await expect(
      useAuth.getState().login(user.email, 'WrongPassword!'),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(requests).toEqual(['/api/users/login']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
  });

  it('восстанавливает пользователя после истечения access cookie', async () => {
    let profileAttempts = 0;
    respond = (config) => {
      if (config.url === '/users/user' && ++profileAttempts === 1) fail(config);
      return response(config);
    };
    await useAuth.getState().getUser();
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
    expect(requests).toEqual([
      '/api/users/user',
      '/api/users/refresh',
      '/api/users/user',
    ]);
  });

  it('использует один refresh для параллельных запросов', async () => {
    let finishRefresh!: () => void;
    const gate = new Promise<void>((resolve) => {
      finishRefresh = resolve;
    });
    let refreshed = false;
    respond = async (config) => {
      if (config.url === '/users/refresh') {
        await gate;
        refreshed = true;
      } else if (!refreshed) fail(config);
      return response(config, { ok: true });
    };
    const pending = Promise.all([
      $api.get('/appointments/'),
      $api.get('/applications/'),
    ]);
    await expect.poll(() => requests.length).toBe(3);
    finishRefresh();
    expect((await pending).map((result) => result.data)).toEqual([
      { ok: true },
      { ok: true },
    ]);
    expect(requests.filter((url) => url === '/api/users/refresh')).toHaveLength(
      1,
    );
  });

  it('при истёкшем refresh очищает пользователя, кэш и личные черновики', async () => {
    useAuth.setState({ isAuth: true, user });
    queryClient.setQueryData(['application.list'], ['private data']);
    useApplication
      .getState()
      .setApplication({ problem_description: 'Личный черновик' });
    usePsychologistDrafts
      .getState()
      .setConclusionDraft('appointment', 'Личное заключение');
    respond = (config) => fail(config);
    await expect($api.get('/appointments/')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requests).toEqual(['/api/appointments/', '/api/users/refresh']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
    expect(queryClient.getQueryData(['application.list'])).toBeUndefined();
    expect(useApplication.getState().application.problem_description).toBe('');
    expect(usePsychologistDrafts.getState().conclusionDrafts).toEqual({});
    expect(
      JSON.parse(sessionStorage.getItem('psychologist-drafts')!).state
        .conclusionDrafts,
    ).toEqual({});
  });

  it.each(['network', 'server'])(
    'сохраняет пользователя при временной ошибке refresh: %s',
    async (failure) => {
      useAuth.setState({ isAuth: true, user });
      queryClient.setQueryData(['application.list'], ['private data']);
      let recovered = false;
      let refreshed = false;
      respond = (config) => {
        if (config.url === '/users/refresh') {
          if (!recovered) {
            if (failure === 'server') fail(config, 503);
            throw new AxiosError('Network Error', 'ERR_NETWORK', config);
          }
          refreshed = true;
        } else if (!refreshed) fail(config);
        return response(config, { ok: true });
      };
      await expect($api.get('/appointments/')).rejects.toBeInstanceOf(
        AxiosError,
      );
      expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
      expect(queryClient.getQueryData(['application.list'])).toEqual([
        'private data',
      ]);
      recovered = true;
      expect((await $api.get('/appointments/')).data).toEqual({ ok: true });
      expect(
        requests.filter((url) => url === '/api/users/refresh'),
      ).toHaveLength(2);
    },
  );

  it('останавливается после повторного 401', async () => {
    useAuth.setState({ isAuth: true, user });
    respond = (config) => {
      if (config.url !== '/users/refresh') fail(config);
      return response(config);
    };
    await expect($api.get('/appointments/')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requests).toEqual([
      '/api/appointments/',
      '/api/users/refresh',
      '/api/appointments/',
    ]);
    expect(useAuth.getState().isAuth).toBe(false);
  });

  it.each([403, 503])(
    'не обновляет сессию и не выходит при ответе %s',
    async (status) => {
      useAuth.setState({ isAuth: true, user });
      respond = (config) => fail(config, status);
      await expect($api.get('/appointments/')).rejects.toMatchObject({
        response: { status },
      });
      expect(requests).toEqual(['/api/appointments/']);
      expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
    },
  );

  it('очищает личные данные после успешного выхода, сохраняя их при сбое запроса', async () => {
    useAuth.setState({ isAuth: true, user });
    queryClient.setQueryData(['application.list'], ['private data']);
    useApplication
      .getState()
      .setApplication({ problem_description: 'Личный черновик' });
    usePsychologistDrafts
      .getState()
      .setReasonDraft('application', 'application', 'Личная причина');
    respond = (config) => fail(config, 503);
    await expect(useAuth.getState().logOut()).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
    respond = (config) => response(config, null);
    await useAuth.getState().logOut();
    expect(requests).toEqual(['/api/users/logout', '/api/users/logout']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
    expect(queryClient.getQueryData(['application.list'])).toBeUndefined();
    expect(useApplication.getState().application.problem_description).toBe('');
    expect(usePsychologistDrafts.getState().reasonDrafts).toEqual({
      application: {},
      appointment: {},
    });
  });
});
