import React, { useState } from 'react';
import { useAuth } from '@/features/auth/api/useAuth';
import { useFetch } from '@/shared/api/useFetch';
import styles from './Modal.module.scss';
import EyeIcon from './icons/Eye.svg?react';
import EyeOffIcon from './icons/EyeOff.svg?react';

const INITIAL_FORM_VALUE = {
  email: '',
  password: '',
};

/*
Тип пропсов для модального окна входа:
- "setWindow" — функция для переключения окна модалки (вход/регистрация)
- "isOpen" — булевый флаг, открыто ли модальное окно
- "setModalOpen" — функция для закрытия или открытия модального окна

Здесь использовалось "any" для функций, чтобы не писать типы, но это убрано,
так как сейчас известно, какие значения реально передаются:

- setWindow принимает только 'login' или 'reg'
- setModalOpen принимает только булевое значение

Если в будущем появятся новые состояния модалки (например "forgot"),
можно расширить тип union или же его вынести в отдельный файл:

type TProps = {
  setWindow: (param: 'login' | 'reg' | 'forgot') => void;
  isOpen: boolean;
  setModalOpen: (param: boolean) => void;
};
*/

type Tprops = {
  setWindow: (param: 'log' | 'reg' | 'forgot' | 'change') => void;
  isOpen: boolean;
  setModalOpen: (param: boolean) => void;
};

const ModalLogin: React.FC<Tprops> = ({ setWindow, isOpen, setModalOpen }) => {
  const [formValue, setFormValue] = useState({ ...INITIAL_FORM_VALUE });
  const [errors, setErrors] = useState({ ...INITIAL_FORM_VALUE });
  const [open, setOpen] = useState(isOpen);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const { fetching, isLoading, error } = useFetch(async () => {
    const { email, password } = { ...formValue };
    await login(email, password);
  });

  const validateEmail = (email: string) =>
    /^[\w-]+(\.[\w-]+)*@[\w-]+\.[a-z]{2,6}$/i.test(email)
      ? ''
      : 'Некорректный формат электронной почты';

  const validatePassword = (password: string) =>
    password ? '' : 'Пароль не может быть пустым';

  const validateForm = () => {
    const newErrors = {
      email: validateEmail(formValue.email),
      password: validatePassword(formValue.password),
    };
    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleOk = async () => {
    if (!validateForm()) return;
    const ok = await fetching();
    if (ok) {
      setOpen(false);
      setModalOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValue((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: '',
    }));
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderAuth}>
          <h2 className={styles.modalTitle}>Вход</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть окно входа"
          >
            ✕
          </button>
        </div>

        <form className={styles.form}>
          <label>
            <span>Электронная почта</span>
            <input
              type="email"
              name="email"
              value={formValue.email}
              placeholder="primer@gmail.com"
              onChange={handleInputChange}
              className={styles.input}
              aria-details="Строка для ввода электронной почты"
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}
          </label>
          <label>
            <span>Пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formValue.password}
                placeholder="Введите пароль"
                onChange={handleInputChange}
                className={styles.passwordInput}
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
            {errors.password && (
              <span className={styles.errorText}>{errors.password}</span>
            )}
          </label>
          <div className={styles.rememberContainer}>
            <div className={styles.rememberCheckbox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkbox_custom}></span>
                <span className={styles.checkboxText}>Запомнить меня</span>
              </label>
            </div>
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
        </form>

        {error.status === 401 && (
          <p className={styles.errorMessage}>Неверный логин или пароль</p>
        )}
        {error.message !== '' && error.status !== 401 && (
          <p className={styles.errorMessage}>{error.message}</p>
        )}

        <div className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleOk}
            disabled={isLoading}
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
      </div>
    </div>
  );
};

export default ModalLogin;
