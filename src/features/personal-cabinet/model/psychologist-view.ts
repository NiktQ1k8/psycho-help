import { create } from 'zustand';
import type { ApplicationStatus } from '@/entities/application/types';
import type { AppointmentStatus } from '@/entities/appointment/types';
import dayjs from '@/shared/lib/dayjs';

export type SortDirection = 'asc' | 'desc';
export type ApplicationStatusFilter = 'all' | ApplicationStatus | 'closed';
export type AppointmentStatusFilter = 'all' | AppointmentStatus;
export type FormatFilter = 'all' | 'offline' | 'online';
export type ActiveTab = 'applications' | 'appointments';

interface BaseFilters {
  currentPage: number;
  sortDirection: SortDirection;
  formatFilter: FormatFilter;
  searchQuery: string;
  dateRange: [string, string] | null;
}

interface TabFilters<TStatus> extends BaseFilters {
  statusFilter: TStatus;
}

interface ViewState {
  applicationFilters: TabFilters<ApplicationStatusFilter>;
  appointmentFilters: TabFilters<AppointmentStatusFilter>;
  setCurrentPage: (tab: ActiveTab, page: number) => void;
  setSortDirection: (tab: ActiveTab, dir: SortDirection) => void;
  setStatusFilter: (tab: ActiveTab, filter: string) => void;
  setFormatFilter: (tab: ActiveTab, filter: FormatFilter) => void;
  setSearchQuery: (tab: ActiveTab, query: string) => void;
  setDateRange: (tab: ActiveTab, range: [string, string] | null) => void;
  resetFilters: (tab: ActiveTab) => void;
}

export const getDefaultAppointmentDateRange = (): [string, string] => [
  dayjs.tz().startOf('day').toISOString(),
  dayjs.tz().add(1, 'month').startOf('day').toISOString(),
];

const getDefaultFilters = (): BaseFilters => ({
  currentPage: 1,
  sortDirection: 'asc' as const,
  formatFilter: 'all' as const,
  searchQuery: '',
  dateRange: null,
});

const getDefaultAppointmentFilters = (): BaseFilters => ({
  currentPage: 1,
  sortDirection: 'asc' as const,
  formatFilter: 'all' as const,
  searchQuery: '',
  dateRange: getDefaultAppointmentDateRange(),
});

const filtersKey = (
  tab: ActiveTab,
): 'applicationFilters' | 'appointmentFilters' =>
  tab === 'applications' ? 'applicationFilters' : 'appointmentFilters';

export const usePsychologistView = create<ViewState>((set, get) => {
  const updateFilter = (tab: ActiveTab, patch: Record<string, unknown>) => {
    const key = filtersKey(tab);
    set({ [key]: { ...get()[key], ...patch } });
  };

  return {
    applicationFilters: {
      ...getDefaultFilters(),
      statusFilter: 'all' as ApplicationStatusFilter,
    },
    appointmentFilters: {
      ...getDefaultAppointmentFilters(),
      statusFilter: 'all' as AppointmentStatusFilter,
    },

    setCurrentPage: (tab, page) => updateFilter(tab, { currentPage: page }),
    setSortDirection: (tab, dir) =>
      updateFilter(tab, { sortDirection: dir, currentPage: 1 }),
    setStatusFilter: (tab, filter) =>
      updateFilter(tab, { statusFilter: filter, currentPage: 1 }),
    setFormatFilter: (tab, filter) =>
      updateFilter(tab, { formatFilter: filter, currentPage: 1 }),
    setSearchQuery: (tab, query) =>
      updateFilter(tab, { searchQuery: query, currentPage: 1 }),
    setDateRange: (tab, range) =>
      updateFilter(tab, { dateRange: range, currentPage: 1 }),

    resetFilters: (tab) => {
      const key = filtersKey(tab);
      const defaultWithoutStatus = getDefaultFilters();
      const statusFilter =
        tab === 'applications'
          ? ('all' as ApplicationStatusFilter)
          : ('all' as AppointmentStatusFilter);
      set({
        [key]: {
          ...defaultWithoutStatus,
          statusFilter,
        },
      });
    },
  };
});
