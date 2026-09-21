import React, { useMemo, useState } from 'react';
import type { RegistrationData } from '@/entities/auth';
import { useAuth } from '@/features/auth/api/useAuth';
import { useFetch } from '@/shared/api/useFetch';
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

const HINTS = {
  phone_number: 'Введите номер в формате +79999999999',
  email: 'Введите вашу электронную почту в формате primer@gmail.com',
  password: 'Пароль не менее 8 символов, с цифрой, буквой и спецсимволом',
};

// Здесь тоже самое что и с modal-login.tsx
// Заменяем any на конкретные union типы, т.к известно какие значения реально передаются

type Tprops = {
  setWindow: (param: 'log' | 'reg' | 'forgot' | 'change') => void;
  isOpen: boolean;
  setModalOpen: (param: boolean) => void;
};

const ModalRegistration: React.FC<Tprops> = ({
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
  const [open, setOpen] = useState(isOpen);

  //импортируем функции регистрации, изменения состояния и мидлвар
  const { registration } = useAuth();

  const { fetching, isLoading, error } = useFetch(async () => {
    const { confirm_password, ...dataForServer } = formValue;
    await registration(dataForServer as RegistrationData);
  });

  //Функции для валидации полей формы

  const validateFirst_name = (name: string) =>
    /^[a-zа-я]+$/i.test(name) ? '' : 'Имя не должно содержать цифр';

  const validateLast_name = (name: string) =>
    /^[a-zа-я]+$/i.test(name) ? '' : 'Фамилия не должна содержать цифр';

  const validatePhone_number = (phone_number: string) => {
    const sanitizedNumber = phone_number.replace(/[^0-9+]/g, '');
    return sanitizedNumber.length === 12 && sanitizedNumber.startsWith('+7')
      ? ''
      : 'Номер телефона должен быть в формате +79999999999';
  };

  const validateEmail = (email: string) =>
    /^[\w-]+(\.[\w-]+)*@[\w-]+\.[a-z]{2,6}$/i.test(email)
      ? ''
      : 'Некорректный формат электронной почты';

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Пароль должен содержать не менее 8 символов';
    }
    if (!/[0-9]/.test(password)) {
      return 'Пароль должен содержать хотя бы одну цифру';
    }
    if (!/[a-zA-Z]/.test(password)) {
      return 'Пароль должен содержать хотя бы одну латинскую букву';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Пароль должен содержать хотя бы один специальный символ';
    }
    if (/[^a-zA-Z0-9!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Пароль может содержать только латинские буквы, цифры и специальные символы';
    }
    return '';
  };

  const validateConfirm_password = (confirm_password: string) =>
    confirm_password === formValue.password ? '' : 'Пароли не совпадают';

  //Применение функций валидаций и возвращение true, если нет ошибок, иначе false

  const validateForm = () => {
    const newErrors = {
      first_name: validateFirst_name(formValue.first_name),
      last_name: validateLast_name(formValue.last_name),
      phone_number: validatePhone_number(formValue.phone_number),
      email: validateEmail(formValue.email),
      password: validatePassword(formValue.password),
      confirm_password: validateConfirm_password(formValue.confirm_password),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  //Если все правильно, то модалка закрывается

  const handleOk = async () => {
    if (!validateForm()) return;
    const ok = await fetching();
    if (ok) {
      setOpen(false);
      setModalOpen(false);
      resetForm();
    }
  };

  //Закрытие модалки
  const handleCancel = () => {
    setOpen(false);
    setModalOpen(false);
  };

  //Функция, возвращающая true, если все поля формы заполнены (кроме middle_name),
  //иначе false (При изменении формы)
  const formComplete = useMemo(() => {
    return Object.entries(formValue).every(([key, value]) => {
      if (key === 'middle_name') return true;
      return value.trim() !== '';
    });
  }, [formValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const filteredValue =
      name === 'first_name' || name === 'last_name' || name === 'middle_name'
        ? value.replace(/[0-9\s]/g, '')
        : value;
    setFormValue((prevValues) => ({
      ...prevValues,
      [name]: filteredValue,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (!value.startsWith('7')) {
      if (value.startsWith('8')) {
        value = '7' + value.slice(1);
      } else if (value === '') {
        value = '';
      } else if (!value.startsWith('7')) {
        value = '7' + value;
      }
    }

    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    let formatted = '';
    if (value.length > 0) {
      formatted = '+' + value.slice(0, 1);
      if (value.length > 1) formatted += value.slice(1, 4);
      if (value.length > 4) formatted += value.slice(4, 7);
      if (value.length > 7) formatted += value.slice(7, 9);
      if (value.length > 9) formatted += value.slice(9, 11);
    }

    setFormValue((prevValues) => ({
      ...prevValues,
      phone_number: formatted || value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      phone_number: '',
    }));
  };

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderAuth}>
          <h2 className={styles.modalTitle}>Регистрация</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть окно регистрации"
          >
            ✕
          </button>
        </div>

        <form className={styles.form}>
          <div className={styles.names}>
            <label>
              <span className={styles.required}>Ваше имя</span>
              <input
                type="text"
                name="first_name"
                value={formValue.first_name}
                placeholder="Введите имя"
                onChange={handleInputChange}
                className={styles.input}
                aria-label="Строка для ввода имени"
              />
              {errors.first_name && (
                <p className={styles.errorText}>{errors.first_name}</p>
              )}
            </label>
            <label>
              <span className={styles.required}>Ваша фамилия</span>
              <input
                type="text"
                name="last_name"
                value={formValue.last_name}
                placeholder="Введите фамилию"
                onChange={handleInputChange}
                className={styles.input}
                aria-label="Строка для ввода фамилии"
              />
              {errors.last_name && (
                <p className={styles.errorText}>{errors.last_name}</p>
              )}
            </label>
          </div>
          <label>
            <span>Номер телефона</span>
            <input
              type="tel"
              name="phone_number"
              value={formValue.phone_number}
              placeholder="+79999999999"
              onChange={handlePhoneChange}
              className={styles.input}
            />
            {errors.phone_number && (
              <span className={styles.errorText}>{errors.phone_number}</span>
            )}
          </label>
          <label>
            <span className={styles.required}>Электронная почта</span>
            <input
              type="email"
              name="email"
              value={formValue.email}
              placeholder="primer@gmail.com"
              onChange={handleInputChange}
              className={styles.input}
              aria-label="Строка для ввода электронной почты"
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </label>
          <label>
            <span className={styles.required}>Пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formValue.password}
                placeholder="Введите пароль"
                onChange={handleInputChange}
                className={styles.passwordInput}
                aria-label="Строка для ввода пароля"
              />
              <button
                type="button"
                className={styles.showPassButton}
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.password ? (
              <span className={styles.errorText}>{errors.password}</span>
            ) : (
              <span className={styles.hintText}>{HINTS.password}</span>
            )}
          </label>
          <label>
            <span className={styles.required}>Повторите пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm_password"
                value={formValue.confirm_password}
                placeholder="Введите пароль ещё раз"
                onChange={handleInputChange}
                className={styles.passwordInput}
                aria-label="Строка для повторного ввода пароля"
              />
              <button
                type="button"
                className={styles.showPassButton}
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-pressed={showConfirmPassword}
                aria-label={
                  showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'
                }
              >
                {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className={styles.errorText}>{errors.confirm_password}</p>
            )}
          </label>
        </form>

        {error.message !== '' && (
          <p className={styles.errorMessage}>{error.message}</p>
        )}

        <div className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleOk}
            disabled={!formComplete || isLoading}
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
      </div>
    </div>
  );
};

export default ModalRegistration;
