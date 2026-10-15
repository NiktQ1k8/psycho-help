import type { FC } from 'react';
import type { TUser } from '@/entities/auth/types';
import type { TRoleCode } from '@/entities/role/types';
import AppointmentForm from '@/features/personal-cabinet/ui/input-block/AppointmentForm';
import PersonalData from '@/features/personal-cabinet/ui/personal-data/PersonalData';
import PsychologistApplications from '@/pages/personal-cabinet/ui/applications/PsychologistApplications';
import PsychologistAppointments from '@/pages/personal-cabinet/ui/appointments/PsychologistAppointments';
import ComingSoon from '../ui/PlaceholderComponent';
import Dashboard from '../ui/dashboard/Dashboard';

export type TTabId =
  | 'main'
  | 'applications'
  | 'userAppointments'
  | 'psychologistAppointments'
  | 'profile';
// потом админа и контент-менеджера добавим, сейчас даже не понятно, какие табы у них будут

export interface ITabRenderProps {
  user: TUser;
  primaryRoleCode: TRoleCode;
  onBookClick: () => void;
}

export interface ITabConfig {
  id: TTabId;
  label: string;
  render: FC<ITabRenderProps>;
}

export const roleBasedTabs: Record<string, ITabConfig[]> = {
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

export const defaultTabForRole: Record<string, TTabId> = {
  user: 'main',
  psychologist: 'main',
  admin: 'main',
  content_manager: 'main',
};

export function getTabsForRole(roleCode: string): ITabConfig[] {
  return roleBasedTabs[roleCode] || roleBasedTabs.user;
}

export function getDefaultTabForRole(roleCode: string): TTabId {
  return defaultTabForRole[roleCode] || 'main';
}
