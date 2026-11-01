import type { ReactNode } from 'react';
import type { TUser } from '@/entities/auth/types';
import type { TRoleCode } from '@/entities/role/types';
import { AppointmentForm } from '@/features/personal-cabinet/ui/AppointmentForm/AppointmentForm';
import { PersonalData } from '@/features/personal-cabinet/ui/PersonalData/PersonalData';
import { MedicalRecords } from '@/pages/PersonalCabinet/ui/MedicalRecords/MedicalRecords';
import { PsychologistAppointments } from '@/pages/PersonalCabinet/ui/PsychologistAppointments/PsychologistAppointments';
import { Dashboard } from '../ui/Dashboard/Dashboard';

export type TTabId =
  | 'main'
  | 'userAppointments'
  | 'psychologistAppointments'
  | 'medicalRecords'
  | 'profile';

export interface ITabRenderProps {
  user: TUser;
  primaryRoleCode: TRoleCode;
}

export interface ITabConfig {
  id: TTabId;
  label: string;
  render: (props: ITabRenderProps) => ReactNode;
}

export const roleBasedTabs: Record<string, ITabConfig[]> = {
  user: [
    {
      id: 'main',
      label: 'Главная',
      render: ({ user, primaryRoleCode }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
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
      render: ({ user, primaryRoleCode }) => (
        <Dashboard
          userName={user.first_name || 'Пользователь'}
          role={primaryRoleCode}
        />
      ),
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
    {
      id: 'medicalRecords',
      label: 'Карты консультируемых',
      render: () => <MedicalRecords />,
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
  // Временно общий кабинет для психолога, администратора и контент-менеджера.
  const tabRole =
    roleCode === 'admin' || roleCode === 'content_manager'
      ? 'psychologist'
      : roleCode;
  return roleBasedTabs[tabRole] || roleBasedTabs.user;
}

export function getDefaultTabForRole(roleCode: string): TTabId {
  return defaultTabForRole[roleCode] || 'main';
}
