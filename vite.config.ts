import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.DEVEL_BACKEND_URL
    ? new URL(env.DEVEL_BACKEND_URL)
    : undefined;

  if (backendUrl && !['http:', 'https:'].includes(backendUrl.protocol)) {
    throw new Error('DEVEL_BACKEND_URL must be an HTTP(S) URL');
  }
  if (mode === 'development' && !backendUrl) {
    throw new Error('Set DEVEL_BACKEND_URL in .env.development');
  }

  // The stand serves API under /api/; the local backend serves it at /.
  const backendPath = backendUrl?.pathname.replace(/\/$/, '') ?? '';

  return {
    plugins: [react(), svgr()],
    css: {
      preprocessorOptions: {
        scss: {
          // Make CSS-free mixins available to each SCSS entry point.
          additionalData: "@use '@/shared/scss/mixins' as *;\n",
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      outDir: 'build',
      // Preserve the browser support used by Vite 7.
      target: ['chrome107', 'edge107', 'firefox104', 'safari16'],
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor',
                test: /node_modules/,
                priority: 10,
              },
              {
                name: (id) => {
                  const pageName = id.split('src/pages/')[1]?.split('/')[0];
                  return pageName ? `page-${pageName}` : null;
                },
              },
            ],
          },
        },
      },
    },
    server: {
      port: 3000, // Бек принимает кросс запросы только на порту 3000. Кто не согласен, ругайтесь с ними :)
      strictPort: true,
      proxy: backendUrl
        ? {
            '^/api(?:/|$)': {
              target: backendUrl.href,
              changeOrigin: true,
              secure: true,
              cookieDomainRewrite: '',
              cookiePathRewrite: '/',
              proxyTimeout: 30_000,
              rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
              configure: (proxy) => {
                proxy.on('proxyRes', (response, request) => {
                  const location = response.headers.location;
                  if (!location) return;

                  const upstreamUrl = new URL(
                    `${backendPath}${request.url ?? '/'}`,
                    backendUrl.origin,
                  );
                  let redirect: URL;
                  try {
                    redirect = new URL(location, upstreamUrl);
                  } catch {
                    // Pass malformed backend headers through without crashing Vite.
                    return;
                  }
                  if (redirect.origin !== backendUrl.origin) return;
                  if (
                    backendPath &&
                    redirect.pathname !== backendPath &&
                    !redirect.pathname.startsWith(`${backendPath}/`)
                  ) {
                    return;
                  }

                  // Keep FastAPI slash redirects on the frontend origin.
                  response.headers.location = `/api${redirect.pathname.slice(backendPath.length)}${redirect.search}${redirect.hash}`;
                });
              },
            },
          }
        : undefined,
    },
  };
});
