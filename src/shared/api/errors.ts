import { isAxiosError } from 'axios';

export const getErrorMessage = (
  error: unknown,
  fallback = 'Не удалось выполнить запрос',
): string => {
  if (isAxiosError<{ detail?: unknown }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item: unknown) =>
          item &&
          typeof item === 'object' &&
          'msg' in item &&
          typeof item.msg === 'string'
            ? item.msg
            : '',
        )
        .filter(Boolean);
      if (messages.length) return messages.join(', ');
    }
    if (detail && typeof detail === 'object' && 'errors' in detail) {
      const errors = detail.errors;
      if (errors && typeof errors === 'object') {
        const messages = Object.values(errors)
          .flat()
          .filter((value): value is string => typeof value === 'string');
        if (messages.length) return messages.join(', ');
      }
    }
    if (error.response && error.response.status >= 500) {
      return 'Ошибка сервера. Попробуйте позже';
    }
    if (error.response?.status === 429)
      return 'Слишком много запросов. Попробуйте позже';
    if (!error.response) return 'Не удалось подключиться к серверу';
  }
  return error instanceof Error && error.message ? error.message : fallback;
};
