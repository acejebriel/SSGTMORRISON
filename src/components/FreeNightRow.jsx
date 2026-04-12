import dayjs from 'dayjs'
import { isFreeNightUrgent } from '../lib/periods'

export default function FreeNightRow({ fn, cardId, onUpdate }) {
  const exp = dayjs(fn.exp)
  const urgent = isFreeNightUrgent(fn.exp)
  const expired = exp.isBefore(dayjs(), 'day')

  function toggle() {
    onUpdate(fn.id, cardId, { used: !fn.used })
  }

  return (
    <div
      className={`flex items-center gap-3 py-2 border-b border-gray-100 last:border-0 ${
        urgent && !fn.used ? 'bg-orange-50' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={fn.used}
        onChange={toggle}
        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
      />
      <div className="flex-1">
        <span
          className={`text-sm font-medium ${
            fn.used ? 'line-through text-gray-400' : 'text-gray-800'
          }`}
        >
          {fn.label}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">
            Expires {exp.format('MMM D, YYYY')}
            {expired && ' (auto-rolled)'}
          </span>
          {urgent && !fn.used && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
              Expiring soon
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
