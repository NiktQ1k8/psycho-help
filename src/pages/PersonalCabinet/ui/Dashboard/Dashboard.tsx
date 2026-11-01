import type { TRoleCode } from '@/entities/role/types';
import { PsychologistDashboard } from './components/PsychologistDashboard/PsychologistDashboard';
import { UserDashboard } from './components/UserDashboard/UserDashboard';

interface IDashboardProps {
  userName: string;
  role: TRoleCode;
}

export const Dashboard = ({ userName, role }: IDashboardProps) => {
  switch (role) {
    case 'psychologist':
    case 'admin':
    case 'content_manager':
      return <PsychologistDashboard />;
    case 'user':
    default:
      return <UserDashboard userName={userName} />;
  }
};
