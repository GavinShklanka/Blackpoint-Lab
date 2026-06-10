import React from 'react'

const TIER_LABEL = {
  confirmed: 'Confirmed',
  historical_estimate: 'Historical estimate',
  projection: 'Projection',
}

// Data-tier badge. Every figure in the app must carry one — a figure without a
// badge is a defect. Clicking the badge opens the plain-English tier explainer.
export default function Badge({ tier, onInfo, compact = false }) {
  const label = TIER_LABEL[tier] || 'Unknown'
  return (
    <button
      type="button"
      className={`badge badge--${tier} ${compact ? 'badge--compact' : ''}`}
      onClick={onInfo ? () => onInfo(tier) : undefined}
      title={onInfo ? `What does “${label}” mean?` : label}
      aria-label={`Data tier: ${label}. Click to learn more.`}
    >
      <span className="badge__dot" aria-hidden="true" />
      {label}
    </button>
  )
}

export { TIER_LABEL }
