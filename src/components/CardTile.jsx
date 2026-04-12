import { useState } from 'react'
import BenefitRow from './BenefitRow'
import FreeNightRow from './FreeNightRow'
import { isUrgent, isFreeNightUrgent } from '../lib/periods'

const ISSUER_COLORS = {
  Amex: 'bg-blue-50 border-blue-200',
  Chase: 'bg-indigo-50 border-indigo-200',
  Citi: 'bg-cyan-50 border-cyan-200',
  'Bank of America': 'bg-red-50 border-red-200',
  Capital: 'bg-green-50 border-green-200',
  Wells: 'bg-yellow-50 border-yellow-200',
}

const OWNER_BADGE = {
  ace: 'bg-blue-100 text-blue-700',
  haley: 'bg-pink-100 text-pink-700',
}

export default function CardTile({ card, onUpdateBenefit, onUpdateFreeNight }) {
  const [collapsed, setCollapsed] = useState(false)

  const hasUrgentBenefit = card.benefits.some((b) => isUrgent(b.period, b.used, b.total))
  const hasUrgentFreeNight = card.freeNights.some((fn) => isFreeNightUrgent(fn.exp) && !fn.used)
  const isCardUrgent = hasUrgentBenefit || hasUrgentFreeNight

  const totalValue = card.benefits.reduce((s, b) => s + (b.total || 0), 0)
  const usedValue = card.benefits.reduce((s, b) => s + (b.used || 0), 0)
  const remainingValue = totalValue - usedValue
  const unusedFreeNights = card.freeNights.filter((fn) => !fn.used).length

  const issuerColor = ISSUER_COLORS[card.issuer] || 'bg-gray-50 border-gray-200'

  return (
    <div
      className={`rounded-xl border ${issuerColor} shadow-sm overflow-hidden ${
        isCardUrgent ? 'border-l-4 border-l-red-500' : ''
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full text-left px-4 pt-3 pb-2 flex items-start justify-between gap-2"
      >
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{card.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                OWNER_BADGE[card.owner] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {card.owner}
            </span>
            {isCardUrgent && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                Urgent
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-500">····{card.num}</span>
            {totalValue > 0 && (
              <span className="text-xs text-gray-600 font-medium">
                ${remainingValue.toFixed(0)} / ${totalValue} remaining
              </span>
            )}
            {unusedFreeNights > 0 && (
              <span className="text-xs text-amber-700 font-medium">
                🌙 {unusedFreeNights} night{unusedFreeNights > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-400 text-sm mt-1">{collapsed ? '▶' : '▼'}</span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-3">
          {card.benefits.length > 0 && (
            <div>
              {card.benefits.map((b) => (
                <BenefitRow
                  key={b.key}
                  benefit={b}
                  cardId={card.id}
                  onUpdate={onUpdateBenefit}
                />
              ))}
            </div>
          )}
          {card.freeNights.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Free Nights
              </p>
              {card.freeNights.map((fn) => (
                <FreeNightRow
                  key={fn.id}
                  fn={fn}
                  cardId={card.id}
                  onUpdate={onUpdateFreeNight}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
