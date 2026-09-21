import type { FC } from 'react';
import type { User } from '@/entities/auth/types';
import type { RoleCode } from '@/entities/role/types';
import AppointmentForm from '@/features/personal-cabinet/ui/input-block/AppointmentForm';
import PersonalData from '@/features/personal-cabinet/ui/personal-data/PersonalData';
import PsychologistApplications from '@/pages/personal-cabinet/ui/applications/PsychologistApplications';
import PsychologistAppointments from '@/pages/personal-cabinet/ui/appointments/PsychologistAppointments';
import ComingSoon from '../ui/PlaceholderComponent';
import Dashboard from '../ui/dashboard/Dashboard';

export type TabId =
  | 'main'
  | 'applications'
  | 'userAppointments'
  | 'psychologistAppointments'
  | 'profile';
// потом админа и контент-менеджера добавим, сейчас даже не понятно, какие табы у них будут

export interface TabRenderProps {
  user: User;
  primaryRoleCode: RoleCode;
  onBookClick: () => void;
}

export interface TabConfig {
  id: TabId;
  label: string;
  render: FC<TabRenderProps>;
}

export const roleBasedTabs: Record<string, TabConfig[]> = {
  user: [
    {
      id: 'main',
      label: 'Главная',
      render: ({ user, primaryRoleCode, onBookClick }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
          onBookClick={onBookClick}
        />
      ),
    },
    {
      id: 'userAppointments',
      label: 'Запись на сессию',
      render: () => <AppointmentForm />,
    },
    {
      id: 'profile',
      label: 'Профиль',
      render: ({ user }) => <PersonalData user={user} />,
    },
  ],
  psychologist: [
    {
      id: 'main',
      label: 'Главная',
      render: ({ user, primaryRoleCode, onBookClick }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
          onBookClick={onBookClick}
        />
      ),
    },
    {
      id: 'applications',
      label: 'Заявки',
      render: () => <PsychologistApplications />,
    },
    {
      id: 'psychologistAppointments',
      label: 'Записи',
      render: () => <PsychologistAppointments />,
    },
    {
      id: 'profile',
      label: 'Профиль',
      render: ({ user }) => <PersonalData user={user} />,
    },
  ],
  admin: [
    {
      id: 'main',
      label: 'Главная',
      render: ({ user, primaryRoleCode, onBookClick }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
          onBookClick={onBookClick}
        />
      ),
    },
    {
      id: 'psychologistAppointments',
      label: 'Записи',
      render: () => <ComingSoon title="Администрирование" />,
    },
    {
      id: 'profile',
      label: 'Профиль',
      render: ({ user }) => <PersonalData user={user} />,
    },
  ],
  content_manager: [
    {
      id: 'main',
      label: 'Главная',
      render: ({ user, primaryRoleCode, onBookClick }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
          onBookClick={onBookClick}
        />
      ),
    },
    {
      id: 'profile',
      label: 'Профиль',
      render: ({ user }) => <PersonalData user={user} />,
    },
  ],
};

export const defaultTabForRole: Record<string, TabId> = {
  user: 'main',
  psychologist: 'main',
  admin: 'main',
  content_manager: 'main',
};

export function getTabsForRole(roleCode: string): TabConfig[] {
  return roleBasedTabs[roleCode] || roleBasedTabs.user;
}

export function getDefaultTabForRole(roleCode: string): TabId {
  return defaultTabForRole[roleCode] || 'main';
}
