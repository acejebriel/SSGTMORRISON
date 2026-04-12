export default function ProgressBar({ used, total }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const color =
    pct >= 100
      ? 'bg-green-500'
      : pct >= 60
      ? 'bg-blue-500'
      : pct >= 30
      ? 'bg-yellow-400'
      : 'bg-red-400'

  return (
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
      <div
        className={`${color} h-1.5 rounded-full transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
