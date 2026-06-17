const RESOURCES_BASE = '/resources';

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
  RESOURCES: RESOURCES_BASE,
  /** Полезные материалы / Статьи */
  RESOURCES_ARTICLES: `${RESOURCES_BASE}?entity=articles`,
  /** Полезные материалы / Тесты */
  RESOURCES_TESTS: `${RESOURCES_BASE}?entity=tests`,
  /** Полезные материалы / Опросы */
  RESOURCES_SURVEYS: `${RESOURCES_BASE}?entity=surveys`,

  /** Статья */
  ARTICLE: '/article',

  /** Тест */
  TEST: '/test',

  /** Опрос */
  SURVEY: '/survey',

  /** FAQ */
  FAQ: '/faq',

  /** Личный кабинет */
  CABINET: '/cabinet',

  /** Запись в личном кабинете */
  CABINET_APPOINTMENT: '/cabinet/appointment',

  /** Карта консультируемого пациента */
  CABINET_MEDICAL_RECORD: '/cabinet/medical-record',
} as const;
