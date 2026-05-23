// Firebase Auth Service
// Fill in your firebaseConfig below after getting it from Firebase Console

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'

// ⬇️ ضع هنا الـ config بتاعك من Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let auth = null
let googleProvider = null

export function initFirebase() {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: 'select_account' })
    return true
  } catch (err) {
    console.warn('Firebase init failed:', err)
    return false
  }
}

export async function signInWithGoogle() {
  if (!auth) initFirebase()
  if (!auth) throw new Error('Firebase not initialized')
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user
  return {
    uid: user.uid,
    name: user.displayName,
    email: user.email,
    picture: user.photoURL,
  }
}

export async function signOutUser() {
  if (!auth) return
  await signOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) {
    initFirebase()
  }
  if (!auth) return () => {}
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        picture: user.photoURL,
      })
    } else {
      callback(null)
    }
  })
}
