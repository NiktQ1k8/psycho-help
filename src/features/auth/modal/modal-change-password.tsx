import { useState } from 'react';
import { Input } from 'antd';
import { authApi } from '@/entities/auth/api';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { validatePassword } from '@/entities/auth/model/profile-form';
import { useFetch } from '@/shared/api/useFetch';
import type { TAuthModalProps } from '../model/modal-types';
import styles from './Modal.module.scss';

type TProps = TAuthModalProps & { token?: string };

const ModalChangePassword = ({
  setWindow,
  isOpen,
  setModalOpen,
  token = '',
}: TProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ password: '', confirm: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const { fetching, isLoading, error, clearError } = useFetch(
    async () => {
      const response = await authApi.resetPassword({
        token,
        new_password: newPassword,
      });
      setSuccessMessage(response.message);
    },
    (error) => getAuthErrorMessage(error, 'resetPassword'),
  );

  const handleSubmit = async () => {
    if (isLoading || !token) return;
    const nextErrors = {
      password: validatePassword(newPassword) || '',
      confirm: !confirmPassword
        ? 'Повторите пароль'
        : newPassword === confirmPassword
          ? ''
          : 'Пароли не совпадают',
    };
    setErrors(nextErrors);
    if (!nextErrors.password && !nextErrors.confirm) await fetching();
  };

  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeaderPassword}>
          <h2 className={styles.modalTitle}>Восстановление пароля</h2>
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
              {successMessage}. Войдите с новым паролем.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => setWindow('log')}
            >
              Войти
            </button>
          </>
        ) : !token ? (
          <>
            <p className={styles.errorMessage} role="alert">
              В ссылке нет кода восстановления. Запросите новое письмо и
              перейдите по ссылке из него.
            </p>
            <button
              type="button"
              className={styles.submitButton}
              onClick={() => setWindow('forgot')}
            >
              Запросить новое письмо
            </button>
          </>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <div className={styles.form}>
              <label htmlFor="reset-password">Новый пароль</label>
              <Input.Password
                id="reset-password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                value={newPassword}
                autoComplete="new-password"
                maxLength={64}
                size="large"
                status={errors.password ? 'error' : undefined}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearError();
                  setErrors({
                    password: validatePassword(e.target.value) || '',
                    confirm:
                      confirmPassword && e.target.value !== confirmPassword
                        ? 'Пароли не совпадают'
                        : '',
                  });
                }}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    password: validatePassword(newPassword) || '',
                  }))
                }
              />
              {errors.password ? (
                <span className={styles.errorText}>{errors.password}</span>
              ) : (
                <span className={styles.hintText}>
                  От 8 до 64 символов, без пробелов в начале и конце
                </span>
              )}
              <label htmlFor="reset-password-confirm">Повторите пароль</label>
              <Input.Password
                id="reset-password-confirm"
                disabled={isLoading}
                aria-invalid={!!errors.confirm}
                value={confirmPassword}
                autoComplete="new-password"
                maxLength={64}
                size="large"
                status={errors.confirm ? 'error' : undefined}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError();
                  setErrors((prev) => ({
                    ...prev,
                    confirm:
                      e.target.value === newPassword
                        ? ''
                        : 'Пароли не совпадают',
                  }));
                }}
              />
              {errors.confirm && (
                <span className={styles.errorText}>{errors.confirm}</span>
              )}
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
                {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
              </button>
              <p className={styles.Suggestion}>
                <a
                  className={styles.ModalSwitcher}
                  onClick={() => setWindow('forgot')}
                >
                  Запросить новое письмо
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ModalChangePassword;
