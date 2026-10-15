import type { FC, ReactNode } from 'react';
import { UserOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { TUser } from '@/entities/auth/types';
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
  onChangeTab: (tab: string) => void;
  tabs: TTabConfig[];
  tabBadges?: TTabBadge[];
};

const Sidebar: FC<TSidebarProps> = ({
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
      {/* TODO: Добавить кнопку "Задать вопрос" */}
    </aside>
  );
};

export default Sidebar;
