import { type FC, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { applicationQueries } from '@/entities/application/api';
import { useAuth } from '@/entities/auth/model/useAuth';
import { Role } from '@/entities/role/helpers';
import type { TRoleCode } from '@/entities/role/types';
import Sidebar from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import type { TTabBadge } from '@/features/personal-cabinet/ui/sidebar/Sidebar';
import { SLUG } from '@/shared/config/slug';
import Loader from '@/shared/ui/loader/loader';
import { getDefaultTabForRole, getTabsForRole } from './config/tabs';
import styles from './personal-cabinet.module.scss';

const PersonalCabinet: FC = () => {
  const authUser = useAuth((state) => state.user);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const isStaff = new Role(authUser?.roles ?? []).isStaff();

  const { data: applications = [] } = useQuery({
    ...applicationQueries.list(),
    enabled: isStaff,
  });

  const activeApplicationsCount = useMemo(
    () =>
      applications.filter(
        (a) =>
          a.status === 'new' ||
          (a.status === 'in_progress' &&
            a.assigned_to_user?.id === authUser?.id),
      ).length,
    [applications, authUser?.id],
  );

  const tabBadges = useMemo<TTabBadge[]>(() => {
    const badges: TTabBadge[] = [];

    if (isStaff && activeApplicationsCount > 0) {
      badges.push({
        tabId: 'applications',
        content: (isActive) => (
          <span
            className={clsx(
              styles.countBage,
              isActive && styles.countBageActive,
            )}
          >
            {activeApplicationsCount}
          </span>
        ),
      });
    }

    return badges;
  }, [isStaff, activeApplicationsCount]);

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
        <Sidebar
          user={authUser}
          activeTab={activeTab}
          tabs={tabs}
          tabBadges={tabBadges}
        />
      </div>

      <main className={styles.mainContent}>
        {activeTabConfig?.render({
          user: authUser,
          primaryRoleCode,
          onBookClick: () => navigate(`${SLUG.CABINET}?tab=userAppointments`),
        })}
      </main>
    </div>
  );
};

export default PersonalCabinet;
