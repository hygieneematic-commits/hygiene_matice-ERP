import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// These are the same public/client-side keys shown in the Firebase console —
// they identify the project, they are not secrets. Real access control comes
// from Firestore Security Rules + Firebase Auth, not from hiding this object.
const firebaseConfig = {
  apiKey: "AIzaSyBuqoGwe6uCsJ36qb9wlsh0tDMBpEnb0OQ",
  authDomain: "hygiene-matic-erp.firebaseapp.com",
  projectId: "hygiene-matic-erp",
  storageBucket: "hygiene-matic-erp.firebasestorage.app",
  messagingSenderId: "1039066437575",
  appId: "1:1039066437575:web:a11b136ce4b49b1a2f2be2",
};
// Analytics deliberately not initialized here — it needs a real browser
// `window`/measurement endpoint and adds bundle weight for zero
// manufacturing-costing value. Add it back later if marketing/usage
// analytics becomes a real requirement.

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// -----------------------------------------------------------------------
// Anonymous sign-in — NOT a replacement for the app's employee login
// screen (username/password, roles, permissions — all unchanged). This is
// a separate, lower-level gate: it stops raw internet bots/scripts from
// hitting the Firestore API directly with no browser at all. Firestore
// rules require `request.auth != null`; every real visitor gets an
// anonymous session automatically and transparently, no extra click.
//
// What this does NOT protect against: a technically capable employee (or
// anyone who loads the deployed page) opening devtools and querying
// Firestore directly, bypassing the in-app login screen. There's no
// backend here to enforce that — only real Firebase Auth (signed-in as a
// specific person, with per-role security rules) closes that gap fully.
// Treat this as "keeps casual/automated scraping out", not "production
// grade access control for sensitive data".
// -----------------------------------------------------------------------
export const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe();
    if (user) {
      resolve(user);
    } else {
      signInAnonymously(auth)
        .then((cred) => resolve(cred.user))
        .catch((err) => {
          console.error("firebase: anonymous sign-in failed — Firestore reads/writes will be denied by security rules until this succeeds", err);
          resolve(null);
        });
    }
  });
});
