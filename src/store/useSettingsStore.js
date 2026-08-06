import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedSettings } from "../data/seedMisc";

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      settings: seedSettings,
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      resetSettings: () => set({ settings: seedSettings }),
    }),
    { name: "hm-settings" }
  )
);
