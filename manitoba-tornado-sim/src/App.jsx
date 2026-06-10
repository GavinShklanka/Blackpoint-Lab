import React, { useEffect, useMemo, useRef, useState } from 'react'
import data from './data/events.json'
import muniData from './data/municipalities.geo.json'
import EventTabs from './components/EventTabs.jsx'
import MapView from './components/MapView.jsx'
import KpiPanel from './components/KpiPanel.jsx'
import Timeline from './components/Timeline.jsx'
import CompareView from './components/CompareView.jsx'
import InfoModal from './components/InfoModal.jsx'
import Badge, { TIER_LABEL } from './components/Badge.jsx'

const PLAYBACK_MS = 9000

const EVENT_COLORS = {
  'elie-2007': '#7c2d12',
  'alonsa-2018': '#b91c1c',
  'june20-2023': '#c2410c',
  'june2-2026': '#0d9488',
  'june9-2026': '#6d28d9',
}

export default function App() {
  const events = data.events
  const meta = data.meta
  const colors = EVENT_COLORS

  const [mode, setMode] = useState('event') // 'event' | 'compare'
  const [selectedId, setSelectedId] = useState(events[0].id)
  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [info, setInfo] = useState(null) // tier key | 'strain' | null

  const rafRef = useRef(null)
  const startRef = useRef(0)

  const selected = useMemo(() => events.find((e) => e.id === selectedId), [events, selectedId])

  // Reset playback whenever the chosen event changes.
  useEffect(() => {
    setProgress(0)
    setIsPlaying(false)
  }, [selectedId])

  // requestAnimationFrame playback loop.
  useEffect(() => {
    if (!isPlaying) return
    startRef.current = performance.now() - progress * PLAYBACK_MS
    const tick = (now) => {
      const p = Math.min(1, (now - startRef.current) / PLAYBACK_MS)
      setProgress(p)
      if (p >= 1) { setIsPlaying(false); return }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectEvent = (id) => { setSelectedId(id); setMode('event') }
  const onScrub = (p) => { setIsPlaying(false); setProgress(p) }
  const togglePlay = () => {
    if (progress >= 1) setProgress(0)
    setIsPlaying((v) => !v)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="topbar__kicker">Blackpoint Lab · Emergency-Management Briefing</span>
          <h1>{meta.title}</h1>
          <p className="topbar__purpose">{meta.purpose}</p>
          <p className="topbar__sub">{meta.subtitle} · all figures in {meta.currency}</p>
        </div>
        <div className="topbar__legend">
          <span className="topbar__legendlabel">Every figure is labelled:</span>
          <div className="topbar__badges">
            {Object.keys(meta.tiers).map((t) => (
              <Badge key={t} tier={t} onInfo={setInfo} />
            ))}
          </div>
        </div>
      </header>

      <EventTabs
        events={events}
        selectedId={selectedId}
        mode={mode}
        onSelect={selectEvent}
        onCompare={() => setMode('compare')}
      />

      {mode === 'compare' ? (
        <main className="stage stage--compare">
          <CompareView events={events} colors={colors} onInfo={setInfo} onSelect={selectEvent} strainOneLiner={meta.strainMethodology.oneLiner} />
        </main>
      ) : (
        <main className="stage">
          <div className="stage__left">
            <MapView
              event={selected}
              color={colors[selected.id]}
              muniFeatures={muniData.features}
              progress={progress}
            />
            <Timeline
              steps={selected.timeline}
              progress={progress}
              isPlaying={isPlaying}
              onScrub={onScrub}
              onTogglePlay={togglePlay}
            />
          </div>
          <div className="stage__right">
            <KpiPanel event={selected} color={colors[selected.id]} onInfo={setInfo} strainOneLiner={meta.strainMethodology.oneLiner} />
          </div>
        </main>
      )}

      <footer className="foot">
        <span>Sources: Environment and Climate Change Canada (ECCC) · Northern Tornadoes Project (NTP) · Manitoba Hydro outage data · CatIQ insured-loss threshold.</span>
        <span>Reviewed {meta.lastReviewed}. Municipal boundaries are simplified for clarity.</span>
      </footer>

      {info && (
        <InfoModal
          title={info === 'strain' ? 'Emergency-Resource Strain Index' : `Data tier: ${TIER_LABEL[info]}`}
          onClose={() => setInfo(null)}
        >
          {info === 'strain' ? (
            <>
              <p className="modal__lead">{meta.strainMethodology.oneLiner}</p>
              <p className="modal__tag">Labelled “{meta.strainMethodology.label}” in the interface.</p>
              <p>{meta.strainMethodology.plain}</p>
              <ul className="modal__list">
                {meta.strainMethodology.components.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </>
          ) : (
            <>
              <p><Badge tier={info} /></p>
              <p>{meta.tiers[info].blurb}</p>
            </>
          )}
        </InfoModal>
      )}
    </div>
  )
}
