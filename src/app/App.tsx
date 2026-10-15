import { QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { AppContextProvider } from '@/app/context/provider';
import { appTheme } from '@/app/theme';
import { queryClient } from '@/shared/api/queryClient';
import { useTheme } from '@/shared/hooks/useTheme';
import '@/shared/lib/dayjs';
import { BackToTop } from '@/shared/ui';
import { CookieBanner } from '@/shared/ui/cookie-banner/CookieBanner';
import { Footer } from '@/widgets/Footer/ui/Footer/Footer';
import Header from '@/widgets/header/header';
import styles from './App.module.scss';
import { setupSession } from './api/setupSession';
import AppRouter from './router/AppRouter';

const cleanupSession = setupSession();
if (import.meta.hot) import.meta.hot.dispose(cleanupSession);

function App() {
  const { currentTheme } = useTheme();

  const themeConfig = {
    ...appTheme,
    algorithm:
      currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ru_RU} theme={themeConfig}>
        <AppContextProvider>
          <Header />
          <main className={styles.content}>
            <AppRouter />
          </main>
          <Footer />
          <BackToTop />
          <CookieBanner />
        </AppContextProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
