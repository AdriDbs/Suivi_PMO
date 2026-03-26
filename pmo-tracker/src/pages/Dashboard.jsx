import React, { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import { useCollection } from '../hooks/useCollection'
import { subscribeOpportunities, subscribeActions } from '../services/firestore'
import { formatCurrency, filterByPeriod, daysInStatus, toDate } from '../utils/helpers'
import { STATUSES } from '../utils/constants'
import { differenceInDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { AlertTriangle, TrendingUp, Briefcase, CheckSquare, Target, Clock } from 'lucide-react'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1']
const BAR_COLORS = {
  Lead: '#94a3b8', Qualifié: '#3b82f6', Proposal: '#f59e0b',
  Négociation: '#f97316', Won: '#22c55e', Lost: '#ef4444'
}

const PERIODS = [
  { value: 'all', label: 'Tout' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' },
]

export default function Dashboard() {
  const { data: opps, loading: oppsLoading } = useCollection(subscribeOpportunities)
  const { data: actions, loading: actionsLoading } = useCollection(subscribeActions)

  const [filters, setFilters] = useState({ period: 'all', owner: '', service: '', minProb: 0 })

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))

  const owners = useMemo(() => [...new Set(opps.map((o) => o.owner).filter(Boolean))], [opps])

  const filtered = useMemo(() => {
    let r = filterByPeriod(opps, filters.period)
    if (filters.owner) r = r.filter((o) => o.owner === filters.owner)
    if (filters.service) r = r.filter((o) => o.service === filters.service)
    if (filters.minProb > 0) r = r.filter((o) => (o.probability ?? 0) >= Number(filters.minProb))
    return r
  }, [opps, filters])

  const kpis = useMemo(() => {
    const active = filtered.filter((o) => !['Won', 'Lost'].includes(o.status))
    const totalPipe = active.reduce((s, o) => s + (o.value || 0), 0)
    const weighted = active.reduce((s, o) => s + (o.value || 0) * ((o.probability || 0) / 100), 0)
    const won = filtered.filter((o) => o.status === 'Won')
    const lost = filtered.filter((o) => o.status === 'Lost')
    const wonRate = (won.length + lost.length) > 0 ? Math.round(won.length / (won.length + lost.length) * 100) : 0
    const cycles = won.map((o) => {
      const c = toDate(o.createdAt)
      const cl = toDate(o.closingDate)
      return c && cl ? differenceInDays(cl, c) : null
    }).filter((n) => n !== null)
    const avgCycle = cycles.length ? Math.round(cycles.reduce((s, n) => s + n, 0) / cycles.length) : 0
    const pendingActions = actions.filter((a) => a.status === 'À faire').length
    return { totalPipe, weighted, activeCount: active.length, pendingActions, wonRate, avgCycle }
  }, [filtered, actions])

  const byStatus = STATUSES.map((s) => ({
    name: s,
    valeur: filtered.filter((o) => o.status === s).reduce((sum, o) => sum + (o.value || 0), 0)
  }))

  const byService = useMemo(() => {
    const map = {}
    filtered.forEach((o) => { map[o.service] = (map[o.service] || 0) + (o.value || 0) })
    return Object.entries(map).map(([name, valeur]) => ({ name, valeur }))
  }, [filtered])

  const byOwner = useMemo(() => {
    const map = {}
    filtered.forEach((o) => { if (o.owner) map[o.owner] = (map[o.owner] || 0) + (o.value || 0) })
    return Object.entries(map).map(([name, valeur]) => ({ name, valeur }))
  }, [filtered])

  const actionsByStatus = useMemo(() => {
    const map = {}
    actions.forEach((a) => { map[a.status] = (map[a.status] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [actions])

  const createdPerMonth = useMemo(() => {
    const map = {}
    filtered.forEach((o) => {
      const d = toDate(o.createdAt)
      if (d) {
        const key = format(d, 'MMM yy', { locale: fr })
        map[key] = (map[key] || 0) + 1
      }
    })
    return Object.entries(map).slice(-12).map(([name, count]) => ({ name, count }))
  }, [filtered])

  const alerts = useMemo(() => {
    const noAction = filtered.filter((o) => {
      if (['Won', 'Lost'].includes(o.status)) return false
      const linked = actions.filter((a) => a.opportunityId === o.id && a.status === 'À faire')
      return linked.length === 0
    })
    const stale = filtered.filter((o) => !['Won', 'Lost'].includes(o.status) && daysInStatus(o) > 60)
    return { noAction, stale }
  }, [filtered, actions])

  if (oppsLoading || actionsLoading) return <LoadingScreen />

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Période</label>
          <select className="input text-sm py-1.5 w-36" value={filters.period} onChange={setFilter('period')}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
          <select className="input text-sm py-1.5 w-36" value={filters.owner} onChange={setFilter('owner')}>
            <option value="">Tous</option>
            {owners.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Service</label>
          <select className="input text-sm py-1.5 w-36" value={filters.service} onChange={setFilter('service')}>
            <option value="">Tous</option>
            {['Stratégie', 'Transformation', 'IT', 'Data', 'Autre'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Probabilité min : {filters.minProb}%</label>
          <input
            type="range" min="0" max="100" step="5"
            value={filters.minProb} onChange={setFilter('minProb')}
            className="w-36 h-2 accent-blue-600"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={TrendingUp} label="Pipeline total" value={formatCurrency(kpis.totalPipe)} color="blue" />
        <KpiCard icon={Target} label="Pipeline pondéré" value={formatCurrency(kpis.weighted)} color="indigo" />
        <KpiCard icon={Briefcase} label="Opps actives" value={kpis.activeCount} color="violet" />
        <KpiCard icon={CheckSquare} label="Actions en attente" value={kpis.pendingActions} color="amber" />
        <KpiCard icon={TrendingUp} label="Taux de gain" value={`${kpis.wonRate}%`} color="green" />
        <KpiCard icon={Clock} label="Cycle moyen" value={kpis.avgCycle ? `${kpis.avgCycle}j` : '—'} color="rose" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Pipeline par statut (€)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byStatus} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="valeur" radius={[4, 4, 0, 0]}>
                {byStatus.map((entry) => (
                  <Cell key={entry.name} fill={BAR_COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline par service (€)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byService} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="valeur" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Pipeline par responsable (€)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byOwner} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="valeur" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Actions par statut">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={actionsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {actionsByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Opps créées par mois">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={createdPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Alerts */}
      {(alerts.noAction.length > 0 || alerts.stale.length > 0) && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Alertes PMO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.noAction.map((o) => (
              <Link key={o.id} to={`/opportunities/${o.id}`} className="card p-4 border-l-4 border-amber-400 hover:bg-amber-50 transition-colors">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{o.client} – {o.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Aucune action planifiée dans les 14 prochains jours</p>
                  </div>
                </div>
              </Link>
            ))}
            {alerts.stale.map((o) => (
              <Link key={o.id} to={`/opportunities/${o.id}`} className="card p-4 border-l-4 border-red-400 hover:bg-red-50 transition-colors">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{o.client} – {o.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Statut inchangé depuis {daysInStatus(o)} jours</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
