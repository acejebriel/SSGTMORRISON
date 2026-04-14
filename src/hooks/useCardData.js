import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentPeriodKey, rollFreeNightExp } from '../lib/periods'
import cardsRaw from '../data/cards.json'

const CARD_NOTE_PREFIX = '__card__'
const HIDDEN_PREFIX    = '__hidden__'

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

      // Load custom cards — non-fatal if table doesn't exist yet
      let customCardRows = []
      try {
        const { data } = await supabase.from('custom_cards').select('*')
        customCardRows = data || []
      } catch (_) {}

      const benefitMap    = {}
      const cardNoteMap   = {}
      const hiddenCardIds = new Set()

      for (const r of (benefitRows || [])) {
        if (r.id.startsWith(HIDDEN_PREFIX)) {
          hiddenCardIds.add(r.id.slice(HIDDEN_PREFIX.length))
        } else if (r.id.startsWith(CARD_NOTE_PREFIX)) {
          cardNoteMap[r.id.slice(CARD_NOTE_PREFIX.length)] = r.notes || ''
        } else {
          benefitMap[r.id] = r
        }
      }

      const fnMap = Object.fromEntries((fnRows || []).map((r) => [r.id, r]))

      function mergeBenefits(cardId, rawBenefits) {
        return (rawBenefits || []).map((b, i) => {
          const bKey          = b.key || `${cardId}-b${i}`
          const saved         = benefitMap[bKey]
          const currentPeriod = getCurrentPeriodKey(b.period)
          let used  = b.used || 0
          let notes = saved?.notes ?? b.note ?? ''

          if (saved) {
            if (saved.reset_period !== currentPeriod) {
              used = 0
              supabase
                .from('benefit_state')
                .upsert({ id: bKey, card_id: cardId, used: 0, notes, reset_period: currentPeriod })
                .then(() => {})
            } else {
              used = saved.used
            }
          }
          return { ...b, key: bKey, used, notes }
        })
      }

      function mergeFreeNights(cardId, rawNights) {
        return (rawNights || []).map((fn, i) => {
          const fnId  = `${cardId}-fn${i}`
          const saved = fnMap[fnId]
          const { exp: rolledExp, autoRolled } = rollFreeNightExp(fn.exp)
          const expStr = rolledExp.format('YYYY-MM-DD')
          const used   = saved ? saved.used : false

          if (saved && saved.exp !== expStr) {
            supabase
              .from('free_night_state')
              .upsert({ id: fnId, card_id: cardId, used, exp: expStr })
              .then(() => {})
          }
          return { ...fn, id: fnId, used, exp: expStr, autoRolled }
        })
      }

      // Built-in cards
      const merged = cardsRaw
        .filter(card => !hiddenCardIds.has(card.id))
        .map(card => ({
          ...card,
          benefits:   mergeBenefits(card.id, card.benefits),
          freeNights: mergeFreeNights(card.id, card.freeNights),
          cardNote:   cardNoteMap[card.id] || '',
        }))

      // Custom cards
      const customMerged = customCardRows
        .filter(row => !hiddenCardIds.has(row.id))
        .map(row => {
          const card = { id: row.id, isCustom: true, ...row.data }
          return {
            ...card,
            benefits:   mergeBenefits(card.id, card.benefits),
            freeNights: mergeFreeNights(card.id, card.freeNights),
            cardNote:   cardNoteMap[card.id] || '',
          }
        })

      setCards([...merged, ...customMerged])
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
    const card    = cards.find((c) => c.id === cardId)
    const benefit = card?.benefits.find((b) => b.key === benefitKey)
    const currentPeriod = getCurrentPeriodKey(benefit?.period || 'annual')
    await supabase.from('benefit_state').upsert({
      id:           benefitKey,
      card_id:      cardId,
      used:         patch.used  !== undefined ? patch.used  : benefit?.used  ?? 0,
      notes:        patch.notes !== undefined ? patch.notes : benefit?.notes ?? '',
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
    const fn   = card?.freeNights.find((f) => f.id === fnId)
    await supabase.from('free_night_state').upsert({
      id:      fnId,
      card_id: cardId,
      used:    patch.used !== undefined ? patch.used : fn?.used ?? false,
      exp:     patch.exp  !== undefined ? patch.exp  : fn?.exp  ?? '',
    })
    touchLastUpdated()
  }, [cards])

  const updateCardNote = useCallback(async (cardId, note) => {
    setCards((prev) =>
      prev.map((card) => card.id !== cardId ? card : { ...card, cardNote: note })
    )
    await supabase.from('benefit_state').upsert({
      id:           `${CARD_NOTE_PREFIX}${cardId}`,
      card_id:      cardId,
      used:         0,
      notes:        note,
      reset_period: '',
    })
    touchLastUpdated()
  }, [])

  const addCard = useCallback(async (cardData) => {
    const id = `custom-${Date.now()}`
    await supabase.from('custom_cards').insert({ id, data: cardData })
    const newCard = {
      id,
      isCustom:   true,
      cardNote:   '',
      ...cardData,
      benefits: (cardData.benefits || []).map((b, i) => ({
        ...b,
        key:   `${id}-b${i}`,
        notes: b.note || '',
      })),
      freeNights: (cardData.freeNights || []).map((fn, i) => ({
        ...fn,
        id:         `${id}-fn${i}`,
        used:       false,
        autoRolled: false,
      })),
    }
    setCards(prev => [...prev, newCard])
    touchLastUpdated()
  }, [])

  const deleteCard = useCallback(async (cardId, isCustom) => {
    setCards(prev => prev.filter(c => c.id !== cardId))
    if (isCustom) {
      await supabase.from('custom_cards').delete().eq('id', cardId)
    } else {
      await supabase.from('benefit_state').upsert({
        id:           `${HIDDEN_PREFIX}${cardId}`,
        card_id:      cardId,
        used:         0,
        notes:        'hidden',
        reset_period: '',
      })
    }
    touchLastUpdated()
  }, [])

  return {
    cards, loading, error, reload: loadData,
    updateBenefit, updateFreeNight, updateCardNote,
    addCard, deleteCard,
    lastUpdated,
  }
}
