// @vitest-environment node
import type {
  AxiosAdapter,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('HTTP client authentication', () => {
  let axios: typeof import('axios').default;
  let AxiosError: typeof import('axios').AxiosError;
  let api: typeof import('./http').$api;
  let originalAdapter: (typeof axios.defaults)['adapter'];
  let requests: string[];
  let respond: (
    config: InternalAxiosRequestConfig,
  ) => Promise<AxiosResponse> | AxiosResponse;

  const response = (
    config: InternalAxiosRequestConfig,
    status = 200,
    data: unknown = {},
  ) => ({
    config,
    status,
    statusText: String(status),
    headers: {},
    data,
  });
  const unauthorized = (config: InternalAxiosRequestConfig): never => {
    throw new AxiosError(
      'Unauthorized',
      'ERR_BAD_REQUEST',
      config,
      undefined,
      response(config, 401),
    );
  };

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_REACT_APP_API_URL', '/api/');
    vi.stubGlobal('window', { location: { href: '/protected' } });
    ({ default: axios, AxiosError } = await import('axios'));
    originalAdapter = axios.defaults.adapter;
    requests = [];
    respond = (config) => response(config);
    const adapter: AxiosAdapter = async (config) => {
      requests.push(axios.getUri(config));
      expect(config.withCredentials).toBe(true);
      return respond(config);
    };
    // The refresh request uses the global client; auth and protected API use instances.
    axios.defaults.adapter = adapter;
    ({ $api: api } = await import('./http'));
  });

  afterEach(() => {
    axios.defaults.adapter = originalAdapter;
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends login credentials and profile requests to the configured API with cookies enabled', async () => {
    const { default: AuthApi } =
      await import('../../features/auth/api/auth-api');
    respond = (config) => {
      if (config.url === '/users/login') {
        expect(config.method).toBe('post');
        expect(JSON.parse(config.data)).toEqual({
          email: 'test@example.com',
          password: 'test',
        });
      }
      return response(config, 200, { id: 'test-user' });
    };
    await AuthApi.login('test@example.com', 'test');
    expect((await AuthApi.getUser()).data).toEqual({ id: 'test-user' });
    expect(requests).toEqual(['/api/users/login', '/api/users/user']);
  });

  it('rejects invalid login credentials without starting refresh or redirecting', async () => {
    const { default: AuthApi } =
      await import('../../features/auth/api/auth-api');
    respond = unauthorized;
    await expect(
      AuthApi.login('test@example.com', 'wrong'),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requests).toEqual(['/api/users/login']);
    expect(window.location.href).toBe('/protected');
  });

  it('refreshes the session after 401 and retries the original request', async () => {
    let attempts = 0;
    respond = (config) => {
      if (config.url === '/appointments/' && ++attempts === 1)
        unauthorized(config);
      return response(config, 200, { ok: true });
    };
    expect((await api.get('/appointments/')).data).toEqual({ ok: true });
    expect(requests).toEqual([
      '/api/appointments/',
      '/api/users/refresh',
      '/api/appointments/',
    ]);
  });

  it.each([
    { outcome: 'success', statuses: ['fulfilled', 'fulfilled'] },
    { outcome: 'refresh fails', statuses: ['rejected', 'rejected'] },
    {
      outcome: 'API still returns 401',
      statuses: ['rejected', 'rejected'],
    },
  ])(
    'uses one refresh for two concurrent requests: $outcome',
    async ({ outcome, statuses }) => {
      let finishRefresh!: () => void;
      // Keep refresh pending while both requests receive their initial 401.
      const refreshGate = new Promise<void>((resolve) => {
        finishRefresh = resolve;
      });
      let sessionRefreshed = false;
      respond = async (config) => {
        if (config.url === '/api/users/refresh') {
          await refreshGate;
          if (outcome === 'refresh fails') unauthorized(config);
          sessionRefreshed = true;
        } else if (!sessionRefreshed || outcome === 'API still returns 401') {
          unauthorized(config);
        }
        return response(config, 200, { ok: true });
      };
      const pending = Promise.allSettled([
        api.get('/appointments/'),
        api.get('/users/user'),
      ]);
      await vi.waitFor(() => {
        expect(requests).toEqual(
          expect.arrayContaining([
            '/api/appointments/',
            '/api/users/user',
            '/api/users/refresh',
          ]),
        );
      });
      finishRefresh();
      const results = await pending;
      expect(results.map((result) => result.status)).toEqual(statuses);
      expect(
        requests.filter((path) => path === '/api/users/refresh'),
      ).toHaveLength(1);
      const expectedAttempts = outcome === 'refresh fails' ? 1 : 2;
      for (const path of ['/api/appointments/', '/api/users/user']) {
        expect(requests.filter((request) => request === path)).toHaveLength(
          expectedAttempts,
        );
      }
      for (const result of results) {
        if (result.status === 'fulfilled')
          expect(result.value.data).toEqual({ ok: true });
        else expect(result.reason).toMatchObject({ response: { status: 401 } });
      }
      const { SLUG } = await import('../config/slug');
      expect(window.location.href).toBe(
        outcome === 'refresh fails' ? SLUG.MAIN : '/protected',
      );
    },
  );

  it('stops retrying if the API still returns 401 after a successful refresh', async () => {
    respond = (config) => {
      if (config.url !== '/api/users/refresh') unauthorized(config);
      return response(config);
    };
    await expect(api.get('/appointments/')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(requests).toEqual([
      '/api/appointments/',
      '/api/users/refresh',
      '/api/appointments/',
    ]);
  });

  it.each([403, 503])(
    'passes through %s errors without refreshing the session',
    async (status) => {
      respond = (config) => {
        throw new AxiosError(
          'Request failed',
          status === 503 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
          config,
          undefined,
          response(config, status),
        );
      };
      await expect(api.get('/appointments/')).rejects.toMatchObject({
        response: { status },
      });
      expect(requests).toEqual(['/api/appointments/']);
      expect(window.location.href).toBe('/protected');
    },
  );
});
