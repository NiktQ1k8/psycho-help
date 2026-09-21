import type { FC, ReactNode } from 'react';
import { UserOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { User } from '@/entities/auth';
import styles from './sidebar.module.scss';

export interface TabConfig {
  id: string;
  label: string;
}

export interface TabBadge {
  tabId: string;
  content: (isActive: boolean) => ReactNode;
}

interface SidebarProps {
  user: User | null;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  tabs: TabConfig[];
  tabBadges?: TabBadge[];
}

const Sidebar: FC<SidebarProps> = ({
  user,
  activeTab,
  onChangeTab,
  tabs,
  tabBadges,
}) => {
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
            <button
              key={tab.id}
              className={clsx(styles.navItem, isActive && styles.active)}
              onClick={() => onChangeTab(tab.id)}
            >
              <span className={styles.navLabel}>{tab.label}</span>
              {badgeContent && <>{badgeContent(isActive)}</>}
            </button>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button className={styles.askButton}>Задать вопрос</button>
      </div>
    </aside>
  );
};

export default Sidebar;
