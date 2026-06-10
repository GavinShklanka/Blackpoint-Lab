import React from 'react'

// Duration-playback scrubber with plain-English time labels. Drives the map's
// animated track reveal via the shared `progress` value (0..1).
export default function Timeline({ steps, progress, isPlaying, onScrub, onTogglePlay }) {
  if (!steps || steps.length === 0) return null
  const n = steps.length
  const activeIndex = Math.min(n - 1, Math.round(progress * (n - 1)))

  return (
    <section className="timeline" aria-label="Event playback timeline">
      <div className="timeline__controls">
        <button className="timeline__play" onClick={onTogglePlay} aria-label={isPlaying ? 'Pause playback' : 'Play event'}>
          {isPlaying ? '❚❚ Pause' : '▶ Play event'}
        </button>
        <input
          className="timeline__slider"
          type="range"
          min="0"
          max="1000"
          value={Math.round(progress * 1000)}
          onChange={(e) => onScrub(Number(e.target.value) / 1000)}
          aria-label="Scrub through the event timeline"
        />
        <span className="timeline__time">{steps[activeIndex].t}</span>
      </div>
      <ol className="timeline__steps">
        {steps.map((s, i) => (
          <li key={i} className={`timeline__step ${i === activeIndex ? 'timeline__step--active' : ''} ${i < activeIndex ? 'timeline__step--past' : ''}`}>
            <span className="timeline__steptime">{s.t}</span>
            <span className="timeline__steplabel">{s.label}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
