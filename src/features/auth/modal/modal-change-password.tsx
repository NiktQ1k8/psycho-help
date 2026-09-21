import React, { useState } from 'react';
import { useFetch } from '@/shared/api/useFetch';
import styles from './Modal.module.scss';
import EyeIcon from './icons/Eye.svg?react';
import EyeOffIcon from './icons/EyeOff.svg?react';

type Tprops = {
  setWindow: (param: 'log' | 'reg' | 'forgot' | 'change') => void;
  isOpen: boolean;
  setModalOpen: (param: boolean) => void;
};

const ModalChangePassword: React.FC<Tprops> = ({
  setWindow,
  isOpen,
  setModalOpen,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ current: '', new: '', confirm: '' });
  const [open, setOpen] = useState(isOpen);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    fetching,
    isLoading,
    error: fetchError,
  } = useFetch(async () => {
    // Заглушка — здесь должен быть вызов API по смене пароля
    await new Promise((res) => setTimeout(res, 700));
  });

  const validate = () => {
    const newErrors = { current: '', new: '', confirm: '' };
    if (!currentPassword) newErrors.current = 'Введите текущий пароль';
    if (newPassword.length < 8)
      newErrors.new = 'Пароль должен содержать не менее 8 символов';
    if (newPassword !== confirmPassword)
      newErrors.confirm = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.values(newErrors).every((v) => v === '');
  };

  const handleOk = async () => {
    if (!validate()) return;
    await fetching();
    if (fetchError.message === '') {
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
          <h2 className={styles.modalTitle}>Смена пароля</h2>
          <button
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <label>
            <span>Текущий пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                className={styles.showPassButton}
                onClick={() => setShowCurrent((s) => !s)}
                aria-pressed={showCurrent}
                aria-label={showCurrent ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showCurrent ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.current && (
              <p className={styles.errorText}>{errors.current}</p>
            )}
          </label>

          <label>
            <span>Введите новый пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                className={styles.showPassButton}
                onClick={() => setShowNew((s) => !s)}
                aria-pressed={showNew}
                aria-label={showNew ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showNew ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.new ? (
              <p className={styles.errorText}>{errors.new}</p>
            ) : (
              <p className={styles.hintText}>
                Пароль не менее 8 символов, с цифрой, буквой и спецсимволом
              </p>
            )}
          </label>

          <label>
            <span>Повторите пароль</span>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.passwordInput}
              />
              <button
                type="button"
                className={styles.showPassButton}
                onClick={() => setShowConfirm((s) => !s)}
                aria-pressed={showConfirm}
                aria-label={showConfirm ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showConfirm ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
            {errors.confirm && (
              <p className={styles.errorText}>{errors.confirm}</p>
            )}
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
            {isLoading ? 'Загрузка...' : 'Сохранить'}
          </button>
          <p className={styles.Suggestion} style={{ marginTop: 12 }}>
            <a
              className={styles.ModalSwitcher}
              onClick={() => {
                setWindow('log');
              }}
            >
              Вернуться
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModalChangePassword;
