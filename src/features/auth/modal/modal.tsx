import React from 'react';
import type { FC } from 'react';
import { createPortal } from 'react-dom';
import type { TAuthModalView } from '../model/modal-types';
import ModalChangePassword from './modal-change-password';
import ModalForgotPassword from './modal-forgot-password';
import ModalLogin from './modal-login';
import ModalRegistration from './modal-registration';

type TModalWindowProps = {
  isOpen: boolean;
  onClose: () => void;
  initialView?: TAuthModalView;
  resetToken?: string;
};

const ModalWindow: FC<TModalWindowProps> = ({
  isOpen,
  onClose,
  initialView = 'log',
  resetToken,
}) => {
  const [modalWindow, setModalWindow] =
    React.useState<TAuthModalView>(initialView);

  React.useEffect(() => {
    if (isOpen) {
      setModalWindow(initialView);
    }
  }, [isOpen, initialView]);

  const handleSetModalOpen = (open: boolean) => {
    if (!open) onClose();
  };

  const renderContent = () => {
    if (modalWindow === 'log') {
      return (
        <ModalLogin
          setWindow={setModalWindow}
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
        />
      );
    }
    if (modalWindow === 'reg') {
      return (
        <ModalRegistration
          setWindow={setModalWindow}
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
        />
      );
    }
    if (modalWindow === 'forgot') {
      return (
        <ModalForgotPassword
          setWindow={setModalWindow}
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
        />
      );
    }
    if (modalWindow === 'change') {
      return (
        <ModalChangePassword
          token={resetToken}
          setWindow={setModalWindow}
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
        />
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return createPortal(renderContent(), document.body);
};

export default ModalWindow;
