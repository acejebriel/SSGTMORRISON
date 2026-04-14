import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentPeriodKey, rollFreeNightExp } from '../lib/periods'
import cardsRaw from '../data/cards.json'

const CARD_NOTE_PREFIX = '__card__'

export function useCardData() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(
    () => localStorage.getItem('cc_last_updated') || null
  )

  function touchLastUpdated() {
    const now = new Date().toISOString()
    localStorage.setItem('cc_last_updated', now)
    setLastUpdated(now)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data: benefitRows, error: bErr }, { data: fnRows, error: fnErr }] =
        await Promise.all([
          supabase.from('benefit_state').select('*'),
          supabase.from('free_night_state').select('*'),
        ])

      if (bErr) throw bErr
      if (fnErr) throw fnErr

      // Separate card notes (stored with special prefix) from benefit rows
      const benefitMap = {}
      const cardNoteMap = {}
      for (const r of (benefitRows || [])) {
        if (r.id.startsWith(CARD_NOTE_PREFIX)) {
          cardNoteMap[r.id.slice(CARD_NOTE_PREFIX.length)] = r.notes || ''
        } else {
          benefitMap[r.id] = r
        }
      }

      const fnMap = Object.fromEntries((fnRows || []).map((r) => [r.id, r]))

      const merged = cardsRaw.map((card) => {
        const benefits = card.benefits.map((b) => {
          const saved = benefitMap[b.key]
          const currentPeriod = getCurrentPeriodKey(b.period)

          let used = b.used
          // Use Supabase note if it exists; fall back to JSON default note
          let notes = saved?.notes || b.note || ''
          let resetPeriod = currentPeriod

          if (saved) {
            if (saved.reset_period !== currentPeriod) {
              // Period rolled — reset used, keep notes
              used = 0
              supabase
                .from('benefit_state')
                .upsert({ id: b.key, card_id: card.id, used: 0, notes, reset_period: currentPeriod })
                .then(() => {})
            } else {
              used = saved.used
            }
          }

          return { ...b, used, notes, resetPeriod }
        })

        const freeNights = (card.freeNights || []).map((fn, i) => {
          const fnId = `${card.id}-fn${i}`
          const saved = fnMap[fnId]
          const { exp: rolledExp, autoRolled } = rollFreeNightExp(fn.exp)
          const expStr = rolledExp.format('YYYY-MM-DD')
          const used = saved ? saved.used : false

          if (saved && saved.exp !== expStr) {
            supabase
              .from('free_night_state')
              .upsert({ id: fnId, card_id: card.id, used, exp: expStr })
              .then(() => {})
          }
          return { ...fn, id: fnId, used, exp: expStr, autoRolled }
        })

        const cardNote = cardNoteMap[card.id] || ''
        return { ...card, benefits, freeNights, cardNote }
      })

      setCards(merged)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const updateBenefit = useCallback(async (benefitKey, cardId, patch) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id !== cardId ? card : {
          ...card,
          benefits: card.benefits.map((b) =>
            b.key !== benefitKey ? b : { ...b, ...patch }
          ),
        }
      )
    )
    const card = cards.find((c) => c.id === cardId)
    const benefit = card?.benefits.find((b) => b.key === benefitKey)
    const currentPeriod = getCurrentPeriodKey(benefit?.period || 'annual')
    await supabase.from('benefit_state').upsert({
      id: benefitKey,
      card_id: cardId,
      used:  patch.used  !== undefined ? patch.used  : benefit?.used  ?? 0,
      notes: patch.notes !== undefined ? patch.notes : benefit?.notes ?? '',
      reset_period: currentPeriod,
    })
    touchLastUpdated()
  }, [cards])

  const updateFreeNight = useCallback(async (fnId, cardId, patch) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id !== cardId ? card : {
          ...card,
          freeNights: card.freeNights.map((fn) =>
            fn.id !== fnId ? fn : { ...fn, ...patch }
          ),
        }
      )
    )
    const card = cards.find((c) => c.id === cardId)
    const fn = card?.freeNights.find((f) => f.id === fnId)
    await supabase.from('free_night_state').upsert({
      id: fnId,
      card_id: cardId,
      used: patch.used !== undefined ? patch.used : fn?.used ?? false,
      exp:  patch.exp  !== undefined ? patch.exp  : fn?.exp  ?? '',
    })
    touchLastUpdated()
  }, [cards])

  const updateCardNote = useCallback(async (cardId, note) => {
    setCards((prev) =>
      prev.map((card) => card.id !== cardId ? card : { ...card, cardNote: note })
    )
    await supabase.from('benefit_state').upsert({
      id: `${CARD_NOTE_PREFIX}${cardId}`,
      card_id: cardId,
      used: 0,
      notes: note,
      reset_period: '',
    })
    touchLastUpdated()
  }, [])

  return { cards, loading, error, reload: loadData, updateBenefit, updateFreeNight, updateCardNote, lastUpdated }
}
