import { isAxiosError } from 'axios';

type TAuthAction =
  | 'login'
  | 'registration'
  | 'requestPasswordReset'
  | 'resetPassword'
  | 'changePassword'
  | 'updateAvatar'
  | 'logout';
type TValidationError = {
  loc?: (string | number)[];
  type?: string;
  msg?: string;
  ctx?: { min_length?: number; max_length?: number };
};

const actionMessages: Record<TAuthAction, string> = {
  login: 'Не удалось войти в аккаунт',
  registration: 'Не удалось зарегистрироваться',
  requestPasswordReset: 'Не удалось отправить письмо для восстановления пароля',
  resetPassword: 'Не удалось восстановить пароль',
  changePassword: 'Не удалось изменить пароль',
  updateAvatar: 'Не удалось сохранить фотографию',
  logout: 'Не удалось выйти из аккаунта',
};

const fieldNames: Record<string, string> = {
  first_name: 'Имя',
  last_name: 'Фамилия',
  middle_name: 'Отчество',
  email: 'Почта',
  phone_number: 'Телефон',
  password: 'Пароль',
  old_password: 'Текущий пароль',
  new_password: 'Новый пароль',
  token: 'Ссылка восстановления',
};

export const getAuthErrorMessage = (
  error: unknown,
  action: TAuthAction,
): string => {
  const fallback = actionMessages[action];
  if (!isAxiosError<{ detail?: string | TValidationError[] }>(error))
    return fallback;
  if (!error.response)
    return 'Не удалось связаться с сервером. Проверьте подключение и попробуйте снова';
  const { status, data } = error.response;
  if (status === 429)
    return 'Слишком много попыток. Подождите немного и попробуйте снова';
  if (status >= 500) return `${fallback}. Ошибка сервера — попробуйте позже`;
  if (status === 401)
    return action === 'login'
      ? 'Неверная почта или пароль'
      : 'Сессия истекла. Войдите в аккаунт и повторите действие';
  if (status === 403) return 'Недостаточно прав для этого действия';
  if (action === 'updateAvatar') {
    if (status === 400)
      return 'Файл повреждён или имеет неподдерживаемый формат. Выберите изображение JPEG, PNG или WebP';
    if (status === 413) return 'Размер фотографии не должен превышать 10 МБ';
  }

  const detail = data?.detail;
  if (typeof detail === 'string' && /[а-яё]/i.test(detail)) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map(({ loc, type, ctx, msg }) => {
      if (msg && /[а-яё]/i.test(msg)) return msg.replace(/^Value error, /, '');
      const field = String(loc?.at(-1) ?? '');
      const label = fieldNames[field];
      if (!label) return 'Проверьте заполненные поля';
      if (type === 'missing') return `${label}: обязательное поле`;
      if (ctx?.min_length)
        return `${label}: не менее ${ctx.min_length} символов`;
      if (ctx?.max_length)
        return `${label}: не более ${ctx.max_length} символов`;
      if (field === 'email')
        return 'Введите корректный адрес электронной почты';
      if (field === 'phone_number')
        return 'Введите корректный номер телефона с кодом страны';
      if (field === 'token')
        return 'Ссылка восстановления некорректна. Запросите новое письмо';
      return `${label}: проверьте значение`;
    });
    if (messages.length) return [...new Set(messages)].join('. ');
  }
  return `${fallback}. Попробуйте ещё раз`;
};
