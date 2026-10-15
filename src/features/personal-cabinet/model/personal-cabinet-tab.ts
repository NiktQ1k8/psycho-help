import { create } from 'zustand';
import type { TTabId } from '@/pages/personal-cabinet/config/tabs';

interface CabinetTabState {
  activeTab: TTabId | null;
  setActiveTab: (tab: TTabId) => void;
}

export const useCabinetTab = create<CabinetTabState>((set) => ({
  activeTab: null,
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
