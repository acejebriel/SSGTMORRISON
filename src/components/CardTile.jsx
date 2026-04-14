import { useState } from 'react'
import BenefitRow from './BenefitRow'
import FreeNightRow from './FreeNightRow'
import { isUrgent, isFreeNightUrgent } from '../lib/periods'

const ISSUER_COLORS = {
  'Amex Platinum':     'bg-blue-50 border-blue-200',
  'Amex Biz Platinum': 'bg-blue-50 border-blue-200',
  'Amex Delta':        'bg-purple-50 border-purple-200',
  'Amex Gold':         'bg-yellow-50 border-yellow-300',
  'Amex Hilton':       'bg-sky-50 border-sky-200',
  'Amex Marriott':     'bg-rose-50 border-rose-200',
  Chase:               'bg-indigo-50 border-indigo-200',
  Citi:                'bg-cyan-50 border-cyan-200',
}

const OWNER_BADGE = {
  ace:   'bg-blue-100 text-blue-700',
  haley: 'bg-pink-100 text-pink-700',
}

export default function CardTile({ card, onUpdateBenefit, onUpdateFreeNight, onUpdateCardNote }) {
  const [collapsed, setCollapsed] = useState(false)
  const [editingCardNote, setEditingCardNote] = useState(false)
  const [cardNoteInput, setCardNoteInput] = useState(card.cardNote || '')

  const hasUrgentBenefit   = card.benefits.some((b) => isUrgent(b.period, b.used, b.total))
  const hasUrgentFreeNight = card.freeNights.some((fn) => isFreeNightUrgent(fn.exp) && !fn.used)
  const isCardUrgent = hasUrgentBenefit || hasUrgentFreeNight

  const totalValue     = card.benefits.reduce((s, b) => s + (b.total || 0), 0)
  const usedValue      = card.benefits.reduce((s, b) => s + (b.used  || 0), 0)
  const remainingValue = totalValue - usedValue
  const unusedNights   = card.freeNights.filter((fn) => !fn.used).length

  const issuerColor = ISSUER_COLORS[card.issuer] || 'bg-gray-50 border-gray-200'

  function saveCardNote() {
    onUpdateCardNote(card.id, cardNoteInput)
    setEditingCardNote(false)
  }

  return (
    <div className={`rounded-xl border ${issuerColor} shadow-sm overflow-hidden ${isCardUrgent ? 'border-l-4 border-l-red-500' : ''}`}>

      {/* ── Header ── */}
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="w-full text-left flex items-start justify-between gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{card.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${OWNER_BADGE[card.owner] || 'bg-gray-100 text-gray-600'}`}>
                {card.owner}
              </span>
              {isCardUrgent && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  Urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-gray-500">····{card.num}</span>
              {totalValue > 0 && (
                <span className="text-xs text-gray-600 font-medium">
                  ${remainingValue.toFixed(0)} / ${totalValue} remaining
                </span>
              )}
              {unusedNights > 0 && (
                <span className="text-xs text-amber-700 font-medium">
                  🌙 {unusedNights} night{unusedNights > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <span className="text-gray-400 text-sm mt-1 shrink-0">{collapsed ? '▶' : '▼'}</span>
        </button>

        {/* Card-level note — inline display */}
        {card.cardNote && !editingCardNote && (
          <p
            className="text-xs text-blue-600 mt-1.5 cursor-pointer hover:text-blue-800 italic"
            onClick={() => { setCardNoteInput(card.cardNote); setEditingCardNote(true) }}
            title="Click to edit card note"
          >
            {card.cardNote}
          </p>
        )}

        {/* Card note editor */}
        {editingCardNote ? (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Card note…"
              value={cardNoteInput}
              onChange={(e) => setCardNoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveCardNote()}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
              autoFocus
            />
            <button onClick={saveCardNote} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
            <button onClick={() => setEditingCardNote(false)} className="text-xs text-gray-500 px-1">✕</button>
          </div>
        ) : (
          !card.cardNote && (
            <button
              onClick={() => { setCardNoteInput(''); setEditingCardNote(true) }}
              className="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              + add card note
            </button>
          )
        )}
      </div>

      {/* ── Body ── */}
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
