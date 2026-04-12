import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentPeriodKey, rollFreeNightExp } from '../lib/periods'
import cardsRaw from '../data/cards.json'
import dayjs from 'dayjs'

/**
 * Loads card data, merges with Supabase-persisted state, and exposes
 * update helpers.
 */
export function useCardData() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch persisted state from Supabase
      const [{ data: benefitRows, error: bErr }, { data: fnRows, error: fnErr }] =
        await Promise.all([
          supabase.from('benefit_state').select('*'),
          supabase.from('free_night_state').select('*'),
        ])

      if (bErr) throw bErr
      if (fnErr) throw fnErr

      const benefitMap = Object.fromEntries((benefitRows || []).map((r) => [r.id, r]))
      const fnMap = Object.fromEntries((fnRows || []).map((r) => [r.id, r]))

      const merged = cardsRaw.map((card) => {
        const benefits = card.benefits.map((b) => {
          const saved = benefitMap[b.key]
          const currentPeriod = getCurrentPeriodKey(b.period)

          let used = b.used
          let notes = ''
          let resetPeriod = currentPeriod

          if (saved) {
            notes = saved.notes || ''
            if (saved.reset_period !== currentPeriod) {
              // Period rolled over — reset used to 0 and update DB
              used = 0
              resetPeriod = currentPeriod
              // Fire-and-forget the reset
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
          // Auto-roll expiry if past
          const rolledExp = rollFreeNightExp(fn.exp).format('YYYY-MM-DD')
          const used = saved ? saved.used : false
          // Sync rolled date back to DB if it changed
          if (saved && saved.exp !== rolledExp) {
            supabase
              .from('free_night_state')
              .upsert({ id: fnId, card_id: card.id, used, exp: rolledExp })
              .then(() => {})
          }
          return { ...fn, id: fnId, used, exp: rolledExp }
        })

        return { ...card, benefits, freeNights }
      })

      setCards(merged)
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateBenefit = useCallback(async (benefitKey, cardId, patch) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id !== cardId
          ? card
          : {
              ...card,
              benefits: card.benefits.map((b) =>
                b.key !== benefitKey ? b : { ...b, ...patch }
              ),
            }
      )
    )
    const currentCard = cards.find((c) => c.id === cardId)
    const currentBenefit = currentCard?.benefits.find((b) => b.key === benefitKey)
    const currentPeriod = getCurrentPeriodKey(currentBenefit?.period || 'annual')
    await supabase.from('benefit_state').upsert({
      id: benefitKey,
      card_id: cardId,
      used: patch.used !== undefined ? patch.used : currentBenefit?.used ?? 0,
      notes: patch.notes !== undefined ? patch.notes : currentBenefit?.notes ?? '',
      reset_period: currentPeriod,
    })
  }, [cards])

  const updateFreeNight = useCallback(async (fnId, cardId, patch) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id !== cardId
          ? card
          : {
              ...card,
              freeNights: card.freeNights.map((fn) =>
                fn.id !== fnId ? fn : { ...fn, ...patch }
              ),
            }
      )
    )
    const currentCard = cards.find((c) => c.id === cardId)
    const currentFn = currentCard?.freeNights.find((fn) => fn.id === fnId)
    await supabase.from('free_night_state').upsert({
      id: fnId,
      card_id: cardId,
      used: patch.used !== undefined ? patch.used : currentFn?.used ?? false,
      exp: patch.exp !== undefined ? patch.exp : currentFn?.exp ?? '',
    })
  }, [cards])

  return { cards, loading, error, reload: loadData, updateBenefit, updateFreeNight }
}
