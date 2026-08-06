import { create } from "zustand";
import { firestoreSync } from "./middleware/firestoreSync";
import { generateId } from "../utils/id";

export const useAuditStore = create(
  firestoreSync(
    (set, get) => ({
      logs: [],

      // action: short label e.g. "Raw material price changed"
      // details: human-readable specifics e.g. "SLES: ₹95 → ₹99"
      log: (action, details = "", user = null) => {
        let actor = user;
        if (!actor) {
          try {
            actor = JSON.parse(localStorage.getItem("hm-auth") || "{}")?.state?.currentUser?.name || "System";
          } catch {
            actor = "System";
          }
        }
        const entry = {
          id: generateId("log"),
          action,
          details,
          user: actor,
          timestamp: new Date().toISOString(),
        };
        set({ logs: [entry, ...get().logs].slice(0, 500) });
      },

      clear: () => set({ logs: [] }),
    }),
    { name: "hm-audit-log" }
  )
);
