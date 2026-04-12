import { useState, useMemo } from 'react'
import { useCardData } from './hooks/useCardData'
import { isUrgent, isFreeNightUrgent } from './lib/periods'
import SummaryBar from './components/SummaryBar'
import FilterBar from './components/FilterBar'
import CardTile from './components/CardTile'
import LoginScreen from './components/LoginScreen'

function groupByIssuer(cards) {
  const groups = {}
  for (const card of cards) {
    if (!groups[card.issuer]) groups[card.issuer] = []
    groups[card.issuer].push(card)
  }
  return groups
}

export default function App() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('cc_auth') === '1'
  )
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { cards, loading, error, updateBenefit, updateFreeNight } = useCardData()

  const filteredCards = useMemo(() => {
    let result = cards

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.issuer.toLowerCase().includes(q)
      )
    }

    if (filter === 'ace') result = result.filter((c) => c.owner === 'ace')
    else if (filter === 'haley') result = result.filter((c) => c.owner === 'haley')
    else if (filter === 'urgent') {
      result = result.filter(
        (c) =>
          c.benefits.some((b) => isUrgent(b.period, b.used, b.total)) ||
          c.freeNights.some((fn) => isFreeNightUrgent(fn.exp) && !fn.used)
      )
    } else if (filter === 'unused') {
      result = result.filter(
        (c) =>
          c.benefits.some((b) => b.used < b.total && b.total > 0) ||
          c.freeNights.some((fn) => !fn.used)
      )
    }

    return result
  }, [cards, filter, search])

  const groups = useMemo(() => groupByIssuer(filteredCards), [filteredCards])

  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <span className="font-bold text-gray-900 text-base sm:text-lg">
              Card Benefits
            </span>
          </div>
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
