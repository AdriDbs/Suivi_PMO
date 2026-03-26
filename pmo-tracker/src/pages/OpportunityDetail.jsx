import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getOpportunity, updateOpportunity, subscribeActionsByOpportunity, subscribeContacts, addAction } from '../services/firestore'
import { STATUSES, SERVICES, ACTION_STATUSES, STATUS_COLORS, STATUS_BADGE_COLORS, PRIORITY_COLORS } from '../utils/constants'
import { formatDate, formatCurrency, daysInStatus, toDate } from '../utils/helpers'
import { Timestamp, arrayUnion } from 'firebase/firestore'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import ActionForm from '../components/ActionForm'
import { ArrowLeft, Plus, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TABS = ['Actions', 'Contacts', 'Historique']

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [opp, setOpp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Actions')
  const [actions, setActions] = useState([])
  const [contacts, setContacts] = useState([])
  const [showActionModal, setShowActionModal] = useState(false)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    getOpportunity(id).then((snap) => {
      if (!snap.exists()) { navigate('/opportunities'); return }
      setOpp({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
    const unsubActions = subscribeActionsByOpportunity(id, (snap) => {
      setActions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const unsubContacts = subscribeContacts((snap) => {
      setContacts(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => (c.opportunityIds || []).includes(id)))
    })
    return () => { unsubActions(); unsubContacts() }
  }, [id])

  const handleFieldBlur = async (field, value) => {
    if (!opp || opp[field] === value) return
    setSaving((s) => ({ ...s, [field]: true }))
    try {
      await updateOpportunity(id, { [field]: value })
      setOpp((o) => ({ ...o, [field]: value }))
      toast.success('Champ sauvegardé')
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSaving((s) => ({ ...s, [field]: false }))
    }
  }

  const handleStatusChange = async (newStatus) => {
    if (!opp || newStatus === opp.status) return
    const req = ['Proposal', 'Négociation', 'Won', 'Lost'].includes(newStatus) && !opp.probability
    if (req) {
      const prob = prompt('Entrez la probabilité (0-100) pour ce statut :')
      if (prob === null) return
      await updateOpportunity(id, { probability: Number(prob) })
    }
    const histEntry = {
      status: newStatus,
      date: Timestamp.now(),
      changedBy: user?.email || 'unknown'
    }
    await updateOpportunity(id, {
      status: newStatus,
      statusHistory: arrayUnion(histEntry)
    })
    setOpp((o) => ({
      ...o,
      status: newStatus,
      statusHistory: [...(o.statusHistory || []), histEntry]
    }))
    toast.success(`Statut changé → ${newStatus}`)
  }

  if (loading) return <Spinner />
  if (!opp) return null

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/opportunities')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{opp.client}</p>
          <h1 className="text-2xl font-bold text-gray-900">{opp.label}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={opp.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="input text-sm py-1.5 font-medium"
          >
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Badge label={opp.status} className={STATUS_COLORS[opp.status] || ''} />
        </div>
      </div>

      {/* Detail grid */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <EditableField label="Client" value={opp.client} onBlur={(v) => handleFieldBlur('client', v)} />
          <EditableField label="Compte" value={opp.account} onBlur={(v) => handleFieldBlur('account', v)} />
          <EditableField label="Responsable" value={opp.owner} onBlur={(v) => handleFieldBlur('owner', v)} />
          <div>
            <label className="block text-xs text-gray-500 mb-1">Service</label>
            <select
              defaultValue={opp.service}
              onBlur={(e) => handleFieldBlur('service', e.target.value)}
              className="input text-sm py-1"
            >
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Valeur (€)</label>
            <EditableNumber value={opp.value} onBlur={(v) => handleFieldBlur('value', v)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Probabilité (%)</label>
            <EditableNumber value={opp.probability} onBlur={(v) => handleFieldBlur('probability', v)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date de closing</label>
            <input
              type="date"
              className="input text-sm py-1"
              defaultValue={opp.closingDate ? toDate(opp.closingDate)?.toISOString().split('T')[0] : ''}
              onBlur={(e) => handleFieldBlur('closingDate', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source</label>
            <EditableField label="" value={opp.source} onBlur={(v) => handleFieldBlur('source', v)} noLabel />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea
            className="input text-sm min-h-[80px]"
            defaultValue={opp.description}
            onBlur={(e) => handleFieldBlur('description', e.target.value)}
          />
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1"><Clock size={14} /> {daysInStatus(opp)}j dans ce statut</span>
          <span>Créé le {formatDate(opp.createdAt)}</span>
          <span className="font-semibold text-blue-700">{formatCurrency(opp.value)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'Actions' && <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5">{actions.length}</span>}
              {tab === 'Contacts' && <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5">{contacts.length}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'Actions' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowActionModal(true)} className="btn-primary text-sm py-1.5">
              <Plus size={14} /> Ajouter une action
            </button>
          </div>
          {actions.length === 0 && <EmptyState text="Aucune action liée à cette opportunité" />}
          {actions.map((a) => (
            <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge label={a.status} className={STATUS_BADGE_COLORS[a.status] || ''} />
                <div>
                  <p className="text-sm font-medium">{a.type}</p>
                  <p className="text-xs text-gray-500">{formatDate(a.plannedDate)} · {a.owner || '—'}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500 max-w-xs truncate">{a.nextStep || a.notes || '—'}</div>
              <Badge label={a.priority} className={PRIORITY_COLORS[a.priority] || ''} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'Contacts' && (
        <div>
          {contacts.length === 0 && <EmptyState text="Aucun contact lié à cette opportunité" />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((c) => (
              <div key={c.id} className="card p-4">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-500">{c.function} · {c.entity}</p>
                <Badge label={c.influence} className="mt-2 bg-purple-100 text-purple-700" />
                {c.decisionRole && <p className="text-xs text-gray-400 mt-1">{c.decisionRole}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Historique' && (
        <div className="space-y-3">
          {(!opp.statusHistory || opp.statusHistory.length === 0) && <EmptyState text="Aucun historique de statut" />}
          <div className="relative pl-6">
            {(opp.statusHistory || []).slice().reverse().map((h, i) => {
              const d = toDate(h.date)
              return (
                <div key={i} className="relative pb-6">
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-blue-500 -ml-1.5 border-2 border-white" />
                  {i < (opp.statusHistory || []).length - 1 && (
                    <div className="absolute left-0 top-4 bottom-0 w-0.5 bg-gray-200 -ml-px" />
                  )}
                  <div className="ml-4">
                    <Badge label={h.status} className={STATUS_COLORS[h.status] || ''} />
                    <p className="text-xs text-gray-400 mt-1">
                      {d ? format(d, "d MMMM yyyy 'à' HH:mm", { locale: fr }) : '—'} · {h.changedBy}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showActionModal && (
        <Modal title="Nouvelle action" onClose={() => setShowActionModal(false)} wide>
          <ActionForm
            initial={{ opportunityId: id }}
            opportunities={[opp]}
            onClose={() => setShowActionModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}

function EditableField({ label, value, onBlur, noLabel = false }) {
  const [val, setVal] = useState(value || '')
  useEffect(() => setVal(value || ''), [value])
  return (
    <div>
      {!noLabel && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <input
        className="input text-sm py-1"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => onBlur(val)}
      />
    </div>
  )
}

function EditableNumber({ value, onBlur }) {
  const [val, setVal] = useState(value ?? '')
  useEffect(() => setVal(value ?? ''), [value])
  return (
    <input
      type="number"
      className="input text-sm py-1"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onBlur(val !== '' ? Number(val) : null)}
    />
  )
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-12 text-gray-400 text-sm">
      <AlertTriangle size={24} className="mx-auto mb-2 text-gray-300" />
      {text}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
