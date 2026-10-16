import { create } from 'zustand';
import type { TProfileFormData } from '@/entities/auth/model/profile-form';

type TCabinetDraftsState = {
  profile: Partial<TProfileFormData>;
  cancellationReasons: Record<string, string>;
  setProfile: (patch: Partial<TProfileFormData>) => void;
  clearProfile: () => void;
  setCancellationReason: (id: string, reason: string) => void;
  clearCancellationReason: (id: string) => void;
};

export const useCabinetDrafts = create<TCabinetDraftsState>((set) => ({
  profile: {},
  cancellationReasons: {},
  setProfile: (patch) =>
    set((state) => ({ profile: { ...state.profile, ...patch } })),
  clearProfile: () => set({ profile: {} }),
  setCancellationReason: (id, reason) =>
    set((state) => ({
      cancellationReasons: { ...state.cancellationReasons, [id]: reason },
    })),
  clearCancellationReason: (id) =>
    set((state) => {
      const { [id]: _removed, ...rest } = state.cancellationReasons;
      return { cancellationReasons: rest };
    }),
}));
