import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useUserStore } from "./useUserStore";
import { useAuditStore } from "./useAuditStore";

// Deliberately still localStorage (not firestoreSync) — WHO is logged in on
// THIS device is per-browser session state, not shared data. Logging in on
// a phone should never auto-log-in a laptop. useUserStore (the actual user
// list/roster) is the one that's Firestore-synced.
export const useAuthStore = create(
  persist(
    (set) => ({
      currentUser: null,

      // Returns { ok: true } or { ok: false, error }
      login: (username, password) => {
        const users = useUserStore.getState().users;
        const match = users.find((u) => u.username?.toLowerCase() === username.trim().toLowerCase());
        if (!match) return { ok: false, error: "No user found with that username." };
        if (!match.active) return { ok: false, error: "This account has been disabled. Contact your Super Admin." };
        if (match.password !== password) return { ok: false, error: "Incorrect password." };

        useUserStore.getState().recordLogin(match.id);
        set({ currentUser: { id: match.id, name: match.name, role: match.role, username: match.username } });
        useAuditStore.getState().log("User login", `${match.name} (${match.role}) signed in`, match.name);
        return { ok: true };
      },

      logout: () => set({ currentUser: null }),
    }),
    { name: "hm-auth" }
  )
);
