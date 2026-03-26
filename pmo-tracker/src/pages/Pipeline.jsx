import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCollection } from '../hooks/useCollection'
import { subscribeOpportunities } from '../services/firestore'
import { formatCurrency, formatDate, daysInStatus, isStale, toDate } from '../utils/helpers'
import { STATUSES, STATUS_COLORS } from '../utils/constants'
import Modal from '../components/Modal'
import OpportunityForm from '../components/OpportunityForm'
import Badge from '../components/Badge'
import { Plus, AlertTriangle, Clock } from 'lucide-react'
import { differenceInDays } from 'date-fns'

function closingColor(opp) {
  const d = toDate(opp.closingDate)
  if (!d) return ''
  const diff = differenceInDays(d, new Date())
  if (diff < 0) return 'border-red-300 bg-red-50'
  if (diff < 30) return 'border-orange-300 bg-orange-50'
  return ''
}

export default function Pipeline() {
  const { data: opps, loading } = useCollection(subscribeOpportunities)
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const byStatus = useMemo(() => {
    const map = {}
    STATUSES.forEach((s) => { map[s] = [] })
    opps.forEach((o) => { if (map[o.status]) map[o.status].push(o) })
    return map
  }, [opps])

  if (loading) return <Spinner />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Nouvelle opportunité
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {STATUSES.map((status) => (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>{status}</span>
              <span className="text-xs text-gray-400">{byStatus[status].length} opp.</span>
            </div>
            <div className="space-y-3">
              {byStatus[status].length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-xs">
                  Aucune opportunité
                </div>
              )}
              {byStatus[status].map((opp) => (
                <OppCard key={opp.id} opp={opp} onClick={() => navigate(`/opportunities/${opp.id}`)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Nouvelle opportunité" onClose={() => setShowModal(false)} wide>
          <OpportunityForm onClose={() => setShowModal(false)} />
        </Modal>
      )}
    </div>
  )
}

function OppCard({ opp, onClick }) {
  const colorClass = closingColor(opp)
  const days = daysInStatus(opp)
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow ${colorClass}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-medium text-gray-500">{opp.client}</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-tight">{opp.label}</p>
        </div>
        <div className="flex flex-col gap-1 items-end shrink-0">
          {isStale(opp) && <Badge label="Stale" className="bg-red-100 text-red-600" />}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600 mt-3">
        <span className="font-semibold text-blue-700">{formatCurrency(opp.value)}</span>
        <span>{opp.probability != null ? `${opp.probability}%` : '—'}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
        <span>{opp.owner || '—'}</span>
        <span className="flex items-center gap-1">
          <Clock size={11} /> {opp.closingDate ? formatDate(opp.closingDate) : '—'}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
        <AlertTriangle size={11} className="text-gray-300" /> {days}j dans ce statut
      </div>
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
