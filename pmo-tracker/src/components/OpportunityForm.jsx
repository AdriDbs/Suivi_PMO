import React, { useState } from 'react'
import { STATUSES, SERVICES } from '../utils/constants'
import toast from 'react-hot-toast'
import { addOpportunity, updateOpportunity } from '../services/firestore'
import { Timestamp } from 'firebase/firestore'

const empty = {
  client: '', account: '', label: '', description: '',
  service: 'IT', status: 'Lead', probability: '',
  value: '', closingDate: '', owner: '', source: ''
}

export default function OpportunityForm({ initial = {}, onClose, id = null }) {
  const [form, setForm] = useState({ ...empty, ...initial, closingDate: initial.closingDate ? toInputDate(initial.closingDate) : '' })
  const [saving, setSaving] = useState(false)

  function toInputDate(val) {
    if (!val) return ''
    const d = val.toDate ? val.toDate() : new Date(val)
    return d.toISOString().split('T')[0]
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const requiresProbability = ['Proposal', 'Négociation', 'Won', 'Lost'].includes(form.status)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (requiresProbability && form.probability === '') {
      toast.error('La probabilité est requise pour ce statut.')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        probability: form.probability !== '' ? Number(form.probability) : null,
        value: form.value !== '' ? Number(form.value) : null,
        closingDate: form.closingDate ? Timestamp.fromDate(new Date(form.closingDate)) : null,
      }
      if (id) {
        await updateOpportunity(id, data)
        toast.success('Opportunité mise à jour')
      } else {
        await addOpportunity(data)
        toast.success('Opportunité créée')
      }
      onClose()
    } catch (err) {
      toast.error('Erreur : ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Client *" required>
          <input className="input" value={form.client} onChange={set('client')} required />
        </Field>
        <Field label="Compte">
          <input className="input" value={form.account} onChange={set('account')} />
        </Field>
      </div>
      <Field label="Libellé *" required>
        <input className="input" value={form.label} onChange={set('label')} required />
      </Field>
      <Field label="Description">
        <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Service">
          <select className="input" value={form.service} onChange={set('service')}>
            {SERVICES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Statut">
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label={`Probabilité (%) ${requiresProbability ? '*' : ''}`}>
          <input
            className={`input ${requiresProbability && form.probability === '' ? 'border-red-400' : ''}`}
            type="number" min="0" max="100"
            value={form.probability}
            onChange={set('probability')}
            required={requiresProbability}
          />
        </Field>
        <Field label="Valeur (€)">
          <input className="input" type="number" min="0" value={form.value} onChange={set('value')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date de closing">
          <input className="input" type="date" value={form.closingDate} onChange={set('closingDate')} />
        </Field>
        <Field label="Responsable">
          <input className="input" value={form.owner} onChange={set('owner')} />
        </Field>
      </div>
      <Field label="Source">
        <input className="input" value={form.source} onChange={set('source')} />
      </Field>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Enregistrement…' : id ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
