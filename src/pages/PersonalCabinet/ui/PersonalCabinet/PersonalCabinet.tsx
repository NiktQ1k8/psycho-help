import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/entities/auth/model/useAuth';
import { Role } from '@/entities/role/helpers';
import type { TRoleCode } from '@/entities/role/types';
import { Sidebar } from '@/features/personal-cabinet/ui/Sidebar/Sidebar';
import Loader from '@/shared/ui/loader/loader';
import { getDefaultTabForRole, getTabsForRole } from '../../config/tabs';
import styles from './PersonalCabinet.module.scss';

export const PersonalCabinet = () => {
  const authUser = useAuth((state) => state.user);
  const [searchParams] = useSearchParams();

  const primaryRoleCode = useMemo<TRoleCode>(() => {
    if (!authUser?.roles || authUser.roles.length === 0) {
      return 'user';
    }
    const roleHelper = new Role(authUser.roles);
    if (roleHelper.isAdmin()) return 'admin';
    if (roleHelper.isPsychologist()) return 'psychologist';
    if (roleHelper.isContentManager()) return 'content_manager';
    return 'user';
  }, [authUser?.roles]);

  const tabs = useMemo(
    () => getTabsForRole(primaryRoleCode),
    [primaryRoleCode],
  );

  const defaultTab = getDefaultTabForRole(primaryRoleCode);
  const activeTab =
    tabs.find((tab) => tab.id === searchParams.get('tab'))?.id ?? defaultTab;

  const activeTabConfig = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [tabs, activeTab]);

  if (!authUser) {
    return <Loader />;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.sidebarWrapper}>
        <Sidebar user={authUser} activeTab={activeTab} tabs={tabs} />
      </div>

      <main className={styles.mainContent}>
        {activeTabConfig?.render({
          user: authUser,
          primaryRoleCode,
        })}
      </main>
    </div>
  );
};
