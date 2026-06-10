import React from 'react'

// Visual "likely range" bar: low — central — high. Used everywhere a projected
// or inflation-normalized cost is shown, so a number never appears alone.
export default function RangeBar({ low, central, high, format = (v) => `$${v}M` }) {
  const span = high - low || 1
  const pct = (v) => Math.max(0, Math.min(100, ((v - low) / span) * 100))
  return (
    <div className="rangebar" role="img" aria-label={`Likely range ${format(low)} to ${format(high)}, central ${format(central)}`}>
      <div className="rangebar__track">
        <div className="rangebar__fill" />
        <div className="rangebar__center" style={{ left: `${pct(central)}%` }} title={`Central: ${format(central)}`} />
      </div>
      <div className="rangebar__labels">
        <span>{format(low)}</span>
        <span className="rangebar__centerlabel">{format(central)}</span>
        <span>{format(high)}</span>
      </div>
    </div>
  )
}
