import { RANGES } from '../lib/dateRange'

export default function RangePicker({ range, setRange, customRange, setCustomRange }) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              range === r.key ? 'bg-(--accent) text-white' : 'bg-(--elevated) text-(--muted)'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={customRange.start}
            onChange={(e) => setCustomRange((c) => ({ ...c, start: e.target.value }))}
            className="rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text) outline-none focus:border-(--accent)"
          />
          <span className="text-sm text-(--muted)">hasta</span>
          <input
            type="date"
            value={customRange.end}
            onChange={(e) => setCustomRange((c) => ({ ...c, end: e.target.value }))}
            className="rounded-lg border border-(--border) bg-(--card) px-3 py-2 text-sm text-(--text) outline-none focus:border-(--accent)"
          />
        </div>
      )}
    </div>
  )
}
