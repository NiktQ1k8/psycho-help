import type { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { UserOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { TUser } from '@/entities/auth/types';
import { SLUG } from '@/shared/config/slug';
import styles from './sidebar.module.scss';

export type TTabConfig = {
  id: string;
  label: string;
};

export type TTabBadge = {
  tabId: string;
  content: (isActive: boolean) => ReactNode;
};

type TSidebarProps = {
  user: TUser | null;
  activeTab: string;
  tabs: TTabConfig[];
  tabBadges?: TTabBadge[];
};

const Sidebar: FC<TSidebarProps> = ({ user, activeTab, tabs, tabBadges }) => {
  const getBadgeForTab = (tabId: string) => {
    return tabBadges?.find((b) => b.tabId === tabId)?.content;
  };

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
          const badgeContent = getBadgeForTab(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              className={clsx(styles.navItem, isActive && styles.active)}
              to={`${SLUG.CABINET}?tab=${tab.id}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className={styles.navLabel}>{tab.label}</span>
              {badgeContent && <>{badgeContent(isActive)}</>}
            </Link>
          );
        })}
      </nav>
      {/* TODO: Добавить кнопку "Задать вопрос" */}
    </aside>
  );
};

export default Sidebar;
