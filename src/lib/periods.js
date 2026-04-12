import dayjs from 'dayjs'

/**
 * Given a period label, return a stable string key representing the *current*
 * active period window.  Used to detect roll-overs.
 *
 * period values (case-insensitive):
 *   "monthly"        → "2024-Apr"
 *   "quarterly"      → "2024-Q2"
 *   "Jan-Mar" / "Apr-Jun" / "Jul-Sep" / "Oct-Dec"   (fixed 3-month window)
 *   "Jan-Jun" / "Jul-Dec"   (fixed semi-annual)
 *   "annual"         → "2024-annual"
 *   anything else    → treat as annual
 */
export function getCurrentPeriodKey(period) {
  const now = dayjs()
  const p = (period || '').toLowerCase().trim()
  const year = now.year()
  const month = now.month() + 1 // 1-based

  if (p === 'monthly') {
    return `${year}-${now.format('MMM')}`
  }

  if (p === 'quarterly') {
    const q = Math.ceil(month / 3)
    return `${year}-Q${q}`
  }

  // Fixed semi-annual windows by name
  if (p === 'jan-jun') return month <= 6 ? `${year}-H1` : `${year}-H2-missed`
  if (p === 'jul-dec') return month >= 7 ? `${year}-H2` : `${year}-H1-missed`

  // Fixed quarterly windows by name
  if (p === 'jan-mar') return `${year}-${month <= 3 ? 'Q1' : month <= 6 ? 'Q2-p' : month <= 9 ? 'Q3-p' : 'Q4-p'}`
  if (p === 'apr-jun') return `${year}-${month <= 6 && month >= 4 ? 'Q2' : 'Q-other'}`
  if (p === 'jul-sep') return `${year}-${month <= 9 && month >= 7 ? 'Q3' : 'Q-other'}`
  if (p === 'oct-dec') return `${year}-${month >= 10 ? 'Q4' : 'Q-other'}`

  // annual (default)
  return `${year}-annual`
}

/**
 * Human-readable label for a period (shown on the card).
 */
export function getPeriodLabel(period) {
  const p = (period || '').toLowerCase().trim()
  if (p === 'monthly') return 'Monthly'
  if (p === 'quarterly') return 'Quarterly'
  if (p === 'jan-jun') return 'Jan – Jun'
  if (p === 'jul-dec') return 'Jul – Dec'
  if (p === 'jan-mar') return 'Jan – Mar'
  if (p === 'apr-jun') return 'Apr – Jun'
  if (p === 'jul-sep') return 'Jul – Sep'
  if (p === 'oct-dec') return 'Oct – Dec'
  if (p === 'annual') return 'Annual'
  return period || 'Annual'
}

/**
 * Returns true when a benefit should be considered "urgent" — i.e. the period
 * is ending soon and there is remaining value.
 */
export function isUrgent(period, used, total) {
  if (used >= total) return false
  const remaining = total - used
  if (remaining <= 0) return false

  const now = dayjs()
  const p = (period || '').toLowerCase().trim()
  const month = now.month() + 1 // 1-based
  const day = now.date()

  // Monthly: last 7 days of the month
  if (p === 'monthly') {
    const daysInMonth = now.daysInMonth()
    return daysInMonth - day <= 6
  }

  // Quarterly (calendar)
  if (p === 'quarterly') {
    const quarterEndMonths = [3, 6, 9, 12]
    const isLastMonthOfQuarter = quarterEndMonths.includes(month)
    return isLastMonthOfQuarter && daysInMonth(now) - day <= 14
  }

  // Semi-annual windows — last 2 weeks of the window
  if (p === 'jan-jun') return month === 6 && day >= 17
  if (p === 'jul-dec') return month === 12 && day >= 17

  // Named quarterly windows
  if (p === 'jan-mar') return month === 3 && day >= 17
  if (p === 'apr-jun') return month === 6 && day >= 17
  if (p === 'jul-sep') return month === 9 && day >= 17
  if (p === 'oct-dec') return month === 12 && day >= 17

  // Annual: last month of the year
  if (p === 'annual') return month === 12 && day >= 1

  return false
}

function daysInMonth(d) {
  return d.daysInMonth()
}

/**
 * Auto-roll a free-night expiration date to next year if it has passed.
 * Returns a dayjs object.
 */
export function rollFreeNightExp(expStr) {
  const exp = dayjs(expStr)
  const now = dayjs()
  if (exp.isBefore(now, 'day')) {
    return exp.add(1, 'year')
  }
  return exp
}

/**
 * Returns true if a free-night is expiring within 60 days.
 */
export function isFreeNightUrgent(expStr) {
  const exp = dayjs(expStr)
  const now = dayjs()
  return exp.diff(now, 'day') <= 60 && exp.diff(now, 'day') >= 0
}
