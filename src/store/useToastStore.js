import { create } from "zustand";

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3500);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
