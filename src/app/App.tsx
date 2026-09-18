import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import ru_RU from 'antd/locale/ru_RU';
import { AppContextProvider } from '@/app/context/provider';
import { appTheme } from '@/app/theme';
import { useTheme } from '@/shared/hooks/useTheme';
import '@/shared/lib/dayjs';
import { BackToTop } from '@/shared/ui';
import { Footer } from '@/widgets/Footer/ui/Footer/Footer';
import Header from '@/widgets/header/header';
import styles from './App.module.scss';
import AppRouter from './router/AppRouter';

const client = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

function App() {
  const { currentTheme } = useTheme();

  const themeConfig = {
    ...appTheme,
    algorithm:
      currentTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <QueryClientProvider client={client}>
      <ConfigProvider locale={ru_RU} theme={themeConfig}>
        <AppContextProvider>
          <Header />
          <main className={styles.content}>
            <AppRouter />
          </main>
          <Footer />
          <BackToTop />
        </AppContextProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
