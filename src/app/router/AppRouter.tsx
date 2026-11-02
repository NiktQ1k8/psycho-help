import { Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAppContext } from '@/app/context';
import { useAuth } from '@/entities/auth/model/useAuth';
import { SLUG } from '@/shared/config/slug';
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
      <Suspense fallback={<Loader />}>
        <Routes>
          {routes
            .filter(({ authOnly }) => !authOnly || isAuth)
            .map(({ path, Component }) => (
              <Route element={<Component />} key={path} path={path} />
            ))}
          <Route element={<Navigate to={SLUG.MAIN} />} path="*" />
        </Routes>
      </Suspense>
    </>
  );
};

export default AppRouter;
