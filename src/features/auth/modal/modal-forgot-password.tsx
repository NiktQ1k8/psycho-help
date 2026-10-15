import { useState } from 'react';
import { authApi } from '@/entities/auth/api';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { validateProfileField } from '@/entities/auth/model/profile-form';
import { useFetch } from '@/shared/api/useFetch';
import type { TAuthModalProps } from '../model/modal-types';
import styles from './Modal.module.scss';

const ModalForgotPassword = ({
  setWindow,
  isOpen,
  setModalOpen,
}: TAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { fetching, isLoading, error, clearError } = useFetch(
    async () => {
      const response = await authApi.requestPasswordReset({
        email: email.trim(),
      });
      setSuccessMessage(response.message);
    },
    (error) => getAuthErrorMessage(error, 'requestPasswordReset'),
  );

  const handleSubmit = async () => {
    if (isLoading) return;
    const validationError = validateProfileField('email', email) || '';
    setEmailError(validationError);
    if (!validationError) await fetching();
  };

  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderPassword}>
          <h2 className={styles.modalTitle}>
            {successMessage ? 'Проверьте почту' : 'Забыли пароль?'}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setModalOpen(false)}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        {successMessage ? (
          <>
            <p className={styles.modalDesc} role="status">
              {successMessage}. Откройте ссылку из письма, чтобы задать новый
              пароль.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => setWindow('log')}
            >
              Вернуться ко входу
            </button>
          </>
        ) : (
          <>
            <p className={styles.modalDesc}>
              Введите почту, которую вы использовали при регистрации
            </p>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void handleSubmit();
              }}
            >
              <div className={styles.form}>
                <label>
                  <span>Электронная почта</span>
                  <input
                    type="email"
                    disabled={isLoading}
                    name="email"
                    autoComplete="email"
                    maxLength={64}
                    value={email}
                    placeholder="Введите почту"
                    className={styles.input}
                    aria-invalid={!!emailError}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError('');
                      clearError();
                    }}
                    onBlur={() =>
                      setEmailError(validateProfileField('email', email) || '')
                    }
                  />
                  {emailError && (
                    <span className={styles.errorText}>{emailError}</span>
                  )}
                </label>
              </div>
              {error.message && (
                <p className={styles.errorMessage} role="alert">
                  {error.message}
                </p>
              )}
              <div className={styles.footer}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Отправка...' : 'Восстановить'}
                </button>
                <p className={styles.Suggestion}>
                  <a
                    className={styles.ModalSwitcher}
                    onClick={() => setWindow('log')}
                  >
                    Вернуться ко входу
                  </a>
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ModalForgotPassword;
