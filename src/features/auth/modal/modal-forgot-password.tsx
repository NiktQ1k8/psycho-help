import React, { useState } from 'react';
import { useFetch } from '@/shared/api/useFetch';
import styles from './Modal.module.scss';

type Tprops = {
  setWindow: (param: 'log' | 'reg' | 'forgot' | 'change') => void;
  isOpen: boolean;
  setModalOpen: (param: boolean) => void;
};

const ModalForgotPassword: React.FC<Tprops> = ({
  setWindow,
  isOpen,
  setModalOpen,
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(isOpen);

  const {
    fetching,
    isLoading,
    error: fetchError,
  } = useFetch(async () => {
    // Здесь можно вызвать реальный API, например AuthApi.forgotPassword(email)
    // Сейчас делаем заглушку
    await new Promise((res) => setTimeout(res, 700));
  });

  const validateEmail = (value: string) =>
    /^[\w-]+(\.[\w-]+)*@[\w-]+\.[a-z]{2,6}$/i.test(value)
      ? ''
      : 'Некорректный формат электронной почты';

  const handleOk = async () => {
    const err = validateEmail(email);
    setError(err);
    if (err) return;
    await fetching();
    if (fetchError.message === '') {
      // закроем модалку и покажем нотификацию где-то вне компонента
      setOpen(false);
      setModalOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setModalOpen(false);
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderPassword}>
          <h2 className={styles.modalTitle}>Забыли пароль?</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <p className={styles.modalDesc}>
          Введите Email, который вы использовали при регистрации
        </p>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Электронная почта</span>
            <input
              type="email"
              name="email"
              value={email}
              placeholder="Введите почту"
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
            {error && <span className={styles.errorText}>{error}</span>}
          </label>
        </form>

        {fetchError.message !== '' && (
          <p className={styles.errorMessage}>{fetchError.message}</p>
        )}

        <div className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleOk}
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : 'Восстановить'}
          </button>
          <p className={styles.Suggestion}>
            <a
              className={styles.ModalSwitcher}
              onClick={() => setWindow('log')}
            >
              Вернуться
            </a>
            <span> | </span>
            <a
              className={styles.ModalSwitcher}
              onClick={() => setWindow('change')}
            >
              Перейти к восстановлению пароля
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModalForgotPassword;
