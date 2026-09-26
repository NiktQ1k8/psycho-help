import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { AppContextProvider } from '@/app/context/provider';
import { appTheme } from '@/app/theme';
import { useTheme } from '@/shared/hooks/useTheme';
import '@/shared/lib/dayjs';
import { BackToTop } from '@/shared/ui';
import { CookieBanner } from '@/shared/ui/cookie-banner/ui/cookie-banner/CookieBanner';
import { Footer } from '@/widgets/footer/ui/Footer/Footer';
import Header from '@/widgets/header/header';
import styles from './App.module.scss';
import AppRouter from './router/AppRouter';

function App() {
  const { currentTheme } = useTheme();
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
      },
    },
  });
  const themeConfig = {
    ...appTheme,
    algorithm:
      currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };
  return (
    <QueryClientProvider client={client}>
      <ConfigProvider locale={ru_RU} theme={themeConfig}>
        <AppContextProvider>
          <div className={styles.layout}>
            <Header />
            <main className={styles.content}>
              <AppRouter />
            </main>
            <Footer />
            <BackToTop />
            <CookieBanner />
          </div>
        </AppContextProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
