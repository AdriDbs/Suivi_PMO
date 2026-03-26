import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAXR8Rb9hfZlzuZX-OJ5CwfcsxWeI5IQBI",
  authDomain: "pmo-tracker-b8b8b.firebaseapp.com",
  projectId: "pmo-tracker-b8b8b",
  storageBucket: "pmo-tracker-b8b8b.firebasestorage.app",
  messagingSenderId: "67149616976",
  appId: "1:67149616976:web:edc549e99cbed0926e3e55",
  measurementId: "G-J4JPQWDLXB"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
