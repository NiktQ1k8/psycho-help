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
        <UserAvatar size="small" userId={user?.id} />
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
              className={clsx(styles.navItem, isActive && styles.active)}
              aria-current={isActive ? 'page' : undefined}
              key={tab.id}
              to={`${SLUG.CABINET}?tab=${tab.id}`}
            >
              <span className={styles.navLabel}>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
