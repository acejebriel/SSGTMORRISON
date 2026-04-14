import { useState } from 'react'
import ProgressBar from './ProgressBar'
import { getPeriodLabel, isUrgent } from '../lib/periods'

export default function BenefitRow({ benefit, cardId, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [usedInput, setUsedInput] = useState('')
  const [editingNote, setEditingNote] = useState(false)
  const [noteInput, setNoteInput] = useState(benefit.notes || '')

  const { used, total, name, period, notes, resetDate } = benefit
  const urgent = isUrgent(period, used, total)
  const remaining = Math.max(0, total - used)
  const periodLabel = getPeriodLabel(period, resetDate)
  const hasDollarValue = total > 0

  function handleUsedSave() {
    const val = parseFloat(usedInput)
    if (!isNaN(val)) onUpdate(benefit.key, cardId, { used: Math.min(val, total) })
    setEditing(false)
  }

  function handleNoteSave() {
    onUpdate(benefit.key, cardId, { notes: noteInput })
    setEditingNote(false)
  }

  return (
    <div className={`py-2 border-b border-gray-100 last:border-0 ${urgent ? 'bg-red-50' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        {/* Left: name + inline note + period */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-800 leading-tight">{name}</span>
            {urgent && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                Urgent
              </span>
            )}
          </div>

          {/* Inline note — always visible when populated */}
          {notes && !editingNote && (
            <p
              className="text-xs text-blue-600 mt-0.5 cursor-pointer hover:text-blue-800"
              onClick={() => { setNoteInput(notes); setEditingNote(true) }}
              title="Click to edit note"
            >
              {notes}
            </p>
          )}

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{periodLabel}</span>
            {hasDollarValue && (
              <span className="text-xs text-gray-400">${remaining.toFixed(0)} left</span>
            )}
          </div>
          {hasDollarValue && <ProgressBar used={used} total={total} />}
        </div>

        {/* Right: amount button + note toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {hasDollarValue && (
            <button
              onClick={() => { setUsedInput(String(used)); setEditing(true) }}
              className="text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
            >
              ${used} / ${total}
            </button>
          )}
          {!notes && (
            <button
              onClick={() => { setNoteInput(''); setEditingNote(true) }}
              title="Add note"
              className="text-xs text-gray-400 hover:bg-gray-100 px-1.5 py-1 rounded transition-colors"
            >
              ✎
            </button>
          )}
        </div>
      </div>

      {/* Inline amount editor */}
      {editing && (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-gray-500">Used: $</label>
          <input
            type="number" min={0} max={total} step={0.01}
            value={usedInput}
            onChange={(e) => setUsedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUsedSave()}
            className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
          />
          <button onClick={handleUsedSave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
          <button onClick={() => setEditing(false)} className="text-xs text-gray-500 px-1">Cancel</button>
        </div>
      )}

      {/* Note editor */}
      {editingNote && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Add a note…"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNoteSave()}
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            autoFocus
          />
          <button onClick={handleNoteSave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Save</button>
          <button onClick={() => setEditingNote(false)} className="text-xs text-gray-500 px-1">Cancel</button>
        </div>
      )}
    </div>
  )
}
