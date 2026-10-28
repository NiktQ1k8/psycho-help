import { useQuery } from '@tanstack/react-query';
import { applicationQueries } from '@/entities/application/api';
import type { TUser } from '@/entities/auth/types';
import { Role } from '@/entities/role/helpers';

export const useApplicationsCount = (user: TUser | null) => {
  const { data: applications = [] } = useQuery({
    ...applicationQueries.list({ status: 'new' }),
    enabled: !!user && new Role(user.roles).isStaff(),
  });

  return applications.length;
};
