import React, { useState } from 'react';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import { validateProfileField } from '@/entities/auth/model/profile-form';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import type { TAuthModalProps } from '../model/modal-types';
import styles from './Modal.module.scss';
import EyeIcon from './icons/Eye.svg?react';
import EyeOffIcon from './icons/EyeOff.svg?react';

const INITIAL_FORM_VALUE = {
  email: '',
  password: '',
};

const ModalLogin: React.FC<TAuthModalProps> = ({
  setWindow,
  isOpen,
  setModalOpen,
}) => {
  const [formValue, setFormValue] = useState({ ...INITIAL_FORM_VALUE });
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
      setModalOpen(false);
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearError();
    setFormValue((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
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
            <label>
              <span>Электронная почта</span>
              <input
                className={styles.input}
                aria-details="Строка для ввода электронной почты"
                aria-invalid={!!errors.email}
                autoComplete="email"
                disabled={isLoading}
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
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </label>
            <label>
              <span>Пароль</span>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.passwordInput}
                  aria-invalid={!!errors.password}
                  autoComplete="current-password"
                  disabled={isLoading}
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
                <span className={styles.errorText}>{errors.password}</span>
              )}
            </label>
            <a
              className={styles.forgotLink}
              onClick={(e) => {
                e.preventDefault();
                setWindow('forgot');
              }}
            >
              Забыли пароль?
            </a>
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
              <a
                className={styles.ModalSwitcher}
                onClick={() => setWindow('reg')}
              >
                Регистрация
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalLogin;
