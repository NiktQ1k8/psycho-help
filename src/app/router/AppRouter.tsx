import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppContext } from '@/app/context';
import { useAuth } from '@/features/auth/api/useAuth';
import { Loader } from '@/shared/ui';
import { routes } from './routes';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppRouter = () => {
  const isAuth = useAuth((state) => state.isAuth);
  const { isAppLoading } = useAppContext();

  if (isAppLoading) {
    return <Loader />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
        {routes
          .filter(({ authOnly }) => !authOnly || isAuth)
          .map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default AppRouter;
