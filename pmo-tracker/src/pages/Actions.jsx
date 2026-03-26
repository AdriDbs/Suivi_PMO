import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { subscribeActions, subscribeOpportunities, updateAction, deleteAction } from '../services/firestore'
import { formatDate, toDate } from '../utils/helpers'
import { ACTION_TYPES, ACTION_STATUSES, PRIORITIES, STATUS_BADGE_COLORS, PRIORITY_COLORS } from '../utils/constants'
import Modal from '../components/Modal'
import ActionForm from '../components/ActionForm'
import Badge from '../components/Badge'
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react'
import { isAfter, startOfDay, endOfWeek, endOfMonth, isBefore } from 'date-fns'
import toast from 'react-hot-toast'
import { Timestamp } from 'firebase/firestore'

export default function Actions() {
  const { data: actions, loading: actionsLoading } = useCollection(subscribeActions)
  const { data: opps } = useCollection(subscribeOpportunities)
  const [showModal, setShowModal] = useState(false)
  const [editAction, setEditAction] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [filters, setFilters] = useState({ owner: '', status: '', duePeriod: '', opportunityId: '' })

  const owners = useMemo(() => [...new Set(actions.map((a) => a.owner).filter(Boolean))], [actions])

  const filtered = useMemo(() => {
    let r = [...actions]
    if (filters.owner) r = r.filter((a) => a.owner === filters.owner)
    if (filters.status) r = r.filter((a) => a.status === filters.status)
    if (filters.opportunityId) r = r.filter((a) => a.opportunityId === filters.opportunityId)
    if (filters.duePeriod) {
      const now = new Date()
      const today = startOfDay(now)
      r = r.filter((a) => {
        const d = toDate(a.plannedDate)
        if (!d) return false
        if (filters.duePeriod === 'overdue') return isBefore(d, today) && a.status === 'À faire'
        if (filters.duePeriod === 'week') return isAfter(d, today) && isBefore(d, endOfWeek(now))
        if (filters.duePeriod === 'month') return isAfter(d, today) && isBefore(d, endOfMonth(now))
        return true
      })
    }
    return r
  }, [actions, filters])

  const rowClass = (action) => {
    const d = toDate(action.plannedDate)
    const today = startOfDay(new Date())
    if (action.status === 'À faire') {
      if (d && isBefore(d, today)) return 'bg-red-50'
      if (d && d.toDateString() === new Date().toDateString()) return 'bg-yellow-50'
    }
    return ''
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette action ?')) return
    await deleteAction(id)
    toast.success('Action supprimée')
  }

  const bulkUpdateStatus = async (status) => {
    const ids = [...selected]
    await Promise.all(ids.map((id) => updateAction(id, { status })))
    setSelected(new Set())
    toast.success(`${ids.length} action(s) mises à jour`)
  }

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  if (actionsLoading) return <Spinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Actions PMO</h1>
        <button onClick={() => { setEditAction(null); setShowModal(true) }} className="btn-primary">
          <Plus size={16} /> Ajouter une action
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-end">
        <FilterSelect label="Responsable" value={filters.owner} onChange={setFilter('owner')}>
          <option value="">Tous</option>
          {owners.map((o) => <option key={o}>{o}</option>)}
        </FilterSelect>
        <FilterSelect label="Statut" value={filters.status} onChange={setFilter('status')}>
          <option value="">Tous</option>
          {ACTION_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </FilterSelect>
        <FilterSelect label="Échéance" value={filters.duePeriod} onChange={setFilter('duePeriod')}>
          <option value="">Toutes</option>
          <option value="overdue">En retard</option>
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
        </FilterSelect>
        <FilterSelect label="Opportunité" value={filters.opportunityId} onChange={setFilter('opportunityId')}>
          <option value="">Toutes</option>
          {opps.map((o) => <option key={o.id} value={o.id}>{o.client} – {o.label}</option>)}
        </FilterSelect>
        {selected.size > 0 && (
          <div className="flex items-end gap-2 ml-auto">
            <span className="text-sm text-gray-500">{selected.size} sélectionnée(s)</span>
            {ACTION_STATUSES.map((s) => (
              <button key={s} onClick={() => bulkUpdateStatus(s)} className="btn-secondary text-xs py-1 px-2">
                → {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="w-10 px-3 py-3">
                  <input type="checkbox" onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map(a => a.id)) : new Set())} checked={selected.size === filtered.length && filtered.length > 0} />
                </th>
                {['Type', 'Opportunité', 'Client', 'Date prévue', 'Date réalisée', 'Statut', 'Responsable', 'Priorité', 'Prochaine étape', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-12 text-gray-400">Aucune action trouvée</td></tr>
              )}
              {filtered.map((action) => {
                const opp = opps.find((o) => o.id === action.opportunityId)
                return (
                  <tr key={action.id} className={`hover:bg-gray-50 transition-colors ${rowClass(action)}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(action.id)}
                        onChange={(e) => {
                          const s = new Set(selected)
                          e.target.checked ? s.add(action.id) : s.delete(action.id)
                          setSelected(s)
                        }}
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{action.type}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {opp ? <Link to={`/opportunities/${opp.id}`} className="text-blue-600 hover:underline">{opp.label}</Link> : '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-500">{opp?.client || '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(action.plannedDate)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDate(action.doneDate)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge label={action.status} className={STATUS_BADGE_COLORS[action.status] || ''} />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{action.owner || '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Badge label={action.priority} className={PRIORITY_COLORS[action.priority] || ''} />
                    </td>
                    <td className="px-3 py-3 max-w-[200px] truncate text-gray-500">{action.nextStep || '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditAction(action); setShowModal(true) }} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(action.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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
      </div>

      {showModal && (
        <Modal
          title={editAction ? 'Modifier l\'action' : 'Nouvelle action'}
          onClose={() => { setShowModal(false); setEditAction(null) }}
          wide
        >
          <ActionForm
            initial={editAction || {}}
            id={editAction?.id}
            opportunities={opps}
            onClose={() => { setShowModal(false); setEditAction(null) }}
          />
        </Modal>
      )}
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <select className="input text-sm py-1.5 pr-8 w-36" value={value} onChange={onChange}>{children}</select>
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
