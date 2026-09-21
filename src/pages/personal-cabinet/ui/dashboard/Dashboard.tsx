import type { FC } from 'react';
import type { RoleCode } from '@/entities/role/types';
import AdminDashboard from './AdminDashboard';
import PsychologistDashboard from './PsychologistDashboard';
import UserDashboard from './UserDashboard';

interface DashboardProps {
  userName: string;
  role: RoleCode;
  onBookClick?: () => void;
}

const Dashboard: FC<DashboardProps> = ({ userName, role, onBookClick }) => {
  switch (role) {
    case 'psychologist':
      return <PsychologistDashboard onBookClick={onBookClick} />;
    case 'admin':
    case 'content_manager':
      return <AdminDashboard />;
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
