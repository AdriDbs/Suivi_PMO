import { differenceInDays, format, isAfter, isBefore, startOfMonth, startOfQuarter, startOfYear } from 'date-fns'
import { fr } from 'date-fns/locale'

export function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val)
}

export function formatDate(val, fmt = 'dd/MM/yyyy') {
  const d = toDate(val)
  if (!d) return '—'
  return format(d, fmt, { locale: fr })
}

export function formatCurrency(val) {
  if (val == null) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

export function daysInStatus(opp) {
  const h = opp.statusHistory
  if (!h || h.length === 0) {
    const created = toDate(opp.createdAt)
    return created ? differenceInDays(new Date(), created) : 0
  }
  const lastChange = toDate(h[h.length - 1].date)
  return lastChange ? differenceInDays(new Date(), lastChange) : 0
}

export function isStale(opp) {
  return daysInStatus(opp) > 60
}

export function hasNoRecentAction(opp, actions) {
  const linked = actions.filter(
    (a) => a.opportunityId === opp.id && a.status === 'À faire'
  )
  if (linked.length === 0) return true
  const nearest = linked.reduce((min, a) => {
    const d = toDate(a.plannedDate)
    return d && (!min || d < min) ? d : min
  }, null)
  if (!nearest) return true
  return differenceInDays(nearest, new Date()) > 14
}

export function filterByPeriod(items, period, dateField = 'createdAt') {
  if (!period || period === 'all') return items
  const now = new Date()
  let from
  if (period === 'month') from = startOfMonth(now)
  else if (period === 'quarter') from = startOfQuarter(now)
  else if (period === 'year') from = startOfYear(now)
  return items.filter((i) => {
    const d = toDate(i[dateField])
    return d && isAfter(d, from)
  })
}
