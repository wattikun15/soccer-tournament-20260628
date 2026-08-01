import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyAlLjNSyjt_UsqK9tKYkScV7hwpO1GZqJc',
  authDomain: 'nakanofa-tournament-2026.firebaseapp.com',
  databaseURL: 'https://nakanofa-tournament-2026-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'nakanofa-tournament-2026',
  storageBucket: 'nakanofa-tournament-2026.firebasestorage.app',
  messagingSenderId: '210102522297',
  appId: '1:210102522297:web:a0741e599c9358dd02e668',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let authReadyPromise = null;

// Ensures an anonymous user is signed in, and resolves once we have a user.
export function ensureAuth() {
  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          } else {
            signInAnonymously(auth).catch(reject);
          }
        },
        reject
      );
    });
  }
  return authReadyPromise;
}
