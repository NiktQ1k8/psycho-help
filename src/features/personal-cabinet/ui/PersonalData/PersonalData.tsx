import { type ChangeEvent, type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { App, Input, Modal, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import { templateParser } from 'input-format';
import { authApi, authQueries } from '@/entities/auth/api';
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
import { UserAvatar } from '@/entities/auth/ui/UserAvatar';
import { Role } from '@/entities/role/helpers';
import { useCabinetDrafts } from '@/features/personal-cabinet/model/cabinet-drafts';
import { PsychologistAbsences } from '@/features/personal-cabinet/ui/PsychologistAbsences/PsychologistAbsences';
import { getRequestErrorMessage } from '@/shared/api/errors';
import EditIcon from '@/shared/assets/images/cabinet/edit.svg?react';
import ExitIcon from '@/shared/assets/images/cabinet/exit.svg?react';
import { FormattedInput } from '@/shared/ui/formatted-input/FormattedInput';
import { PhoneInput } from '@/shared/ui/phone-input/PhoneInput';
import './PersonalData.img-crop.scss';
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

const getAvatarFileError = async (file: File): Promise<string | undefined> => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return 'Выберите изображение JPEG, PNG или WebP';
  }
  if (file.size > 10 * 1024 * 1024) {
    return 'Размер фотографии не должен превышать 10 МБ';
  }
  try {
    const image = await createImageBitmap(file);
    image.close();
  } catch {
    return 'Не удалось открыть фотографию. Выберите другое изображение';
  }
};

type TPersonalDataProps = {
  user: TUser | null;
};

export const PersonalData = ({ user }: TPersonalDataProps) => {
  const { logOut, setUser } = useAuth();
  const showStudyGroup = !new Role(user?.roles ?? []).isStaff();
  const { message: messageApi, modal } = App.useApp();
  const queryClient = useQueryClient();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

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

  const handleAvatarUpload = async (file: File) => {
    if (!user || isUploadingAvatar) return;
    const error = await getAvatarFileError(file);
    if (error) {
      messageApi.error(error);
      return;
    }
    setIsUploadingAvatar(true);
    try {
      await authApi.updateAvatar(file);
      await queryClient.invalidateQueries({
        queryKey: authQueries.avatar(user.id).queryKey,
      });
      messageApi.success('Фотография сохранена');
    } catch (error) {
      messageApi.error(getAuthErrorMessage(error, 'updateAvatar'));
    } finally {
      setIsUploadingAvatar(false);
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
        getRequestErrorMessage(error, 'Не удалось сохранить изменения'),
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
    if (passwordData.new_password === passwordData.old_password) {
      messageApi.error('Новый пароль должен отличаться от текущего');
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

  const handleLogout = async () => {
    await modal.confirm({
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
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className={styles.avatarSection}>
          <UserAvatar userId={user?.id} />
          <ImgCrop
            beforeCrop={async (file) => !(await getAvatarFileError(file))}
            cropShape="round"
            modalCancel="Отмена"
            modalOk="Сохранить"
            modalProps={{
              modalRender: (content) => <div data-avatar-crop>{content}</div>,
            }}
            modalTitle="Настроить фотографию"
            quality={0.9}
            resetText="Сбросить"
            rotationSlider
            showReset
          >
            <Upload
              accept="image/jpeg,image/png,image/webp"
              beforeUpload={async (file) => {
                await handleAvatarUpload(file);
                return Upload.LIST_IGNORE;
              }}
              disabled={!user || isUploadingAvatar}
              showUploadList={false}
            >
              <button
                className={styles.avatarUpload}
                disabled={!user || isUploadingAvatar}
                type="button"
              >
                <EditIcon />
                {isUploadingAvatar ? 'Загрузка...' : 'Изменить фотографию'}
              </button>
            </Upload>
          </ImgCrop>
        </div>

        <div className={styles.profileSection}>
          <div className={styles.header}>
            <div className={styles.nameWrapper}>
              {isEditingName ? (
                <div className={styles.nameEditContainer}>
                  <div className={styles.nameFieldsRow}>
                    <div className={styles.nameInputWrapper}>
                      <input
                        className={errors.last_name ? styles.inputError : ''}
                        aria-invalid={!!errors.last_name}
                        disabled={isSaving}
                        maxLength={50}
                        name="last_name"
                        placeholder="Фамилия"
                        type="text"
                        value={formData.last_name}
                        onChange={handleInputChange}
                      />
                      {errors.last_name && (
                        <span className={styles.nameErrorText}>
                          {errors.last_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        className={errors.first_name ? styles.inputError : ''}
                        aria-invalid={!!errors.first_name}
                        disabled={isSaving}
                        maxLength={50}
                        name="first_name"
                        placeholder="Имя"
                        type="text"
                        value={formData.first_name}
                        onChange={handleInputChange}
                      />
                      {errors.first_name && (
                        <span className={styles.nameErrorText}>
                          {errors.first_name}
                        </span>
                      )}
                    </div>
                    <div className={styles.nameInputWrapper}>
                      <input
                        className={errors.middle_name ? styles.inputError : ''}
                        aria-invalid={!!errors.middle_name}
                        disabled={isSaving}
                        maxLength={50}
                        name="middle_name"
                        placeholder="Отчество"
                        type="text"
                        value={formData.middle_name}
                        onChange={handleInputChange}
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
                      className={styles.saveNameButton}
                      disabled={isSaving || !hasChanges}
                      type="button"
                      onClick={() => void handleSubmit()}
                    >
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                    <button
                      className={styles.cancelButton}
                      disabled={isSaving}
                      type="button"
                      onClick={handleCancelChanges}
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
                  className={styles.editButton}
                  aria-label="Редактировать имя"
                  disabled={isSaving}
                  type="button"
                  onClick={handleNameEdit}
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
                    aria-invalid={!!errors.study_group}
                    disabled={isSaving}
                    format={formatStudyGroup}
                    id="study_group"
                    name="study_group"
                    parse={parseStudyGroup}
                    placeholder="Введите номер группы"
                    type="text"
                    value={formData.study_group.replace('-', '')}
                    onChange={(value) =>
                      handleFieldChange(
                        'study_group',
                        formatStudyGroup(value).text,
                      )
                    }
                  />
                  <button className={styles.editButton} type="button">
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
                  aria-invalid={!!errors.phone_number}
                  disabled={isSaving}
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={(value) => handleFieldChange('phone_number', value)}
                />
                <button className={styles.editButton} type="button">
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
                  aria-invalid={!!errors.email}
                  disabled={isSaving}
                  id="email"
                  maxLength={64}
                  name="email"
                  placeholder="example@mail.ru"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <button className={styles.editButton} type="button">
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
                  aria-invalid={!!errors.social_media}
                  disabled={isSaving}
                  id="social_media"
                  maxLength={50}
                  name="social_media"
                  placeholder="Ссылка на профиль или @username"
                  type="text"
                  value={formData.social_media}
                  onChange={handleInputChange}
                />
                <button className={styles.editButton} type="button">
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
                  disabled
                  placeholder="*********"
                  style={{ backgroundColor: 'transparent' }}
                  type="password"
                />
              </div>
              <button
                className={styles.changePasswordLink}
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                Сменить пароль?
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              disabled={isSaving || Object.keys(draft).length === 0}
              type="button"
              onClick={handleCancelChanges}
            >
              Отменить изменения
            </button>
            <button
              className={styles.saveButton}
              disabled={isSaving || !hasChanges}
              type="submit"
            >
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
            <button
              className={styles.logoutButton}
              disabled={isSaving}
              type="button"
              onClick={() => void handleLogout()}
            >
              <ExitIcon />
              {isSaving ? 'Сохранение...' : 'Выйти'}
            </button>
          </div>
        </div>
      </form>

      {user && new Role(user.roles).isPsychologist() && (
        <PsychologistAbsences key={user.id} userId={user.id} />
      )}

      <Modal
        cancelText="Отмена"
        confirmLoading={isSavingPassword}
        destroyOnHidden
        okText="Сохранить"
        open={isPasswordModalOpen}
        title="Смена пароля"
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setPasswordData({
            old_password: '',
            new_password: '',
            confirm_password: '',
          });
        }}
        onOk={() => void handlePasswordSubmit()}
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
              autoComplete="current-password"
              maxLength={64}
              placeholder="Введите старый пароль"
              size="large"
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
              autoComplete="new-password"
              maxLength={64}
              placeholder="Введите новый пароль"
              size="large"
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
              autoComplete="new-password"
              maxLength={64}
              placeholder="Повторите новый пароль"
              size="large"
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
