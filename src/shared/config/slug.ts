export const SLUG = {
  /** Главная страница */
  MAIN: '/',

  /** Выход */
  LOGOUT: '/logout',

  /** Восстановление пароля по ссылке из письма */
  RESET_PASSWORD: '/reset-password',

  /** Психологи */
  THERAPISTS: '/therapists',

  /** Новости */
  NEWS: '/news',

  /** Полезные материалы */
  RESOURCES: '/resources',

  /** Статья */
  ARTICLE: '/article',

  /** Тест */
  TEST: '/test',

  /** FAQ */
  FAQ: '/faq',

  /** Личный кабинет */
  CABINET: '/cabinet',

  /** Запись в личном кабинете */
  CABINET_APPOINTMENT: '/cabinet/appointment',

  /** Карта консультируемого пациента */
  CABINET_MEDICAL_RECORD: '/cabinet/medical-record',
} as const;
