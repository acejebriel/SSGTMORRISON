import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useCardData } from './hooks/useCardData'
import SummaryBar from './components/SummaryBar'
import FilterBar from './components/FilterBar'
import CardTile from './components/CardTile'
import LoginScreen from './components/LoginScreen'

// ── Filter helpers ──────────────────────────────────────────────
const HOTEL_ISSUERS = ['Amex Hilton', 'Amex Marriott']
const HOTEL_KEYWORDS = ['hyatt', 'ihg', 'hotel', 'marriott', 'hilton']
const AIRLINE_ISSUERS = ['Amex Delta']
const AIRLINE_KEYWORDS = ['delta', 'united', 'southwest', 'jetblue', 'airline']

function isHotelCard(card) {
  if (HOTEL_ISSUERS.includes(card.issuer)) return true
  const n = card.name.toLowerCase()
  return HOTEL_KEYWORDS.some((k) => n.includes(k))
}

function isAirlineCard(card) {
  if (AIRLINE_ISSUERS.includes(card.issuer)) return true
  const n = card.name.toLowerCase()
  return AIRLINE_KEYWORDS.some((k) => n.includes(k))
}

function applyFilter(cards, filter) {
  switch (filter) {
    case 'ace':       return cards.filter((c) => c.owner === 'ace')
    case 'haley':     return cards.filter((c) => c.owner === 'haley')
    case 'amex-plat': return cards.filter((c) => c.issuer === 'Amex Platinum')
    case 'amex-biz':  return cards.filter((c) => c.issuer === 'Amex Biz Platinum')
    case 'chase':     return cards.filter((c) => c.issuer === 'Chase')
    case 'hotels':    return cards.filter(isHotelCard)
    case 'airlines':  return cards.filter(isAirlineCard)
    default:          return cards
  }
}

// ── Search: match card/issuer OR individual benefits ────────────
function applySearch(cards, query) {
  if (!query.trim()) return cards
  const q = query.toLowerCase()
  const result = []

  for (const card of cards) {
    const cardMatch =
      card.name.toLowerCase().includes(q) ||
      card.issuer.toLowerCase().includes(q)

    if (cardMatch) {
      result.push(card)
      continue
    }

    const matchingBenefits = card.benefits.filter((b) =>
      b.name.toLowerCase().includes(q)
    )
    if (matchingBenefits.length > 0) {
      // Return card with only the matching benefits visible
      result.push({ ...card, benefits: matchingBenefits })
    }
  }

  return result
}

// ── Group by issuer ─────────────────────────────────────────────
function groupByIssuer(cards) {
  const groups = {}
  for (const card of cards) {
    if (!groups[card.issuer]) groups[card.issuer] = []
    groups[card.issuer].push(card)
  }
  return groups
}

// ── Last updated formatter ──────────────────────────────────────
function formatLastUpdated(iso) {
  if (!iso) return null
  const d = dayjs(iso)
  const now = dayjs()
  if (d.isSame(now, 'day')) return `Today at ${d.format('h:mm A')}`
  if (d.isSame(now.subtract(1, 'day'), 'day')) return `Yesterday at ${d.format('h:mm A')}`
  return d.format('MMM D [at] h:mm A')
}

// ── App ─────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('cc_auth') === '1'
  )
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { cards, loading, error, updateBenefit, updateFreeNight, lastUpdated } =
    useCardData()

  const filteredCards = useMemo(() => {
    return applySearch(applyFilter(cards, filter), search)
  }, [cards, filter, search])

  const groups = useMemo(() => groupByIssuer(filteredCards), [filteredCards])

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="font-bold text-gray-900 text-base sm:text-lg">
              Card Benefits
            </span>
          </div>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
            <button
              onClick={() => {
                sessionStorage.removeItem('cc_auth')
                setAuthed(false)
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Last updated on mobile — below the nav row */}
        {lastUpdated && (
          <div className="sm:hidden px-4 pb-2 text-xs text-gray-400">
            Updated {formatLastUpdated(lastUpdated)}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 py-5">
        {loading && (
          <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            Error loading data: {error}
          </div>
        )}
        {!loading && (
          <>
            <SummaryBar cards={filteredCards} />
            <FilterBar
              filter={filter}
              onFilterChange={setFilter}
              search={search}
              onSearchChange={setSearch}
            />

            {Object.keys(groups).length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                No cards match your filters.
              </div>
            ) : (
              Object.entries(groups).map(([issuer, issuerCards]) => (
                <section key={issuer} className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 px-1">
                    {issuer}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {issuerCards.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        onUpdateBenefit={updateBenefit}
                        onUpdateFreeNight={updateFreeNight}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        )}
      </main>
    </div>
  )
}
