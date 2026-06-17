export const optionalSessionStorage = {
  getItem(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Черновики остаются в памяти до перезагрузки страницы.
    }
  },

  removeItem(key: string) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Хранилище может быть заблокировано браузером.
    }
  },
};
