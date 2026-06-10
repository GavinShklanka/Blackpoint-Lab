import React from 'react'

// Primary navigation. One click selects any event (so every event summary is
// reachable in a single click from the landing view), or opens the comparison.
export default function EventTabs({ events, selectedId, mode, onSelect, onCompare }) {
  return (
    <nav className="tabs" aria-label="Choose an event or comparison">
      {events.map((ev) => {
        const active = mode === 'event' && ev.id === selectedId
        return (
          <button
            key={ev.id}
            className={`tab ${active ? 'tab--active' : ''} ${ev.status === 'survey_pending' ? 'tab--pending' : ''}`}
            onClick={() => onSelect(ev.id)}
            aria-pressed={active}
          >
            <span className="tab__name">{ev.shortName}</span>
            <span className="tab__date">{ev.dateLabel}</span>
            {ev.status === 'survey_pending' && <span className="tab__flag">Survey pending</span>}
          </button>
        )
      })}
      <button
        className={`tab tab--compare ${mode === 'compare' ? 'tab--active' : ''}`}
        onClick={onCompare}
        aria-pressed={mode === 'compare'}
      >
        <span className="tab__name">Compare all 5</span>
        <span className="tab__date">Side-by-side</span>
      </button>
    </nav>
  )
}
