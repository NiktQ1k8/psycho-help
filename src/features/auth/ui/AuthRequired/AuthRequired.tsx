import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/entities/auth/model/useAuth';
import ModalWindow from '@/features/auth/modal/modal';

interface IAuthRequiredProps {
  children: ReactNode;
  fallbackTo: string;
}

export const AuthRequired = ({ children, fallbackTo }: IAuthRequiredProps) => {
  const isAuth = useAuth((state) => state.isAuth);
  const navigate = useNavigate();

  if (isAuth) return children;

  return (
    <ModalWindow
      isOpen
      onClose={() => {
        if (!useAuth.getState().isAuth) navigate(fallbackTo, { replace: true });
      }}
    />
  );
};
