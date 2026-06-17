import { type ChangeEvent, useId, useState } from 'react';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { validateProfileField } from '@/entities/auth/model/profile-form';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useAuthDrafts } from '@/features/auth/model/auth-drafts';
import { useFetch } from '@/shared/api/useFetch';
import type { TAuthModalProps } from '../model/modal-types';
import styles from './Modal.module.scss';
import EyeIcon from './icons/Eye.svg?react';
import EyeOffIcon from './icons/EyeOff.svg?react';

const INITIAL_FORM_VALUE = {
  email: '',
  password: '',
};

const ModalLogin = ({ setWindow, isOpen, setModalOpen }: TAuthModalProps) => {
  const fieldId = useId();
  const email = useAuthDrafts((state) => state.loginEmail);
  const setEmail = useAuthDrafts((state) => state.setLoginEmail);
  const [password, setPassword] = useState('');
  const formValue = { email, password };
  const [errors, setErrors] = useState({ ...INITIAL_FORM_VALUE });
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const { fetching, isLoading, error, clearError } = useFetch(
    async () => {
      const { email, password } = formValue;
      await login(email.trim(), password);
    },
    (error) => getAuthErrorMessage(error, 'login'),
  );

  const validateForm = () => {
    const newErrors = {
      email: validateProfileField('email', formValue.email) || '',
      password:
        formValue.password.length >= 8 && formValue.password.length <= 64
          ? ''
          : 'Пароль должен содержать от 8 до 64 символов',
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleOk = async () => {
    if (isLoading || !validateForm()) return;
    const ok = await fetching();
    if (ok) {
      setEmail('');
      setPassword('');
      setModalOpen(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearError();
    if (name === 'email') setEmail(value);
    else setPassword(value);
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderAuth}>
          <h2 className={styles.modalTitle}>Вход</h2>
          <button
            className={styles.closeButton}
            aria-label="Закрыть окно входа"
            type="button"
            onClick={handleCancel}
          >
            ✕
          </button>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleOk();
          }}
        >
          <div className={styles.form}>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-email`}>Электронная почта</label>
              <input
                className={styles.input}
                aria-describedby={
                  errors.email ? `${fieldId}-email-error` : undefined
                }
                aria-invalid={!!errors.email}
                autoComplete="email"
                disabled={isLoading}
                id={`${fieldId}-email`}
                maxLength={64}
                name="email"
                placeholder="Введите почту"
                type="email"
                value={formValue.email}
                onBlur={() =>
                  setErrors((prev) => ({
                    ...prev,
                    email: validateProfileField('email', formValue.email) || '',
                  }))
                }
                onChange={handleInputChange}
              />
              {errors.email && (
                <span
                  className={styles.errorText}
                  id={`${fieldId}-email-error`}
                >
                  {errors.email}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor={`${fieldId}-password`}>Пароль</label>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.passwordInput}
                  aria-describedby={
                    errors.password ? `${fieldId}-password-error` : undefined
                  }
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                  disabled={isLoading}
                  id={`${fieldId}-password`}
                  maxLength={64}
                  name="password"
                  placeholder="Введите пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={formValue.password}
                  onChange={handleInputChange}
                />
                <button
                  className={styles.showPassButton}
                  aria-label={
                    showPassword ? 'Скрыть пароль' : 'Показать пароль'
                  }
                  aria-pressed={showPassword}
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {errors.password && (
                <span
                  className={styles.errorText}
                  id={`${fieldId}-password-error`}
                >
                  {errors.password}
                </span>
              )}
            </div>
            <button
              className={styles.forgotLink}
              type="button"
              onClick={() => setWindow('forgot')}
            >
              Забыли пароль?
            </button>
          </div>

          {error.message && (
            <p className={styles.errorMessage} role="alert">
              {error.message}
            </p>
          )}

          <div className={styles.footer}>
            <button
              className={styles.submitButton}
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? 'Загрузка...' : 'Войти'}
            </button>
            <p className={styles.Suggestion}>
              <span>У вас еще нет учетной записи?</span>{' '}
              <button
                className={styles.ModalSwitcher}
                type="button"
                onClick={() => setWindow('reg')}
              >
                Регистрация
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalLogin;
