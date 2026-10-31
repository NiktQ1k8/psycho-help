import { StrictMode } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import {
  cleanup as cleanupRender,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
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
import { useAppContext } from '@/app/context';
import { AppContextProvider } from '@/app/context/provider';
import { authApi } from '@/entities/auth/api';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser } from '@/entities/auth/types';
import { useApplication } from '@/features/personal-cabinet/model/application';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { usePsychologistDrafts } from '@/features/personal-cabinet/model/psychologist-drafts';
import { usePsychologistView } from '@/features/personal-cabinet/model/psychologist-view';
import Logout from '@/pages/Logout/Logout';
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

const SessionRoutes = () => {
  const { isAppLoading } = useAppContext();
  if (isAppLoading) return null;
  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
      <Route path="/reset-password" element={<Link to="/">На главную</Link>} />
      <Route path="/" element={<p>Главная</p>} />
    </Routes>
  );
};

const renderSession = (pathname: string) =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[pathname]}>
        <AppContextProvider>
          <SessionRoutes />
        </AppContextProvider>
      </MemoryRouter>
    </StrictMode>,
  );

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
afterEach(() => {
  cleanupRender();
  queryClient.clear();
});
afterAll(() => {
  cleanup();
  $api.defaults.adapter = originalApiAdapter;
  $serviceClient.defaults.adapter = originalServiceAdapter;
  $api.defaults.baseURL = originalApiUrl;
  $serviceClient.defaults.baseURL = originalServiceUrl;
});

describe('Авторизация и сессия', () => {
  it('проверяет сессию после перехода со страницы восстановления на главную', async () => {
    renderSession('/reset-password');
    expect(requests).toEqual([]);
    fireEvent.click(screen.getByRole('link', { name: 'На главную' }));
    await screen.findByText('Главная');
    expect(requests).toEqual(['/api/users/user']);
  });

  it('при запуске под StrictMode проверяет пользователя одним запросом', async () => {
    renderSession('/');
    await screen.findByText('Главная');
    expect(requests).toEqual(['/api/users/user']);
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
  });

  it('на /logout отправляет один запрос выхода без повторной проверки сессии', async () => {
    useAuth.setState({ isAuth: true, user });
    respond = (config) => {
      if (config.url !== '/users/logout') fail(config);
      return response(config, null);
    };
    renderSession('/logout');
    await screen.findByText('Главная');
    expect(requests).toEqual(['/api/users/logout']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
  });

  it('при выходе с истёкшим access обновляет cookies и повторяет logout', async () => {
    useAuth.setState({ isAuth: true, user });
    let refreshed = false;
    respond = (config) => {
      if (config.url === '/users/refresh') refreshed = true;
      else if (!refreshed) fail(config);
      return response(config, { message: 'Успешный выход из системы' });
    };
    await useAuth.getState().logOut();
    expect(requests).toEqual([
      '/api/users/logout',
      '/api/users/refresh',
      '/api/users/logout',
    ]);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
  });

  it('завершает выход, когда обе cookies авторизации уже истекли', async () => {
    useAuth.setState({ isAuth: true, user });
    respond = (config) => fail(config);
    await useAuth.getState().logOut();
    expect(requests).toEqual(['/api/users/logout', '/api/users/refresh']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
  });

  it.each([
    {
      action: 'запрос письма',
      path: '/users/password-reset/request',
      body: { email: user.email },
      request: () => authApi.requestPasswordReset({ email: user.email }),
    },
    {
      action: 'сброс пароля по токену',
      path: '/users/password-reset/confirm',
      body: { token: 'demo-token', new_password: 'NewPassword123!' },
      request: () =>
        authApi.resetPassword({
          token: 'demo-token',
          new_password: 'NewPassword123!',
        }),
    },
  ])(
    'отправляет $action в API с нужными данными',
    async ({ path, body, request }) => {
      const result = { message: 'Запрос выполнен' };
      respond = (config) => {
        expect(config.method).toBe('post');
        expect(JSON.parse(config.data as string)).toEqual(body);
        return response(config, result);
      };
      expect(await request()).toEqual(result);
      expect(requests).toEqual([`/api${path}`]);
    },
  );

  it.each(['login', 'registration'] as const)(
    'успешный %s сохраняет пользователя и очищает старый кэш',
    async (action) => {
      respond = (config) => fail(config);
      renderSession('/');
      await screen.findByText('Главная');
      requests = [];
      queryClient.setQueryData(['application.list'], ['private data']);
      respond = (config) => {
        expect(config.method).toBe('post');
        expect(JSON.parse(config.data as string)).toEqual(
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

  it('отправляет текущий и новый пароль без повторного запроса пользователя', async () => {
    const data = {
      old_password: credentials.password,
      new_password: 'NewPassword123!',
    };
    const result = { message: 'Пароль успешно изменён' };
    useAuth.setState({ isAuth: true, user });
    respond = (config) => {
      expect(config.method).toBe('post');
      expect(JSON.parse(config.data as string)).toEqual(data);
      return response(config, result);
    };
    expect(await authApi.updatePassword(data)).toEqual(result);
    expect(requests).toEqual(['/api/users/me/password']);
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
  });

  it.each([
    [400, 'Неверный старый пароль'],
    [
      422,
      [
        {
          type: 'value_error',
          loc: ['body'],
          msg: 'Value error, Новый пароль должен отличаться от текущего',
        },
      ],
    ],
  ])(
    'ошибка смены пароля %s сохраняет сессию и сообщение сервера',
    async (status, detail) => {
      useAuth.setState({ isAuth: true, user });
      respond = (config) => {
        throw new AxiosError(
          'Request failed',
          'ERR_BAD_REQUEST',
          config,
          undefined,
          {
            ...response(config, { detail }),
            status,
          },
        );
      };
      const error = await authApi
        .updatePassword({
          old_password:
            status === 400 ? 'WrongPassword123!' : credentials.password,
          new_password:
            status === 400 ? 'NewPassword123!' : credentials.password,
        })
        .catch((error: unknown) => error);
      expect(getAuthErrorMessage(error, 'changePassword')).toBe(
        status === 400
          ? 'Неверный старый пароль'
          : 'Новый пароль должен отличаться от текущего',
      );
      expect(requests).toEqual(['/api/users/me/password']);
      expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
    },
  );

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

  it('объединяет параллельные проверки пользователя в один запрос', async () => {
    expect(
      await Promise.all([
        useAuth.getState().getUser(),
        useAuth.getState().getUser(),
      ]),
    ).toEqual([user, user]);
    expect(requests).toEqual(['/api/users/user']);
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });

    await useAuth.getState().getUser();
    expect(requests).toEqual(['/api/users/user', '/api/users/user']);
  });

  it('позволяет повторить проверку пользователя после ошибки сервера', async () => {
    respond = (config) => fail(config, 503);
    await expect(useAuth.getState().getUser()).rejects.toMatchObject({
      response: { status: 503 },
    });
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });

    respond = (config) => response(config);
    expect(await useAuth.getState().getUser()).toEqual(user);
    expect(requests).toEqual(['/api/users/user', '/api/users/user']);
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
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
      $api.get<{ ok: boolean }>('/appointments/'),
      $api.get<{ ok: boolean }>('/applications/'),
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
    usePsychologistDrafts.getState().setOfferDraft('application', {
      meetingUrl: 'https://example.com/private',
    });
    useCabinetDrafts.getState().setProfile({ social_media: '@private' });
    useCabinetDrafts
      .getState()
      .setCancellationReason('application:private', 'Личная причина');
    useApplication.getState().setMeetingType('offline');
    usePsychologistView.getState().setSearchQuery('applications', 'Иванов');
    usePsychologistView.getState().setSearchQuery('appointments', 'Петров');
    respond = (config) => fail(config);
    await expect($api.get('/appointments/')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requests).toEqual(['/api/appointments/', '/api/users/refresh']);
    expect(useAuth.getState()).toMatchObject({ isAuth: false, user: null });
    expect(queryClient.getQueryData(['application.list'])).toBeUndefined();
    expect(useApplication.getState().application.problem_description).toBe('');
    expect(usePsychologistDrafts.getState().conclusionDrafts).toEqual({});
    expect(usePsychologistDrafts.getState().offerDrafts).toEqual({});
    expect(useCabinetDrafts.getState().profile).toEqual({});
    expect(useCabinetDrafts.getState().cancellationReasons).toEqual({});
    expect(useApplication.getState().meetingType).toBeNull();
    expect(usePsychologistView.getState().applicationFilters.searchQuery).toBe(
      '',
    );
    expect(usePsychologistView.getState().appointmentFilters.searchQuery).toBe(
      '',
    );
    expect(
      JSON.parse(sessionStorage.getItem('psychologist-drafts')!),
    ).toHaveProperty('state.conclusionDrafts', {});
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
    usePsychologistView.getState().setSearchQuery('applications', 'Иванов');
    respond = (config) => fail(config, 503);
    await expect(useAuth.getState().logOut()).rejects.toBeInstanceOf(
      AxiosError,
    );
    expect(useAuth.getState()).toMatchObject({ isAuth: true, user });
    expect(usePsychologistView.getState().applicationFilters.searchQuery).toBe(
      'Иванов',
    );
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
    expect(usePsychologistView.getState().applicationFilters.searchQuery).toBe(
      '',
    );
  });
});
