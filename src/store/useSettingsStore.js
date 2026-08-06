import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { seedSettings } from "../data/seedMisc";

export const useSettingsStore = create(
  firestoreSync(
    (set, get) => ({
      settings: seedSettings,
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      resetSettings: () => set({ settings: seedSettings }),
    }),
    { name: "hm-settings" }
  )
);
