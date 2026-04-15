import { useState } from 'react'

const ISSUERS = [
  'Amex Platinum', 'Amex Biz Platinum', 'Amex Delta', 'Amex Gold',
  'Amex Hilton', 'Amex Marriott', 'Chase', 'Citi', 'Other',
]

const PERIODS = [
  { value: 'monthly',  label: 'Monthly' },
  { value: 'annual',   label: 'Annual' },
  { value: 'Jan-Mar',  label: 'Jan–Mar (Q1)' },
  { value: 'Apr-Jun',  label: 'Apr–Jun (Q2)' },
  { value: 'Jul-Sep',  label: 'Jul–Sep (Q3)' },
  { value: 'Oct-Dec',  label: 'Oct–Dec (Q4)' },
  { value: 'Jan-Jun',  label: 'Jan–Jun (H1)' },
  { value: 'Jul-Dec',  label: 'Jul–Dec (H2)' },
]

const emptyBenefit  = () => ({ name: '', note: '', total: '', period: 'annual' })
const emptyNight    = () => ({ label: '', exp: '' })

export default function AddCardModal({ onAdd, onClose }) {
  const [name,       setName]       = useState('')
  const [num,        setNum]        = useState('')
  const [issuer,     setIssuer]     = useState('Amex Platinum')
  const [owner,      setOwner]      = useState('ace')
  const [benefits,   setBenefits]   = useState([emptyBenefit()])
  const [freeNights, setFreeNights] = useState([])
  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState(null)

  function updateBenefit(i, field, value) {
    setBenefits(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: value } : b))
  }
  function updateNight(i, field, value) {
    setFreeNights(prev => prev.map((fn, idx) => idx === i ? { ...fn, [field]: value } : fn))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await onAdd({
        name:    name.trim(),
        num:     num.trim() || undefined,
        issuer,
        owner,
      benefits: benefits
        .filter(b => b.name.trim())
        .map(b => ({
          name:   b.name.trim(),
          note:   b.note.trim() || undefined,
          total:  parseFloat(b.total) || 0,
          period: b.period,
          used:   0,
        })),
      freeNights: freeNights
        .filter(fn => fn.label.trim() && fn.exp)
        .map(fn => ({ label: fn.label.trim(), exp: fn.exp })),
      })
      onClose()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">Add New Card</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
          {/* Card info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Card Name</label>
              <input
                type="text"
                placeholder="e.g. Plat 7"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Digits</label>
              <input
                type="text"
                placeholder="e.g. 1234"
                value={num}
                onChange={e => setNum(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</label>
              <select
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="ace">Ace</option>
                <option value="haley">Haley</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Issuer</label>
              <select
                value={issuer}
                onChange={e => setIssuer(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {ISSUERS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Benefits */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Benefits</p>
              <button
                type="button"
                onClick={() => setBenefits(prev => [...prev, emptyBenefit()])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add benefit
              </button>
            </div>
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Benefit name"
                      value={b.name}
                      onChange={e => updateBenefit(i, 'name', e.target.value)}
                      className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <button type="button" onClick={() => setBenefits(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 text-xs px-1 shrink-0">✕</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Total $"
                      min={0}
                      value={b.total}
                      onChange={e => updateBenefit(i, 'total', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <select
                      value={b.period}
                      onChange={e => updateBenefit(i, 'period', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Note (optional, e.g. United)"
                    value={b.note}
                    onChange={e => updateBenefit(i, 'note', e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Free Nights */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Free Nights</p>
              <button
                type="button"
                onClick={() => setFreeNights(prev => [...prev, emptyNight()])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add night
              </button>
            </div>
            <div className="space-y-2">
              {freeNights.map((fn, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label (e.g. Free night award)"
                    value={fn.label}
                    onChange={e => updateNight(i, 'label', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <input
                    type="date"
                    value={fn.exp}
                    onChange={e => updateNight(i, 'exp', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                  <button type="button" onClick={() => setFreeNights(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 text-xs shrink-0">✕</button>
                </div>
              ))}
              {freeNights.length === 0 && (
                <p className="text-xs text-gray-400 italic">No free nights — click "+ Add night" to add one.</p>
              )}
            </div>
          </div>

          {/* Error */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-xs">
              Failed to save: {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-gray-100">
            <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {saving ? 'Saving…' : 'Add Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
