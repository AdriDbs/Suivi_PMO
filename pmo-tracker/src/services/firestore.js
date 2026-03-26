import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase'

// ─── Opportunities ───────────────────────────────────────────────────────────

export const opportunitiesRef = () => collection(db, 'opportunities')

export const addOpportunity = (data) =>
  addDoc(opportunitiesRef(), { ...data, createdAt: serverTimestamp(), statusHistory: [] })

export const updateOpportunity = (id, data) =>
  updateDoc(doc(db, 'opportunities', id), data)

export const deleteOpportunity = (id) =>
  deleteDoc(doc(db, 'opportunities', id))

export const getOpportunity = (id) =>
  getDoc(doc(db, 'opportunities', id))

export const subscribeOpportunities = (callback) =>
  onSnapshot(query(opportunitiesRef(), orderBy('createdAt', 'desc')), callback)

// ─── Actions ─────────────────────────────────────────────────────────────────

export const actionsRef = () => collection(db, 'actions')

export const addAction = (data) =>
  addDoc(actionsRef(), { ...data, createdAt: serverTimestamp() })

export const updateAction = (id, data) =>
  updateDoc(doc(db, 'actions', id), data)

export const deleteAction = (id) =>
  deleteDoc(doc(db, 'actions', id))

export const subscribeActions = (callback) =>
  onSnapshot(query(actionsRef(), orderBy('plannedDate', 'asc')), callback)

export const subscribeActionsByOpportunity = (opportunityId, callback) =>
  onSnapshot(
    query(actionsRef(), where('opportunityId', '==', opportunityId), orderBy('plannedDate', 'asc')),
    callback
  )

// ─── Contacts ────────────────────────────────────────────────────────────────

export const contactsRef = () => collection(db, 'contacts')

export const addContact = (data) =>
  addDoc(contactsRef(), { ...data, createdAt: serverTimestamp() })

export const updateContact = (id, data) =>
  updateDoc(doc(db, 'contacts', id), data)

export const deleteContact = (id) =>
  deleteDoc(doc(db, 'contacts', id))

export const subscribeContacts = (callback) =>
  onSnapshot(query(contactsRef(), orderBy('name', 'asc')), callback)
