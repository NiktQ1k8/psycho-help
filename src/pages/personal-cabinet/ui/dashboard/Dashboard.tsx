import type { FC } from 'react';
import type { TRoleCode } from '@/entities/role/types';
import PsychologistDashboard from './PsychologistDashboard';
import UserDashboard from './UserDashboard';

interface IDashboardProps {
  userName: string;
  role: TRoleCode;
  onBookClick?: () => void;
}

const Dashboard: FC<IDashboardProps> = ({ userName, role, onBookClick }) => {
  switch (role) {
    case 'psychologist':
    case 'admin':
    case 'content_manager':
      return <PsychologistDashboard />;
    case 'user':
    default:
      return (
        <UserDashboard
          userName={userName}
          onBookClick={onBookClick || (() => {})}
        />
      );
  }
};

export default Dashboard;
