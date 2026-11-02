import React, { useState } from 'react';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import {
  validatePassword,
  validateProfileField,
} from '@/entities/auth/model/profile-form';
import { useAuth } from '@/entities/auth/model/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import { PhoneInput } from '@/shared/ui/phone-input/PhoneInput';
import type { TAuthModalProps } from '../model/modal-types';
import styles from './Modal.module.scss';
import EyeIcon from './icons/Eye.svg?react';
import EyeOffIcon from './icons/EyeOff.svg?react';

const INITIAL_FORM_VALUE = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  confirm_password: '',
};

const ModalRegistration: React.FC<TAuthModalProps> = ({
  setWindow,
  isOpen,
  setModalOpen,
}) => {
  const [formValue, setFormValue] = useState({ ...INITIAL_FORM_VALUE });
  const [errors, setErrors] = useState({ ...INITIAL_FORM_VALUE });

  const resetForm = () => {
    setFormValue({ ...INITIAL_FORM_VALUE });
    setErrors({ ...INITIAL_FORM_VALUE });
  };

  const { registration } = useAuth();

  const { fetching, isLoading, error, clearError } = useFetch(
    async () => {
      const { confirm_password, ...dataForServer } = formValue;
      await registration({
        ...dataForServer,
        first_name: dataForServer.first_name.trim(),
        last_name: dataForServer.last_name.trim(),
        email: dataForServer.email.trim(),
      });
    },
    (error) => getAuthErrorMessage(error, 'registration'),
  );

  const validateConfirmPassword = (confirmPassword: string) =>
    !confirmPassword
      ? 'Повторите пароль'
      : confirmPassword === formValue.password
        ? ''
        : 'Пароли не совпадают';

  const validateForm = () => {
    const newErrors = {
      first_name:
        validateProfileField('first_name', formValue.first_name) || '',
      last_name: validateProfileField('last_name', formValue.last_name) || '',
      phone_number:
        validateProfileField('phone_number', formValue.phone_number) || '',
      email: validateProfileField('email', formValue.email) || '',
      password: validatePassword(formValue.password) || '',
      confirm_password: validateConfirmPassword(formValue.confirm_password),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleOk = async () => {
    if (isLoading || !validateForm()) return;
    const ok = await fetching();
    if (ok) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
  };

  const validateField = (
    name: keyof typeof formValue,
    value: string,
  ): string => {
    if (name === 'password') return validatePassword(value) || '';
    if (name === 'confirm_password') return validateConfirmPassword(value);
    return validateProfileField(name, value) || '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as keyof typeof formValue;
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, formValue[name]),
    }));
  };

  const handleFieldChange = (name: keyof typeof formValue, value: string) => {
    clearError();
    setFormValue((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
      ...(name === 'password' &&
        formValue.confirm_password && {
          confirm_password:
            formValue.confirm_password === value ? '' : 'Пароли не совпадают',
        }),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name as keyof typeof formValue, e.target.value);
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderAuth}>
          <h2 className={styles.modalTitle}>Регистрация</h2>
          <button
            className={styles.closeButton}
            aria-label="Закрыть окно регистрации"
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
            <div className={styles.names}>
              <label>
                <span className={styles.required}>Ваше имя</span>
                <input
                  className={styles.input}
                  aria-invalid={!!errors.first_name}
                  aria-label="Строка для ввода имени"
                  disabled={isLoading}
                  maxLength={50}
                  name="first_name"
                  placeholder="Введите имя"
                  type="text"
                  value={formValue.first_name}
                  onBlur={handleBlur}
                  onChange={handleInputChange}
                />
                {errors.first_name && (
                  <p className={styles.errorText}>{errors.first_name}</p>
                )}
              </label>
              <label>
                <span className={styles.required}>Ваша фамилия</span>
                <input
                  className={styles.input}
                  aria-invalid={!!errors.last_name}
                  aria-label="Строка для ввода фамилии"
                  disabled={isLoading}
                  maxLength={50}
                  name="last_name"
                  placeholder="Введите фамилию"
                  type="text"
                  value={formValue.last_name}
                  onBlur={handleBlur}
                  onChange={handleInputChange}
                />
                {errors.last_name && (
                  <p className={styles.errorText}>{errors.last_name}</p>
                )}
              </label>
            </div>
            <label>
              <span className={styles.required}>Номер телефона</span>
              <PhoneInput
                className={styles.input}
                aria-invalid={!!errors.phone_number}
                disabled={isLoading}
                name="phone_number"
                value={formValue.phone_number}
                onBlur={handleBlur}
                onChange={(value) => handleFieldChange('phone_number', value)}
              />
              {errors.phone_number && (
                <span className={styles.errorText}>{errors.phone_number}</span>
              )}
            </label>
            <label>
              <span className={styles.required}>Электронная почта</span>
              <input
                className={styles.input}
                aria-invalid={!!errors.email}
                aria-label="Строка для ввода электронной почты"
                autoComplete="email"
                disabled={isLoading}
                maxLength={64}
                name="email"
                placeholder="Введите почту"
                type="email"
                value={formValue.email}
                onBlur={handleBlur}
                onChange={handleInputChange}
              />
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </label>
            <label>
              <span className={styles.required}>Пароль</span>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.passwordInput}
                  aria-invalid={!!errors.password}
                  aria-label="Строка для ввода пароля"
                  autoComplete="new-password"
                  disabled={isLoading}
                  maxLength={64}
                  name="password"
                  placeholder="Введите пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={formValue.password}
                  onBlur={handleBlur}
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
              {errors.password ? (
                <span className={styles.errorText}>{errors.password}</span>
              ) : (
                <span className={styles.hintText}>
                  Пароль от 8 до 64 символов, без пробелов в начале и конце
                </span>
              )}
            </label>
            <label>
              <span className={styles.required}>Повторите пароль</span>
              <div className={styles.passwordWrapper}>
                <input
                  className={styles.passwordInput}
                  aria-invalid={!!errors.confirm_password}
                  aria-label="Строка для повторного ввода пароля"
                  autoComplete="new-password"
                  disabled={isLoading}
                  maxLength={64}
                  name="confirm_password"
                  placeholder="Введите пароль ещё раз"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formValue.confirm_password}
                  onBlur={handleBlur}
                  onChange={handleInputChange}
                />
                <button
                  className={styles.showPassButton}
                  aria-label={
                    showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'
                  }
                  aria-pressed={showConfirmPassword}
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                >
                  {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className={styles.errorText}>{errors.confirm_password}</p>
              )}
            </label>
          </div>

          {error.message !== '' && (
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
              {isLoading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
            <p className={styles.Suggestion}>
              <span>У вас уже есть учётная запись?</span>{' '}
              <a
                className={styles.ModalSwitcher}
                onClick={() => setWindow('log')}
              >
                Войти
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistration;
