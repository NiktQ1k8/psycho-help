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

const ModalContent: FC<TModalWindowProps> = ({
  isOpen,
  onClose,
  initialView = 'log',
  resetToken,
}) => {
  const [modalWindow, setModalWindow] =
    React.useState<TAuthModalView>(initialView);

  const handleSetModalOpen = (open: boolean) => {
    if (!open) onClose();
  };

  const renderContent = () => {
    if (modalWindow === 'log') {
      return (
        <ModalLogin
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
          setWindow={setModalWindow}
        />
      );
    }
    if (modalWindow === 'reg') {
      return (
        <ModalRegistration
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
          setWindow={setModalWindow}
        />
      );
    }
    if (modalWindow === 'forgot') {
      return (
        <ModalForgotPassword
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
          setWindow={setModalWindow}
        />
      );
    }
    if (modalWindow === 'change') {
      return (
        <ModalChangePassword
          isOpen={isOpen}
          setModalOpen={handleSetModalOpen}
          setWindow={setModalWindow}
          token={resetToken}
        />
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return createPortal(renderContent(), document.body);
};

const ModalWindow: FC<TModalWindowProps> = (props) => {
  if (!props.isOpen) return null;
  return <ModalContent key={props.initialView ?? 'log'} {...props} />;
};

export default ModalWindow;
