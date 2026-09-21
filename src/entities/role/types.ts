// Источник данных: https://github.com/nikitabel0/mospoly-psychological-support/blob/main/psychohelp/constants/rbac.py
export type RoleCode = 'user' | 'psychologist' | 'admin' | 'content_manager';

// Источник данных: https://github.com/nikitabel0/mospoly-psychological-support/tree/main/alembic/versions
export type Role =
  | {
      code: 'user';
      name: 'Пользователь';
      description: 'Студент или преподаватель - обычный пользователь системы';
    }
  | {
      code: 'psychologist';
      name: 'Психолог';
      description: 'Психолог, проводящий консультации';
    }
  | {
      code: 'admin';
      name: 'Администратор';
      description: 'Администратор системы';
    }
  | {
      code: 'content_manager';
      name: 'Контент-менеджер';
      description: 'Управление контентом сайта';
    };
