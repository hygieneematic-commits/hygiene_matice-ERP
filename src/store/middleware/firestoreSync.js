import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db, authReady } from "../../lib/firebase";

/**
 * firestoreSync — a drop-in replacement for zustand/middleware's `persist`,
 * backed by a single Firestore document instead of localStorage.
 * -----------------------------------------------------------------------
 * Every store in this app used to do:
 *     persist((set, get) => ({ ... }), { name: "hm-products" })
 * which saved the store's state to `localStorage["hm-products"]` — private
 * to one browser, invisible to every other device/user.
 *
 * Swapping to:
 *     firestoreSync((set, get) => ({ ... }), { name: "hm-products" })
 * keeps every action/selector in the store completely unchanged. The only
 * difference is *where* the state lives: Firestore collection "erp-stores",
 * document id = the `name` you already had. Every open tab/device with the
 * same Firebase project gets pushed the update in real time via onSnapshot.
 *
 * Trade-off (documented, not hidden): this syncs the WHOLE store as one
 * document, last-write-wins — simple and correct for a small team editing
 * mostly-disjoint records, but two people editing the exact same store in
 * the exact same second can clobber each other. If a store grows very large
 * (e.g. years of audit log / batch history) it should eventually move to
 * one Firestore document per record instead of one per store — flagged in
 * the store file itself where that matters.
 * -----------------------------------------------------------------------
 */
export function firestoreSync(config, options) {
  const { name, partialize = (state) => state } = options;
  if (!name) throw new Error("firestoreSync requires a { name } option (used as the Firestore document id)");

  const docRef = doc(db, "erp-stores", name);
  let hydrated = false; // don't push to Firestore until we've loaded whatever's already there

  return (set, get, api) => {
    // Strips functions (actions) automatically, same as JSON.stringify would
    // for localStorage — Firestore's SDK throws on function-valued fields.
    function toPlainState(state) {
      return JSON.parse(JSON.stringify(partialize(state)));
    }

    function pushToFirestore() {
      if (!hydrated) return;
      setDoc(docRef, toPlainState(get())).catch((err) => {
        console.error(`firestoreSync[${name}]: write failed`, err);
      });
    }

    const wrappedSet = (partial, replace) => {
      set(partial, replace);
      pushToFirestore();
    };

    const initialState = config(wrappedSet, get, api);

    // 1) Wait for the anonymous auth session (see lib/firebase.js) — the
    //    Firestore rules require request.auth != null, so reads/writes
    //    before this resolves would just fail with permission-denied.
    // 2) Load whatever's already in Firestore (or seed it, first run ever).
    // 3) Subscribe for live updates from other tabs/devices for the rest of
    //    the session. (This also fires for our own writes — harmless, it's
    //    just re-applying the same data via the raw `set`, not `wrappedSet`,
    //    so it never triggers another write.)
    authReady
      .then(() => getDoc(docRef))
      .then((snap) => {
        if (snap.exists()) {
          set(snap.data());
        } else {
          setDoc(docRef, toPlainState(get()));
        }
        hydrated = true;
        onSnapshot(docRef, (liveSnap) => {
          if (liveSnap.exists()) set(liveSnap.data());
        });
      })
      .catch((err) => {
        console.error(`firestoreSync[${name}]: initial load failed — continuing with local seed data only`, err);
        hydrated = true;
      });

    return initialState;
  };
}
