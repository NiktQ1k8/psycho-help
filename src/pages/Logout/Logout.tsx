import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { useAuth } from '@/entities/auth/model/useAuth';
import { SLUG } from '@/shared/config/slug';
import Loader from '@/shared/ui/loader/loader';

const Logout = () => {
  const logOut = useAuth((state) => state.logOut);
  const navigate = useNavigate();
  const pendingLogout = useRef<Promise<void> | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    pendingLogout.current ??= logOut();
    pendingLogout.current.then(
      () => {
        if (active) navigate(SLUG.MAIN, { replace: true });
      },
      (error) => {
        if (active) setError(getAuthErrorMessage(error, 'logout'));
      },
    );
    return () => {
      active = false;
    };
  }, [logOut, navigate, attempt]);

  if (!error) return <Loader />;
  return (
    <Result
      status="error"
      title="Не удалось выйти из аккаунта"
      subTitle={error}
      extra={
        <Button
          type="primary"
          onClick={() => {
            pendingLogout.current = null;
            setError('');
            setAttempt((value) => value + 1);
          }}
        >
          Повторить
        </Button>
      }
    />
  );
};

export default Logout;
