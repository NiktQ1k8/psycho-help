import React, { type KeyboardEvent, useRef, useState } from 'react';
import clsx from 'clsx';
import styles from './Tabs.module.scss';
import { type ITabItemProps, TabItem } from './components/tab-item';

export interface ITab extends Omit<ITabItemProps, 'isActive' | 'tabRef'> {
  content: React.ReactNode;
}

export interface ITabsProps {
  tabs: ITab[];
  defaultActiveTab?: string;
  fullWidth?: boolean;
  onChange?: (tabId: string) => void;
  className?: string;
  contentClassName?: string;
}

export const Tabs: React.FC<ITabsProps> = ({
  tabs,
  defaultActiveTab,
  fullWidth = false,
  onChange,
  className = '',
  contentClassName,
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    defaultActiveTab || tabs[0]?.id || '',
  );
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const handleTabClick = (tabId: string, disabled?: boolean) => {
    if (disabled) return;
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    tabId: string,
  ) => {
    const enabledTabs = tabs.filter((tab) => !tab.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(
      (tab) => tab.id === tabId,
    );

    let nextTab: ITab | undefined;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextTab = enabledTabs[(currentEnabledIndex + 1) % enabledTabs.length];
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextTab =
          enabledTabs[
            (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length
          ];
        break;
      case 'Home':
        e.preventDefault();
        nextTab = enabledTabs[0];
        break;
      case 'End':
        e.preventDefault();
        nextTab = enabledTabs[enabledTabs.length - 1];
        break;
      default:
        return;
    }

    if (nextTab) {
      setActiveTab(nextTab.id);
      onChange?.(nextTab.id);
      tabRefs.current.get(nextTab.id)?.focus();
    }
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={clsx(styles.tabsContainer, className)}>
      <div
        className={clsx(styles.tabList, { [styles.fullWidth]: fullWidth })}
        aria-label="Вкладки"
        role="tablist"
      >
        {tabs.map((tab) => (
          <TabItem
            disabled={tab.disabled}
            id={tab.id}
            isActive={activeTab === tab.id}
            key={tab.id}
            label={tab.label}
            tabRef={(el) => {
              if (el) {
                tabRefs.current.set(tab.id, el);
              } else {
                tabRefs.current.delete(tab.id);
              }
            }}
            onClick={handleTabClick}
            onKeyDown={handleKeyDown}
          />
        ))}
      </div>

      <div
        className={clsx(styles.tabPanel, contentClassName)}
        aria-labelledby={`tab-${activeTab}`}
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeTabContent}
      </div>
    </div>
  );
};
