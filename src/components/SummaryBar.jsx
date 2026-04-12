import { useMemo } from 'react'
import { isUrgent, isFreeNightUrgent } from '../lib/periods'

export default function SummaryBar({ cards }) {
  const stats = useMemo(() => {
    let totalCards = cards.length
    let totalRemaining = 0
    let unusedFreeNights = 0
    let urgentCount = 0

    for (const card of cards) {
      for (const b of card.benefits) {
        totalRemaining += Math.max(0, b.total - b.used)
        if (isUrgent(b.period, b.used, b.total)) urgentCount++
      }
      for (const fn of card.freeNights) {
        if (!fn.used) {
          unusedFreeNights++
          if (isFreeNightUrgent(fn.exp)) urgentCount++
        }
      }
    }

    return { totalCards, totalRemaining, unusedFreeNights, urgentCount }
  }, [cards])

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      <Stat label="Cards" value={stats.totalCards} color="text-gray-700" />
      <Stat
        label="$ Remaining"
        value={`$${stats.totalRemaining.toFixed(0)}`}
        color="text-green-700"
      />
      <Stat
        label="Free Nights"
        value={stats.unusedFreeNights}
        color="text-amber-700"
      />
      <Stat
        label="Urgent Items"
        value={stats.urgentCount}
        color={stats.urgentCount > 0 ? 'text-red-700' : 'text-gray-500'}
      />
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
