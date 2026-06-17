import { useState } from 'react';
import type { MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entities/auth/model/useAuth';

export const useAuthNavigation = (to: string) => {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !useAuth.getState().isAuth &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !event.altKey &&
      event.button === 0
    ) {
      event.preventDefault();
      setLoginOpen(true);
    }
  };

  const closeLogin = () => {
    setLoginOpen(false);
    if (useAuth.getState().isAuth) navigate(to);
  };

  return { handleClick, isLoginOpen, closeLogin };
};
