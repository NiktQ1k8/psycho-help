import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { TUser } from '@/entities/auth/types';
import { useApplicationsCount } from '@/features/personal-cabinet/model/use-applications-count';
import { SLUG } from '@/shared/config/slug';
import styles from './sidebar.module.scss';

export type TTabConfig = {
  id: string;
  label: string;
};

type TSidebarProps = {
  user: TUser | null;
  activeTab: string;
  tabs: TTabConfig[];
};

const Sidebar: FC<TSidebarProps> = ({ user, activeTab, tabs }) => {
  const applicationsCount = useApplicationsCount(user);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.profileInfo}>
        <div className={styles.avatar}>
          <UserOutlined />
        </div>
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
              {tab.id === 'applications' && applicationsCount > 0 && (
                <span
                  className={clsx(
                    styles.countBadge,
                    isActive && styles.countBadgeActive,
                  )}
                >
                  {applicationsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      {/* TODO: Добавить кнопку "Задать вопрос" */}
    </aside>
  );
};

export default Sidebar;
