// @vitest-environment node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { type Server, createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { type ViteDevServer, createServer } from 'vite';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import viteConfig from '../../vite.config';

// Exercise real HTTP forwarding with both layouts, without calling the stand.
describe.each(['/api/', '/'])('dev proxy with backend at %s', (backendPath) => {
  let backend: Server;
  let vite: ViteDevServer;
  let frontendOrigin: string;
  let backendOrigin: string;
  let cacheDir: string;
  const prefix = backendPath.replace(/\/$/, '');

  beforeAll(async () => {
    backend = createHttpServer((request, response) => {
      const url = new URL(request.url!, backendOrigin);
      const path = url.pathname.slice(prefix.length);

      if (path === '/news') {
        response.writeHead(307, {
          Location: `${backendOrigin}${prefix}/news/?page=2#latest`,
        });
        response.end();
      } else if (path === '/relative-redirect') {
        response.writeHead(307, { Location: `${prefix}/news/` });
        response.end();
      } else if (path === '/nested/relative-redirect') {
        response.writeHead(307, { Location: 'next/?page=3' });
        response.end();
      } else if (path === '/external-redirect') {
        response.writeHead(302, { Location: 'https://example.com/login' });
        response.end();
      } else if (path === '/image/photo.png') {
        response.writeHead(200, { 'Content-Type': 'image/png' });
        response.end(Buffer.from([137, 80, 78, 71]));
      } else if (path === '/appointments/') {
        response.writeHead(503, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ detail: 'Backend unavailable' }));
      } else {
        let body = '';
        request.on('data', (chunk) => {
          body += chunk;
        });
        request.on('end', () => {
          response.setHeader('Content-Type', 'application/json');
          if (path === '/users/login') {
            response.setHeader('Set-Cookie', [
              `access_token=test; Domain=127.0.0.1; Path=${prefix}/users; HttpOnly; SameSite=Lax`,
              `refresh_token=test-refresh; Path=${prefix}/users; HttpOnly; SameSite=Lax`,
            ]);
          }
          response.end(
            JSON.stringify({
              path: url.pathname + url.search,
              method: request.method,
              cookie: request.headers.cookie,
              body,
            }),
          );
        });
      }
    });
    await new Promise<void>((resolve) =>
      backend.listen(0, '127.0.0.1', resolve),
    );
    const backendAddress = backend.address();
    if (!backendAddress || typeof backendAddress === 'string')
      throw new Error('No backend port');
    backendOrigin = `http://127.0.0.1:${backendAddress.port}`;

    vi.stubEnv('DEVEL_BACKEND_URL', backendOrigin + backendPath);
    const config = viteConfig({ command: 'serve', mode: 'development' });
    vi.unstubAllEnvs();
    cacheDir = await mkdtemp(join(tmpdir(), 'psycho-dev-proxy-'));
    vite = await createServer({
      ...config,
      configFile: false,
      plugins: [],
      cacheDir,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        ...config.server,
        host: '127.0.0.1',
        port: 0,
        strictPort: false,
        watch: null,
        ws: false,
      },
    });
    await vite.listen();
    const frontendAddress = vite.httpServer?.address();
    if (!frontendAddress || typeof frontendAddress === 'string')
      throw new Error('No frontend port');
    frontendOrigin = `http://127.0.0.1:${frontendAddress.port}`;
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await vite?.close();
    if (backend)
      await new Promise<void>((resolve) => backend.close(() => resolve()));
    if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
  });

  it('forwards API paths and query parameters with the backend prefix', async () => {
    const response = await fetch(`${frontendOrigin}/api/therapists/?page=1`);
    expect(await response.json()).toMatchObject({
      path: `${prefix}/therapists/?page=1`,
      method: 'GET',
    });
  });

  it('serves images through the same proxy', async () => {
    const response = await fetch(`${frontendOrigin}/api/image/photo.png`);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([137, 80, 78, 71]),
    );
  });

  it('keeps absolute and relative backend redirects on the frontend', async () => {
    const response = await fetch(`${frontendOrigin}/api/news`, {
      redirect: 'manual',
    });
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('/api/news/?page=2#latest');
    const relative = await fetch(`${frontendOrigin}/api/relative-redirect`, {
      redirect: 'manual',
    });
    expect(relative.headers.get('location')).toBe('/api/news/');
    const nested = await fetch(
      `${frontendOrigin}/api/nested/relative-redirect`,
      {
        redirect: 'manual',
      },
    );
    expect(nested.headers.get('location')).toBe('/api/nested/next/?page=3');
    const followed = await fetch(`${frontendOrigin}/api/news`);
    expect(await followed.json()).toMatchObject({
      path: `${prefix}/news/?page=2`,
    });
  });

  it('preserves redirects to external services', async () => {
    const response = await fetch(`${frontendOrigin}/api/external-redirect`, {
      redirect: 'manual',
    });
    expect(response.headers.get('location')).toBe('https://example.com/login');
  });

  it('forwards login bodies, scopes cookies locally, and forwards refresh cookies', async () => {
    const body = JSON.stringify({
      email: 'test@example.com',
      password: 'test',
    });
    const response = await fetch(`${frontendOrigin}/api/users/login`, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(await response.json()).toMatchObject({
      path: `${prefix}/users/login`,
      method: 'POST',
      body,
    });
    const cookies = response.headers.getSetCookie();
    expect(cookies).toHaveLength(2);
    cookies.forEach((cookie) => {
      expect(cookie).not.toMatch(/Domain=/i);
      expect(cookie).toContain('Path=/;');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
    });
    const refresh = await fetch(`${frontendOrigin}/api/users/refresh`, {
      method: 'POST',
      headers: { Cookie: 'refresh_token=test-refresh' },
    });
    expect(await refresh.json()).toMatchObject({
      path: `${prefix}/users/refresh`,
      method: 'POST',
      cookie: 'refresh_token=test-refresh',
    });
  });

  it('returns backend errors without replacing them with mock data', async () => {
    const response = await fetch(`${frontendOrigin}/api/appointments/`);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ detail: 'Backend unavailable' });
  });
});

describe('development backend environment', () => {
  let envDirectory: string;

  beforeEach(async () => {
    envDirectory = await mkdtemp(join(tmpdir(), 'psycho-dev-env-'));
    await writeFile(
      join(envDirectory, '.env.development'),
      'DEVEL_BACKEND_URL=http://shared.example.com/api/\n',
    );
    vi.stubEnv('DEVEL_BACKEND_URL', undefined);
    vi.spyOn(process, 'cwd').mockReturnValue(envDirectory);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    await rm(envDirectory, { recursive: true, force: true });
  });

  const target = () => {
    const config = viteConfig({ command: 'serve', mode: 'development' });
    const proxy = config.server?.proxy?.['^/api(?:/|$)'];
    if (!proxy || typeof proxy === 'string')
      throw new Error('Missing backend proxy');
    return proxy.target;
  };

  it('connects using .env.development when no local override exists', () => {
    expect(target()).toBe('http://shared.example.com/api/');
  });

  it('keeps shell environment variables above file overrides', () => {
    vi.stubEnv('DEVEL_BACKEND_URL', 'http://shell.example.com/');
    expect(target()).toBe('http://shell.example.com/');
  });

  it('fails clearly when the backend address is missing', async () => {
    await rm(join(envDirectory, '.env.development'));
    expect(target).toThrow('Set DEVEL_BACKEND_URL');
  });

  it('rejects backend addresses without an HTTP(S) scheme', () => {
    vi.stubEnv('DEVEL_BACKEND_URL', 'localhost:8000');
    expect(target).toThrow('must be an HTTP(S) URL');
  });

  it('uses the personal address from .env.development.local', async () => {
    await writeFile(
      join(envDirectory, '.env.development.local'),
      'DEVEL_BACKEND_URL=http://localhost:8000/\n',
    );
    expect(target()).toBe('http://localhost:8000/');
  });
});
