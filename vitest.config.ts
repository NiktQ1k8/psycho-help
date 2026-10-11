import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/tests/setup.ts',
        css: true,
        exclude: [...configDefaults.exclude, '.local-data/**'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'html'],
          include: ['src/**/*.{ts,tsx}'],
          exclude: ['src/tests/**', 'src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
    }),
  ),
);
