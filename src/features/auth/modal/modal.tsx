import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { TAuthModalView } from '../model/modal-types';
import styles from './Modal.module.scss';
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

const dialogLabels = {
  log: 'Вход',
  reg: 'Регистрация',
  forgot: 'Восстановление пароля',
  change: 'Восстановление пароля',
};

const openDialog = (dialog: HTMLDialogElement | null) => {
  if (!dialog) return;
  dialog.showModal();
  return () => dialog.close();
};

const ModalContent = ({
  isOpen,
  onClose,
  initialView = 'log',
  resetToken,
}: TModalWindowProps) => {
  const [modalWindow, setModalWindow] = useState(initialView);

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

  return createPortal(
    <dialog
      className={styles.dialog}
      aria-label={dialogLabels[modalWindow]}
      key={modalWindow}
      ref={openDialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {renderContent()}
    </dialog>,
    document.body,
  );
};

const ModalWindow = (props: TModalWindowProps) => {
  if (!props.isOpen) return null;
  return <ModalContent key={props.initialView ?? 'log'} {...props} />;
};

export default ModalWindow;
