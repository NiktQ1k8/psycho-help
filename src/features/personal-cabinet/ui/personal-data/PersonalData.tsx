import { type ChangeEvent, type FormEvent, useState } from 'react';
import type { FC } from 'react';
import { UserOutlined } from '@ant-design/icons';
import { App, Input, Modal } from 'antd';
import { templateParser } from 'input-format';
import { authApi } from '@/entities/auth/api';
import { getAuthErrorMessage } from '@/entities/auth/model/auth-errors';
import {
  type TProfileFormData,
  type TProfileFormErrors,
  getProfileFormData,
  validatePassword,
  validateProfileField,
} from '@/entities/auth/model/profile-form';
import { useAuth } from '@/entities/auth/model/useAuth';
import type { TUser, TUserProfileUpdate } from '@/entities/auth/types';
import { Role } from '@/entities/role/helpers';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { getErrorMessage } from '@/shared/api/errors';
import EditIcon from '@/shared/assets/images/cabinet/edit.svg?react';
import ExitIcon from '@/shared/assets/images/cabinet/exit.svg?react';
import { FormattedInput } from '@/shared/ui/formatted-input/FormattedInput';
import { PhoneInput } from '@/shared/ui/phone-input/PhoneInput';
import styles from './PersonalData.module.scss';

const parseStudyGroup = templateParser('xxx-xxxx', (character, value) => {
  const symbol = character.toUpperCase().replace('A', 'А');
  const pattern = value.length === 2 ? /^[1-4А]$/ : /^\d$/;
  if (pattern.test(symbol)) return symbol;
});

const formatStudyGroup = (value = '') => ({
  text: value.length >= 3 ? `${value.slice(0, 3)}-${value.slice(3)}` : value,
  template: 'xxx-xxxx',
});

type TPersonalDataProps = {
  user: TUser | null;
};

const PersonalData: FC<TPersonalDataProps> = ({ user }) => {
  const { logOut, setUser } = useAuth();
  const showStudyGroup = !new Role(user?.roles ?? []).isStaff();
  const { message: messageApi, modal } = App.useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const draft = useCabinetDrafts((state) => state.profile);
  const setProfileDraft = useCabinetDrafts((state) => state.setProfile);
  const clearProfileDraft = useCabinetDrafts((state) => state.clearProfile);
  const originalData = getProfileFormData(user);
  const formData = { ...originalData, ...draft };
  const hasChanges = (
    Object.keys(formData) as Array<keyof TProfileFormData>
  ).some(
    (key) =>
      (key !== 'study_group' || showStudyGroup) &&
      formData[key].trim() !== originalData[key].trim(),
  );
  const [errors, setErrors] = useState<TProfileFormErrors>({});

  const handleFieldChange = (name: keyof TProfileFormData, value: string) => {
    setProfileDraft({ [name]: value });
    setErrors((prev) => ({
      ...prev,
      [name]: validateProfileField(name, value),
    }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFieldChange(e.target.name as keyof TProfileFormData, e.target.value);
  };

  const handleNameEdit = () => {
    setIsEditingName(!isEditingName);
  };

  const handleCancelChanges = () => {
    if (isSaving) return;
    clearProfileDraft();
    setErrors({});
    setIsEditingName(false);
  };

  const toProfileUpdate = (data: TProfileFormData): TUserProfileUpdate => ({
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    middle_name: data.middle_name.trim() || null,
    phone_number: data.phone_number,
    email: data.email.trim(),
    social_media: data.social_media.trim() || null,
    ...(showStudyGroup && { study_group: data.study_group.trim() || null }),
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: TProfileFormErrors = {};
    (Object.keys(formData) as Array<keyof TProfileFormData>).forEach((key) => {
      if (key === 'study_group' && !showStudyGroup) return;
      const error = validateProfileField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!hasChanges || isSaving) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const user = await authApi.updateProfile(toProfileUpdate(formData));
      setErrors({});
      setIsEditingName(false);
      setUser(user);
      clearProfileDraft();
      messageApi.success('Изменения профиля сохранены');
    } catch (error) {
      messageApi.error(
        getErrorMessage(error, 'Не удалось сохранить изменения'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (isSavingPassword) return;
    if (
      !passwordData.new_password ||
      !passwordData.old_password ||
      !passwordData.confirm_password
    ) {
      messageApi.error('Заполните все поля');
      return;
    }
    if (
      passwordData.old_password.length < 8 ||
      passwordData.old_password.length > 64
    ) {
      messageApi.error('Текущий пароль должен содержать от 8 до 64 символов');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      messageApi.error('Новые пароли не совпадают');
      return;
    }
    const passwordError = validatePassword(passwordData.new_password);
    if (passwordError) {
      messageApi.error(passwordError);
      return;
    }

    setIsSavingPassword(true);
    try {
      await authApi.updatePassword({
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
      messageApi.error(getAuthErrorMessage(error, 'changePassword'));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = () => {
    modal.confirm({
      title: 'Подтверждение выхода',
      content: 'Вы уверены, что хотите выйти из аккаунта?',
      okText: 'Выйти',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          await logOut();
        } catch (error) {
          messageApi.error(getAuthErrorMessage(error, 'logout'));
          throw error;
        }
      },
    });
  };

  return (
    <>
      <form
        className={styles.container}
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
      >
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
                        disabled={isSaving}
                        maxLength={50}
                        aria-invalid={!!errors.last_name}
                        value={formData.last_name}
                        onChange={handleInputChange}
                        placeholder="Фамилия"
                        className={errors.last_name ? styles.inputError : ''}
                      />
                      {errors.last_name && (
                        <span className={styles.nameErrorText}>
                          {errors.last_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        type="text"
                        name="first_name"
                        disabled={isSaving}
                        maxLength={50}
                        aria-invalid={!!errors.first_name}
                        value={formData.first_name}
                        onChange={handleInputChange}
                        placeholder="Имя"
                        className={errors.first_name ? styles.inputError : ''}
                      />
                      {errors.first_name && (
                        <span className={styles.nameErrorText}>
                          {errors.first_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        type="text"
                        name="middle_name"
                        disabled={isSaving}
                        maxLength={50}
                        aria-invalid={!!errors.middle_name}
                        value={formData.middle_name}
                        onChange={handleInputChange}
                        placeholder="Отчество"
                        className={errors.middle_name ? styles.inputError : ''}
                      />
                      {errors.middle_name && (
                        <span className={styles.nameErrorText}>
                          {errors.middle_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.nameActions}>
                    <button
                      type="button"
                      className={styles.saveNameButton}
                      onClick={() => void handleSubmit()}
                      disabled={isSaving || !hasChanges}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelButton}
                      onClick={handleCancelChanges}
                      disabled={isSaving}
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
                  disabled={isSaving}
                  aria-label="Редактировать имя"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          </div>

          <div className={styles.fieldsGrid}>
            {showStudyGroup && (
              <div className={styles.field}>
                <label htmlFor="study_group">Учебная группа</label>
                <div className={styles.editableField}>
                  <FormattedInput
                    type="text"
                    id="study_group"
                    name="study_group"
                    disabled={isSaving}
                    value={formData.study_group.replace('-', '')}
                    parse={parseStudyGroup}
                    format={formatStudyGroup}
                    onChange={(value) =>
                      handleFieldChange(
                        'study_group',
                        formatStudyGroup(value).text,
                      )
                    }
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
            )}

            <div className={styles.field}>
              <label htmlFor="phone_number">Номер телефона</label>
              <div className={styles.editableField}>
                <PhoneInput
                  id="phone_number"
                  name="phone_number"
                  disabled={isSaving}
                  value={formData.phone_number}
                  onChange={(value) => handleFieldChange('phone_number', value)}
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
                  disabled={isSaving}
                  maxLength={64}
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
              <label htmlFor="social_media">Соцсети</label>
              <div className={styles.editableField}>
                <input
                  type="text"
                  id="social_media"
                  name="social_media"
                  disabled={isSaving}
                  value={formData.social_media}
                  onChange={handleInputChange}
                  maxLength={50}
                  placeholder="Ссылка на профиль или @username"
                  aria-invalid={!!errors.social_media}
                />
                <button type="button" className={styles.editButton}>
                  <EditIcon />
                </button>
              </div>
              {errors.social_media && (
                <span className={styles.errorText}>{errors.social_media}</span>
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
              type="button"
              className={styles.cancelButton}
              onClick={handleCancelChanges}
              disabled={isSaving || Object.keys(draft).length === 0}
            >
              Отменить изменения
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving || !hasChanges}
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
        onOk={() => void handlePasswordSubmit()}
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
              autoComplete="current-password"
              maxLength={64}
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
              autoComplete="new-password"
              maxLength={64}
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
              autoComplete="new-password"
              maxLength={64}
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
