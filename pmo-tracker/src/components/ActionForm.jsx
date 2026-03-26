import React, { useState } from 'react'
import { ACTION_TYPES, ACTION_STATUSES, PRIORITIES } from '../utils/constants'
import { addAction, updateAction } from '../services/firestore'
import { Timestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

const empty = {
  type: 'RDV client', opportunityId: '', plannedDate: '', doneDate: '',
  status: 'À faire', owner: '', notes: '', nextStep: '', priority: 'Normale'
}

export default function ActionForm({ initial = {}, onClose, id = null, opportunities = [] }) {
  const [form, setForm] = useState({
    ...empty, ...initial,
    plannedDate: toInput(initial.plannedDate),
    doneDate: toInput(initial.doneDate),
  })
  const [saving, setSaving] = useState(false)

  function toInput(val) {
    if (!val) return ''
    const d = val.toDate ? val.toDate() : new Date(val)
    return d.toISOString().split('T')[0]
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.status === 'Fait' && !form.nextStep.trim()) {
      toast.error('La prochaine étape est requise quand le statut est "Fait".')
      return
    }
    setSaving(true)
    try {
      const data = {
        ...form,
        plannedDate: form.plannedDate ? Timestamp.fromDate(new Date(form.plannedDate)) : null,
        doneDate: form.doneDate ? Timestamp.fromDate(new Date(form.doneDate)) : null,
      }
      if (id) {
        await updateAction(id, data)
        toast.success('Action mise à jour')
      } else {
        await addAction(data)
        toast.success('Action créée')
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
        <Field label="Type">
          <select className="input" value={form.type} onChange={set('type')}>
            {ACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Statut">
          <select className="input" value={form.status} onChange={set('status')}>
            {ACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Opportunité liée">
        <select className="input" value={form.opportunityId} onChange={set('opportunityId')}>
          <option value="">— Aucune —</option>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>{o.client} – {o.label}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date prévue">
          <input className="input" type="date" value={form.plannedDate} onChange={set('plannedDate')} />
        </Field>
        <Field label="Date réalisée">
          <input className="input" type="date" value={form.doneDate} onChange={set('doneDate')} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsable">
          <input className="input" value={form.owner} onChange={set('owner')} />
        </Field>
        <Field label="Priorité">
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <Field label={`Prochaine étape ${form.status === 'Fait' ? '*' : ''}`}>
        <input
          className={`input ${form.status === 'Fait' && !form.nextStep.trim() ? 'border-red-400' : ''}`}
          value={form.nextStep}
          onChange={set('nextStep')}
        />
      </Field>
      <Field label="Notes">
        <textarea className="input min-h-[80px]" value={form.notes} onChange={set('notes')} />
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
