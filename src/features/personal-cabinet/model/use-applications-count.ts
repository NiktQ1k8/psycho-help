import { useQuery } from '@tanstack/react-query';
import { applicationQueries } from '@/entities/application/api';
import type { TUser } from '@/entities/auth/types';
import { Role } from '@/entities/role/helpers';

export const useApplicationsCount = (user: TUser | null) => {
  const { data: applications = [] } = useQuery({
    ...applicationQueries.list(),
    enabled: !!user && new Role(user.roles).isStaff(),
  });

  return applications.filter(
    (application) =>
      application.status === 'new' ||
      ((application.status === 'in_progress' ||
        application.status === 'awaiting_user_confirmation') &&
        application.psychologist?.user?.id === user?.id),
  ).length;
};
