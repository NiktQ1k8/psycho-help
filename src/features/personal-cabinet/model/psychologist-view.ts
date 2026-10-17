import type { DateTime } from 'luxon';
import { create } from 'zustand';
import type { TApplicationStatus } from '@/entities/application/types';
import type { TAppointmentStatus } from '@/entities/appointment/types';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';

export type TSortDirection = 'asc' | 'desc';
export type TApplicationStatusFilter =
  'all' | Exclude<TApplicationStatus, 'completed'> | 'closed';
export type TAppointmentStatusFilter = 'all' | TAppointmentStatus;
export type TFormatFilter = 'all' | 'offline' | 'online';
export type TActiveTab = 'applications' | 'appointments';

interface IBaseFilters {
  currentPage: number;
  sortDirection: TSortDirection;
  formatFilter: TFormatFilter;
  searchQuery: string;
  dateRange: [string, string] | null;
}

interface ITabFilters<TStatus> extends IBaseFilters {
  statusFilter: TStatus;
}

interface IViewState {
  dashboardDate: DateTime | null;
  setDashboardDate: (date: DateTime) => void;
  applicationFilters: ITabFilters<TApplicationStatusFilter>;
  appointmentFilters: ITabFilters<TAppointmentStatusFilter>;
  medicalRecordFilters: { searchQuery: string; currentPage: number };
  setMedicalRecordSearch: (query: string) => void;
  setMedicalRecordPage: (page: number) => void;
  setCurrentPage: (tab: TActiveTab, page: number) => void;
  setSortDirection: (tab: TActiveTab, dir: TSortDirection) => void;
  setStatusFilter: (tab: TActiveTab, filter: string) => void;
  setFormatFilter: (tab: TActiveTab, filter: TFormatFilter) => void;
  setSearchQuery: (tab: TActiveTab, query: string) => void;
  setDateRange: (tab: TActiveTab, range: [string, string] | null) => void;
  resetFilters: (tab: TActiveTab) => void;
  resetView: () => void;
}

export const getDefaultAppointmentDateRange = (): [string, string] => [
  toApiDate(moscowDate().startOf('day')),
  toApiDate(moscowDate().plus({ months: 1 }).startOf('day')),
];

const getDefaultFilters = (): IBaseFilters => ({
  currentPage: 1,
  sortDirection: 'asc',
  formatFilter: 'all',
  searchQuery: '',
  dateRange: null,
});

const getDefaultView = () => ({
  dashboardDate: null,
  medicalRecordFilters: { searchQuery: '', currentPage: 1 },
  applicationFilters: {
    ...getDefaultFilters(),
    statusFilter: 'all' as TApplicationStatusFilter,
  },
  appointmentFilters: {
    ...getDefaultFilters(),
    dateRange: getDefaultAppointmentDateRange(),
    statusFilter: 'all' as TAppointmentStatusFilter,
  },
});

const filtersKey = (
  tab: TActiveTab,
): 'applicationFilters' | 'appointmentFilters' =>
  tab === 'applications' ? 'applicationFilters' : 'appointmentFilters';

export const usePsychologistView = create<IViewState>((set, get) => {
  const updateFilter = (tab: TActiveTab, patch: Record<string, unknown>) => {
    const key = filtersKey(tab);
    set({ [key]: { ...get()[key], ...patch } });
  };

  return {
    ...getDefaultView(),
    setDashboardDate: (date) => set({ dashboardDate: date }),
    resetView: () => set(getDefaultView()),
    setMedicalRecordSearch: (searchQuery) =>
      set({ medicalRecordFilters: { searchQuery, currentPage: 1 } }),
    setMedicalRecordPage: (currentPage) =>
      set({
        medicalRecordFilters: { ...get().medicalRecordFilters, currentPage },
      }),

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

    resetFilters: (tab) =>
      set({
        [filtersKey(tab)]: { ...getDefaultFilters(), statusFilter: 'all' },
      }),
  };
});
