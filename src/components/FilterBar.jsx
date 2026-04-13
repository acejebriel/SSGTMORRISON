const FILTERS = [
  { key: 'all',       label: 'All' },
  { key: 'ace',       label: 'Ace' },
  { key: 'haley',     label: 'Haley' },
  { key: 'amex-plat', label: 'Amex Platinum' },
  { key: 'amex-biz',  label: 'Amex Biz Plat' },
  { key: 'chase',     label: 'Chase' },
  { key: 'hotels',    label: 'Hotels' },
  { key: 'airlines',  label: 'Airlines' },
]

export default function FilterBar({ filter, onFilterChange, search, onSearchChange }) {
  return (
    <div className="flex flex-col gap-3 mb-5">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="Search cards, issuers, or benefits (e.g. lululemon)…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
      />
    </div>
  )
}
