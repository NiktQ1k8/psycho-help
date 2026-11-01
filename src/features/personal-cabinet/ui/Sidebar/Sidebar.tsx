import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { TUser } from '@/entities/auth/types';
import { UserAvatar } from '@/entities/auth/ui/UserAvatar';
import { SLUG } from '@/shared/config/slug';
import styles from './Sidebar.module.scss';

export type TTabConfig = {
  id: string;
  label: string;
};

type TSidebarProps = {
  user: TUser | null;
  activeTab: string;
  tabs: TTabConfig[];
};

export const Sidebar = ({ user, activeTab, tabs }: TSidebarProps) => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileInfo}>
        <UserAvatar userId={user?.id} size="small" />
        <div className={styles.name}>
          {user
            ? `${user.last_name} ${user.first_name} ${user.middle_name || ''}`
            : 'Имя пользователя'}
        </div>
      </div>
      <nav className={styles.nav}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              className={clsx(styles.navItem, isActive && styles.active)}
              to={`${SLUG.CABINET}?tab=${tab.id}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
