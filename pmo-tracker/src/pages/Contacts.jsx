import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { subscribeContacts, subscribeOpportunities, addContact, updateContact, deleteContact } from '../services/firestore'
import { INFLUENCES } from '../utils/constants'
import Modal from '../components/Modal'
import Badge from '../components/Badge'
import { Plus, Search, Pencil, Trash2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const INFLUENCE_COLORS = {
  Décideur: 'bg-purple-100 text-purple-700',
  Influenceur: 'bg-blue-100 text-blue-700',
  Utilisateur: 'bg-green-100 text-green-700',
}

const empty = { name: '', function: '', entity: '', influence: 'Décideur', decisionRole: '', opportunityIds: [] }

export default function Contacts() {
  const { data: contacts, loading } = useCollection(subscribeContacts)
  const { data: opps } = useCollection(subscribeOpportunities)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [viewContact, setViewContact] = useState(null)

  const filtered = useMemo(() => {
    if (!search) return contacts
    const q = search.toLowerCase()
    return contacts.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.entity?.toLowerCase().includes(q) || c.function?.toLowerCase().includes(q)
    )
  }, [contacts, search])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce contact ?')) return
    await deleteContact(id)
    toast.success('Contact supprimé')
  }

  if (loading) return <Spinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <button onClick={() => { setEditContact(null); setShowModal(true) }} className="btn-primary">
          <Plus size={16} /> Nouveau contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Nom', 'Fonction', 'Entité Orange', 'Rôle', 'Rôle décisionnel', 'Opps liées', ''].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun contact trouvé</td></tr>
            )}
            {filtered.map((contact) => {
              const linkedOpps = opps.filter((o) => (contact.opportunityIds || []).includes(o.id))
              return (
                <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <button onClick={() => setViewContact(contact)} className="hover:text-blue-600 transition-colors text-left">
                      {contact.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contact.function || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{contact.entity || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge label={contact.influence} className={INFLUENCE_COLORS[contact.influence] || 'bg-gray-100 text-gray-600'} />
                  </td>
                  <td className="px-4 py-3 text-gray-500">{contact.decisionRole || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {linkedOpps.slice(0, 2).map((o) => (
                        <Link key={o.id} to={`/opportunities/${o.id}`} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          {o.label} <ExternalLink size={10} />
                        </Link>
                      ))}
                      {linkedOpps.length > 2 && <span className="text-xs text-gray-400">+{linkedOpps.length - 2}</span>}
                      {linkedOpps.length === 0 && <span className="text-xs text-gray-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditContact(contact); setShowModal(true) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(contact.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          title={editContact ? 'Modifier le contact' : 'Nouveau contact'}
          onClose={() => { setShowModal(false); setEditContact(null) }}
        >
          <ContactForm
            initial={editContact || empty}
            id={editContact?.id}
            opportunities={opps}
            onClose={() => { setShowModal(false); setEditContact(null) }}
          />
        </Modal>
      )}

      {viewContact && (
        <Modal title={viewContact.name} onClose={() => setViewContact(null)}>
          <ContactDetail contact={viewContact} opps={opps} />
        </Modal>
      )}
    </div>
  )
}

function ContactForm({ initial, id, opportunities, onClose }) {
  const [form, setForm] = useState({ ...initial, opportunityIds: initial.opportunityIds || [] })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleOpp = (oppId) => {
    setForm((f) => ({
      ...f,
      opportunityIds: f.opportunityIds.includes(oppId)
        ? f.opportunityIds.filter((i) => i !== oppId)
        : [...f.opportunityIds, oppId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (id) { await updateContact(id, form); toast.success('Contact mis à jour') }
      else { await addContact(form); toast.success('Contact créé') }
      onClose()
    } catch (err) { toast.error('Erreur : ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fonction</label>
          <input className="input" value={form.function} onChange={set('function')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entité Orange</label>
          <input className="input" value={form.entity} onChange={set('entity')} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Influence</label>
          <select className="input" value={form.influence} onChange={set('influence')}>
            {INFLUENCES.map((i) => <option key={i}>{i}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle décisionnel</label>
        <input className="input" value={form.decisionRole} onChange={set('decisionRole')} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Opportunités liées</label>
        <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
          {opportunities.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
              <input type="checkbox" checked={form.opportunityIds.includes(o.id)} onChange={() => toggleOpp(o.id)} />
              {o.client} – {o.label}
            </label>
          ))}
          {opportunities.length === 0 && <p className="text-xs text-gray-400 p-2">Aucune opportunité</p>}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

function ContactDetail({ contact, opps }) {
  const linkedOpps = opps.filter((o) => (contact.opportunityIds || []).includes(o.id))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Fonction" value={contact.function} />
        <Info label="Entité" value={contact.entity} />
        <Info label="Influence" value={contact.influence} />
        <Info label="Rôle décisionnel" value={contact.decisionRole} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Opportunités liées</p>
        {linkedOpps.length === 0 ? (
          <p className="text-sm text-gray-400">Aucune</p>
        ) : (
          <ul className="space-y-1">
            {linkedOpps.map((o) => (
              <li key={o.id}>
                <Link to={`/opportunities/${o.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  {o.client} – {o.label} <ExternalLink size={12} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || '—'}</p>
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
