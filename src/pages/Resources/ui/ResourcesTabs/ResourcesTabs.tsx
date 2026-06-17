import { type ReactNode, useId } from 'react';
import { Link } from 'react-router-dom';
import styles from './ResourcesTabs.module.scss';

export interface ITab {
  id: string;
  label: string;
  to: string;
  content: ReactNode;
}

interface IResourcesTabsProps {
  tabs: ITab[];
  activeTabId: string;
}

export const ResourcesTabs = ({ tabs, activeTabId }: IResourcesTabsProps) => {
  const groupId = useId();
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  return (
    <div className={styles.tabsContainer}>
      <nav className={styles.tabList} aria-label="Тип материалов">
        {tabs.map((tab) => (
          <Link
            className={styles.tab}
            aria-current={activeTabId === tab.id ? 'page' : undefined}
            id={`${groupId}-${tab.id}`}
            key={tab.id}
            to={tab.to}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section
        aria-labelledby={activeTab ? `${groupId}-${activeTab.id}` : undefined}
      >
        {activeTab?.content}
      </section>
    </div>
  );
};
