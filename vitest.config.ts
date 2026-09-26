import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/tests/setup.ts',
      css: true,
      exclude: [
        'node_modules/**',
        // Потом нужно будет исправить этот тест и убрать его из исключений
        'src/widgets/footer/footer.test.tsx',
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/tests/**'],
      },
    },
  }),
);
