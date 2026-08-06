import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedUsers } from "../data/seedMisc";
import { generateId } from "../utils/id";

export const useUserStore = create(
  persist(
    (set, get) => ({
      users: seedUsers,

      addUser: (data) => set({ users: [...get().users, { id: generateId("user"), active: true, ...data }] }),

      updateUser: (id, patch) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }),

      resetPassword: (id, newPassword) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, password: newPassword } : u)) }),

      setActive: (id, active) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, active } : u)) }),

      recordLogin: (id) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, lastLogin: new Date().toISOString() } : u)) }),

      deleteUser: (id) => set({ users: get().users.filter((u) => u.id !== id) }),
    }),
    { name: "hm-users-v2" }
  )
);
