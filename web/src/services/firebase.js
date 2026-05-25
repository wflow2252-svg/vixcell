// Firebase service — Auth + Firestore
// إعداد Firebase: ضع متغيرات البيئة في .env.local أو Vercel:
//   VITE_FIREBASE_API_KEY
//   VITE_FIREBASE_AUTH_DOMAIN
//   VITE_FIREBASE_PROJECT_ID
//   VITE_FIREBASE_STORAGE_BUCKET
//   VITE_FIREBASE_MESSAGING_SENDER_ID
//   VITE_FIREBASE_APP_ID

import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
let auth = null
let db = null
let googleProvider = null

function isConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
}

export function initFirebase() {
  if (app) return true
  if (!isConfigured()) {
    console.warn('[Firebase] Not configured — falling back to localStorage only')
    return false
  }
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db   = getFirestore(app)
    googleProvider = new GoogleAuthProvider()
    googleProvider.setCustomParameters({ prompt: 'select_account' })
    return true
  } catch (err) {
    console.warn('[Firebase] init failed:', err)
    return false
  }
}

export function isFirebaseReady() {
  return Boolean(app && auth && db)
}

// ─── Auth ──────────────────────────────────────────────────────────
export async function signInWithGoogle() {
  if (!auth) initFirebase()
  if (!auth) throw new Error('Firebase not configured. Add VITE_FIREBASE_* env vars.')
  const result = await signInWithPopup(auth, googleProvider)
  const u = result.user
  return { uid: u.uid, name: u.displayName, email: u.email, picture: u.photoURL }
}

export async function signOutUser() {
  if (!auth) return
  await signOut(auth)
}

export function onAuthChange(callback) {
  if (!auth) initFirebase()
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => {
    if (user) callback({ uid: user.uid, name: user.displayName, email: user.email, picture: user.photoURL })
    else callback(null)
  })
}

// ─── Firestore: Submissions ────────────────────────────────────────
const SUBMISSIONS_COLLECTION = 'submissions'

export async function addSubmission(data) {
  if (!db) initFirebase()
  if (!db) throw new Error('FIRESTORE_UNAVAILABLE')
  const docRef = await addDoc(collection(db, SUBMISSIONS_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function listSubmissions() {
  if (!db) initFirebase()
  if (!db) throw new Error('FIRESTORE_UNAVAILABLE')
  const q = query(collection(db, SUBMISSIONS_COLLECTION), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toMillis?.() || Date.now() }))
}

export async function markSubmissionRead(id, read = true) {
  if (!db) initFirebase()
  if (!db) throw new Error('FIRESTORE_UNAVAILABLE')
  await updateDoc(doc(db, SUBMISSIONS_COLLECTION, id), { read })
}

export async function deleteSubmission(id) {
  if (!db) initFirebase()
  if (!db) throw new Error('FIRESTORE_UNAVAILABLE')
  await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, id))
}
