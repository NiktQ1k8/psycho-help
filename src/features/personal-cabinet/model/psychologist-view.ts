import type { DateTime } from 'luxon';
import { create } from 'zustand';
import type { TAppointmentStatus } from '@/entities/appointment/types';
import { moscowDate, toApiDate } from '@/shared/lib/date-time';

export type TSortDirection = 'asc' | 'desc';
export type TAppointmentStatusFilter = 'all' | TAppointmentStatus;
export type TFormatFilter = 'all' | 'offline' | 'online';

interface IAppointmentFilters {
  currentPage: number;
  sortDirection: TSortDirection;
  formatFilter: TFormatFilter;
  searchQuery: string;
  dateRange: [string, string] | null;
  statusFilter: TAppointmentStatusFilter;
}

interface IViewState {
  dashboardDate: DateTime | null;
  setDashboardDate: (date: DateTime) => void;
  appointmentFilters: IAppointmentFilters;
  medicalRecordFilters: { searchQuery: string; currentPage: number };
  setMedicalRecordSearch: (query: string) => void;
  setMedicalRecordPage: (page: number) => void;
  setCurrentPage: (page: number) => void;
  setSortDirection: (dir: TSortDirection) => void;
  setStatusFilter: (filter: TAppointmentStatusFilter) => void;
  setFormatFilter: (filter: TFormatFilter) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (range: [string, string] | null) => void;
  resetFilters: () => void;
  resetView: () => void;
}

export const getDefaultAppointmentDateRange = (): [string, string] => [
  toApiDate(moscowDate().startOf('day')),
  toApiDate(moscowDate().plus({ months: 1 }).startOf('day')),
];

const getDefaultFilters = (): IAppointmentFilters => ({
  currentPage: 1,
  sortDirection: 'asc',
  formatFilter: 'all',
  searchQuery: '',
  dateRange: null,
  statusFilter: 'all',
});

const getDefaultView = () => ({
  dashboardDate: null,
  medicalRecordFilters: { searchQuery: '', currentPage: 1 },
  appointmentFilters: {
    ...getDefaultFilters(),
    dateRange: getDefaultAppointmentDateRange(),
  },
});

export const usePsychologistView = create<IViewState>((set, get) => {
  const updateFilter = (patch: Partial<IAppointmentFilters>) => {
    set({ appointmentFilters: { ...get().appointmentFilters, ...patch } });
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

    setCurrentPage: (page) => updateFilter({ currentPage: page }),
    setSortDirection: (dir) =>
      updateFilter({ sortDirection: dir, currentPage: 1 }),
    setStatusFilter: (filter) =>
      updateFilter({ statusFilter: filter, currentPage: 1 }),
    setFormatFilter: (filter) =>
      updateFilter({ formatFilter: filter, currentPage: 1 }),
    setSearchQuery: (query) =>
      updateFilter({ searchQuery: query, currentPage: 1 }),
    setDateRange: (range) => updateFilter({ dateRange: range, currentPage: 1 }),

    resetFilters: () =>
      set({
        appointmentFilters: getDefaultFilters(),
      }),
  };
});
