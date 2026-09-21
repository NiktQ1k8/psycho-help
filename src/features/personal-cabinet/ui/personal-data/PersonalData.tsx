import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { FC } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Input, Modal, message } from 'antd';
import type { User, UserProfileUpdate } from '@/entities/auth';
import AuthApi from '@/features/auth/api/auth-api';
import { useAuth } from '@/features/auth/api/useAuth';
import EditIcon from '@/shared/assets/images/cabinet/edit.svg?react';
import ExitIcon from '@/shared/assets/images/cabinet/exit.svg?react';
import styles from './PersonalData.module.scss';

interface PersonalDataProps {
  user: User | null;
}

interface FormData {
  first_name: string;
  last_name: string;
  middle_name: string;
  phone_number: string;
  email: string;
  study_group: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  email?: string;
  study_group?: string;
}

const PersonalData: FC<PersonalDataProps> = ({ user }) => {
  const { logOut, setUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(user?.avatar_url || null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [originalData, setOriginalData] = useState<FormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    middle_name: user?.middle_name || '',
    phone_number: user?.phone_number || '',
    email: user?.email || '',
    study_group: user?.study_group || '',
  });

  const [formData, setFormData] = useState<FormData>(originalData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [nameErrors, setNameErrors] = useState<{
    first_name?: string;
    last_name?: string;
    middle_name?: string;
  }>({});

  useEffect(() => {
    const newOriginalData: FormData = {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      middle_name: user?.middle_name || '',
      phone_number: user?.phone_number || '',
      email: user?.email || '',
      study_group: user?.study_group || '',
    };
    setOriginalData(newOriginalData);
    setFormData(newOriginalData);
  }, [user]);

  const validateField = useCallback(
    (name: keyof FormData, value: string): string | undefined => {
      switch (name) {
        case 'first_name':
        case 'last_name':
          if (!value.trim()) return 'Обязательное поле';
          if (value.length < 2) return 'Минимум 2 символа';
          if (!/^[а-яА-ЯёЁa-zA-Z-]+$/.test(value))
            return 'Только буквы и дефис';
          break;
        case 'email':
          if (!value.trim()) return 'Обязательное поле';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return 'Некорректный email';
          break;
        case 'phone_number':
          if (!value.trim()) return 'Обязательное поле';
          if (!/^\+?[\d\s()-]{10,}$/.test(value))
            return 'Некорректный номер телефона';
          break;
      }
      return undefined;
    },
    [],
  );

  const validateNameField = useCallback(
    (
      name: 'first_name' | 'last_name' | 'middle_name',
      value: string,
    ): string | undefined => {
      switch (name) {
        case 'first_name':
        case 'last_name':
          if (!value.trim()) return 'Обязательное поле';
          if (value.trim() && value.length < 2) return 'Минимум 2 символа';
          if (value.trim() && !/^[а-яА-ЯёЁa-zA-Z-]+$/.test(value))
            return 'Только буквы и дефис';
          break;
        case 'middle_name':
          if (value.trim() && !/^[а-яА-ЯёЁa-zA-Z-]+$/.test(value))
            return 'Только буквы и дефис';
          break;
      }
      return undefined;
    },
    [],
  );

  const handleNameInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      const error = validateNameField(
        name as 'first_name' | 'last_name' | 'middle_name',
        value,
      );
      setNameErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateNameField],
  );

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      const error = validateField(name as keyof FormData, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [validateField],
  );

  const handleNameEdit = useCallback(() => {
    setIsEditingName(!isEditingName);
  }, [isEditingName]);

  const validateNameFields = useCallback((): boolean => {
    const newErrors: {
      first_name?: string;
      last_name?: string;
      middle_name?: string;
    } = {};
    let isValid = true;

    const firstNameError = validateNameField('first_name', formData.first_name);
    if (firstNameError) {
      newErrors.first_name = firstNameError;
      isValid = false;
    }

    const lastNameError = validateNameField('last_name', formData.last_name);
    if (lastNameError) {
      newErrors.last_name = lastNameError;
      isValid = false;
    }

    const middleNameError = validateNameField(
      'middle_name',
      formData.middle_name,
    );
    if (middleNameError) {
      newErrors.middle_name = middleNameError;
      isValid = false;
    }

    setNameErrors(newErrors);
    return isValid;
  }, [formData, validateNameField]);

  const toProfileUpdate = useCallback(
    (data: FormData): UserProfileUpdate => ({
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name || null,
      phone_number: data.phone_number,
      email: data.email,
      social_media: user?.social_media ?? null,
      study_group: data.study_group || null,
    }),
    [user],
  );

  const handleSaveName = useCallback(async () => {
    if (!validateNameFields()) return;

    setIsSaving(true);
    try {
      const res = await AuthApi.updateProfile(toProfileUpdate(formData));
      setOriginalData(formData);
      setIsEditingName(false);
      setNameErrors({});
      setUser(res.data);
      messageApi.success('ФИО сохранено');
    } catch (error) {
      console.error('Failed to update name:', error);
      messageApi.error('Не удалось сохранить ФИО');
    } finally {
      setIsSaving(false);
    }
  }, [formData, validateNameFields, messageApi, setUser, toProfileUpdate]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    (Object.keys(formData) as Array<keyof FormData>).forEach((key) => {
      if (key !== 'middle_name') {
        const error = validateField(key, formData[key]);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [formData, validateField]);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault();
      if (!validateForm()) return;

      setIsSaving(true);
      try {
        const res = await AuthApi.updateProfile(toProfileUpdate(formData));
        setOriginalData(formData);
        setIsEditingName(false);
        setUser(res.data);
        messageApi.success('Изменения профиля сохранены');
      } catch (error) {
        console.error('Failed to update profile:', error);
        messageApi.error('Не удалось сохранить изменения');
      } finally {
        setIsSaving(false);
      }
    },
    [formData, validateForm, messageApi, setUser, toProfileUpdate],
  );

  const handlePasswordSubmit = useCallback(async () => {
    if (!passwordData.new_password || !passwordData.old_password) {
      messageApi.error('Заполните все поля');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      messageApi.error('Новые пароли не совпадают');
      return;
    }

    setIsSavingPassword(true);
    try {
      await AuthApi.updatePassword({
        new_password: passwordData.new_password,
        old_password: passwordData.old_password,
      });
      messageApi.success('Пароль успешно изменён');
      setIsPasswordModalOpen(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error: unknown) {
      console.error('Failed to update password:', error);
      messageApi.error('Ошибка при смене пароля');
    } finally {
      setIsSavingPassword(false);
    }
  }, [passwordData, messageApi]);

  const handleLogout = useCallback(() => {
    Modal.confirm({
      title: 'Подтверждение выхода',
      content: 'Вы уверены, что хотите выйти из аккаунта?',
      okText: 'Выйти',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await logOut();
        } catch (error) {
          console.error('Logout failed:', error);
        }
      },
    });
  }, [logOut]);

  return (
    <>
      <form className={styles.container} onSubmit={handleSubmit}>
        {contextHolder}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {avatar ? (
              <img src={avatar} alt="Аватар пользователя" />
            ) : (
              <UserOutlined className={styles.avatarIcon} />
            )}
          </div>
          <div className={styles.avatarUpload}>
            <EditIcon />
            <label htmlFor="avatar-upload">Изменить фотографию</label>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            id="avatar-upload"
            accept="image/*"
            className={styles.hiddenInput}
            onChange={handleFileChange}
          />
        </div>

        <div className={styles.profileSection}>
          <div className={styles.header}>
            <div className={styles.nameWrapper}>
              {isEditingName ? (
                <div className={styles.nameEditContainer}>
                  <div className={styles.nameFieldsRow}>
                    <div className={styles.nameInputWrapper}>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleNameInputChange}
                        placeholder="Фамилия"
                        className={
                          nameErrors.last_name ? styles.inputError : ''
                        }
                      />
                      {nameErrors.last_name && (
                        <span className={styles.nameErrorText}>
                          {nameErrors.last_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleNameInputChange}
                        placeholder="Имя"
                        className={
                          nameErrors.first_name ? styles.inputError : ''
                        }
                      />
                      {nameErrors.first_name && (
                        <span className={styles.nameErrorText}>
                          {nameErrors.first_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        type="text"
                        name="middle_name"
                        value={formData.middle_name}
                        onChange={handleNameInputChange}
                        placeholder="Отчество"
                        className={
                          nameErrors.middle_name ? styles.inputError : ''
                        }
                      />
                      {nameErrors.middle_name && (
                        <span className={styles.nameErrorText}>
                          {nameErrors.middle_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.nameActions}>
                    <button
                      type="button"
                      className={styles.saveNameButton}
                      onClick={handleSaveName}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelNameButton}
                      onClick={() => {
                        setIsEditingName(false);
                        setFormData(originalData);
                        setNameErrors({});
                      }}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <h2 className={styles.name}>
                  {formData.last_name} {formData.first_name}{' '}
                  {formData.middle_name}
                </h2>
              )}
              {!isEditingName && (
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={handleNameEdit}
                  aria-label="Редактировать имя"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          </div>

          <div className={styles.fieldsGrid}>
            <div className={styles.field}>
              <label htmlFor="study_group">Учебная группа</label>
              <div className={styles.editableField}>
                <input
                  type="text"
                  id="study_group"
                  name="study_group"
                  value={formData.study_group}
                  onChange={handleInputChange}
                  placeholder="Введите номер группы"
                  aria-invalid={!!errors.study_group}
                />
                <button type="button" className={styles.editButton}>
                  <EditIcon />
                </button>
              </div>
              {errors.study_group && (
                <span className={styles.errorText}>{errors.study_group}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone_number">Номер телефона</label>
              <div className={styles.editableField}>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="+7 (999) 123-45-67"
                  aria-invalid={!!errors.phone_number}
                />
                <button type="button" className={styles.editButton}>
                  <EditIcon />
                </button>
              </div>
              {errors.phone_number && (
                <span className={styles.errorText}>{errors.phone_number}</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Электронная почта</label>
              <div className={styles.editableField}>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@mail.ru"
                  aria-invalid={!!errors.email}
                />
                <button type="button" className={styles.editButton}>
                  <EditIcon />
                </button>
              </div>
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>

            <div className={styles.field}>
              <label>Пароль</label>
              <div className={styles.passwordField}>
                <input
                  type="password"
                  placeholder="*********"
                  disabled
                  style={{ backgroundColor: 'transparent' }}
                />
              </div>
              <button
                type="button"
                className={styles.changePasswordLink}
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Сменить пароль?
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogout}
              disabled={isSaving}
            >
              <ExitIcon />
              {isSaving ? 'Сохранение...' : 'Выйти'}
            </button>
          </div>
        </div>
      </form>

      <Modal
        title="Смена пароля"
        open={isPasswordModalOpen}
        onOk={handlePasswordSubmit}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setPasswordData({
            old_password: '',
            new_password: '',
            confirm_password: '',
          });
        }}
        confirmLoading={isSavingPassword}
        okText="Сохранить"
        cancelText="Отмена"
        destroyOnHidden
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginTop: '20px',
          }}
        >
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: '#666' }}
            >
              Старый пароль
            </label>
            <Input.Password
              size="large"
              placeholder="Введите старый пароль"
              value={passwordData.old_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  old_password: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: '#666' }}
            >
              Новый пароль
            </label>
            <Input.Password
              size="large"
              placeholder="Введите новый пароль"
              value={passwordData.new_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  new_password: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label
              style={{ display: 'block', marginBottom: '8px', color: '#666' }}
            >
              Подтвердите пароль
            </label>
            <Input.Password
              size="large"
              placeholder="Повторите новый пароль"
              value={passwordData.confirm_password}
              onChange={(e) =>
                setPasswordData((prev) => ({
                  ...prev,
                  confirm_password: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PersonalData;
