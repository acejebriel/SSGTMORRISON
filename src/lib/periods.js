import dayjs from 'dayjs'

// All quarterly period types — treated identically (rolling quarters)
const QUARTERLY = ['quarterly', 'jan-mar', 'apr-jun', 'jul-sep', 'oct-dec']

/**
 * Stable key for the current active period window — used to detect rollovers.
 */
export function getCurrentPeriodKey(period) {
  const now   = dayjs()
  const p     = (period || '').toLowerCase().trim()
  const year  = now.year()
  const month = now.month() + 1
  const q     = Math.ceil(month / 3)

  if (p === 'monthly')          return `${year}-${String(month).padStart(2, '0')}`
  if (QUARTERLY.includes(p))    return `${year}-Q${q}`
  if (p === 'jan-jun')          return month <= 6 ? `${year}-H1` : `${year}-H1-done`
  if (p === 'jul-dec')          return month >= 7 ? `${year}-H2` : `${year}-H2-wait`
  return `${year}-annual`
}

/**
 * Human-readable label showing the CURRENT active period with year.
 *
 * @param {string} period      - period key from cards.json
 * @param {string} [resetDate] - "MM-DD" for anniversary resets (e.g. "10-03" for Oct 3)
 */
export function getPeriodLabel(period, resetDate) {
  const now   = dayjs()
  const p     = (period || '').toLowerCase().trim()
  const year  = now.year()
  const month = now.month() + 1
  const q     = Math.ceil(month / 3)

  // Anniversary-year credits (CSR, etc.) — show the next reset date
  if (resetDate) {
    const thisYearReset = dayjs(`${year}-${resetDate}`)
    const next = now.isAfter(thisYearReset, 'day')
      ? thisYearReset.add(1, 'year')
      : thisYearReset
    return `Resets ${next.format('MMM D, YYYY')}`
  }

  if (p === 'monthly') return now.format('MMMM YYYY')              // "April 2026"

  if (QUARTERLY.includes(p)) {
    const labels = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec']
    return `${labels[q - 1]} ${year}`                              // "Apr–Jun 2026"
  }

  if (p === 'annual') return String(year)                          // "2026"

  // Half-year windows
  if (p === 'jan-jun') {
    return month <= 6 ? `Jan–Jun ${year}` : `Jan–Jun ${year + 1}`
  }
  if (p === 'jul-dec') {
    return `Jul–Dec ${year}`
  }

  return period || String(year)
}

/**
 * True when a benefit period is ending soon and there is remaining value.
 */
export function isUrgent(period, used, total) {
  if (total <= 0 || used >= total) return false

  const now   = dayjs()
  const p     = (period || '').toLowerCase().trim()
  const month = now.month() + 1
  const day   = now.date()

  if (p === 'monthly') return now.daysInMonth() - day <= 6

  if (QUARTERLY.includes(p)) {
    const isLastMonthOfQuarter = [3, 6, 9, 12].includes(month)
    return isLastMonthOfQuarter && now.daysInMonth() - day <= 14
  }

  if (p === 'jan-jun')  return month === 6  && day >= 17
  if (p === 'jul-dec')  return month === 12 && day >= 17
  if (p === 'annual')   return month === 12 && day >= 1
  return false
}

/**
 * Auto-roll a free-night expiration to next year if it has passed.
 * Returns { exp: dayjsObj, autoRolled: boolean }
 */
export function rollFreeNightExp(expStr) {
  const exp = dayjs(expStr)
  const now = dayjs()
  if (exp.isBefore(now, 'day')) {
    return { exp: exp.add(1, 'year'), autoRolled: true }
  }
  return { exp, autoRolled: false }
}

/** True if a free night expires within 60 days. */
export function isFreeNightUrgent(expStr) {
  const diff = dayjs(expStr).diff(dayjs(), 'day')
  return diff >= 0 && diff <= 60
}
