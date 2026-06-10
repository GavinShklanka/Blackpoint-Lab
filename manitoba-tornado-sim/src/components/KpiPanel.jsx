import React from 'react'
import Badge from './Badge.jsx'
import RangeBar from './RangeBar.jsx'

function KpiCard({ label, children, kpi, onInfo, accent }) {
  return (
    <div className={`kpi ${accent ? 'kpi--accent' : ''}`}>
      <div className="kpi__head">
        <span className="kpi__label">{label}</span>
        <Badge tier={kpi.tier} onInfo={onInfo} compact />
      </div>
      <div className="kpi__value">{children}</div>
      <div className="kpi__source">Source: {kpi.source}</div>
    </div>
  )
}

function StrainMeter({ value }) {
  return (
    <div className="strain">
      <div className="strain__bar"><div className="strain__fill" style={{ width: `${value}%` }} /></div>
      <div className="strain__scale"><span>0</span><span>Heaviest strain · 100</span></div>
    </div>
  )
}

// The per-event KPI panel. Every figure carries a data-tier badge and a source
// line. Costs are shown with their likely range, never as a lone number.
export default function KpiPanel({ event, color, onInfo }) {
  const k = event.kpis
  const isPending = event.status === 'survey_pending'

  return (
    <section className="panel" aria-label={`Key figures for ${event.name}`}>
      <header className="panel__head" style={{ borderColor: color }}>
        <div>
          <h2 className="panel__title">{event.name}</h2>
          <p className="panel__headline">{event.headline}</p>
        </div>
      </header>

      {isPending && (
        <div className="pending" role="status">
          <span className="pending__tag">Damage survey pending</span>
          <p>{event.pendingBanner}</p>
        </div>
      )}

      <div className="kpi-grid">
        <KpiCard label="EF / F rating" kpi={k.rating} onInfo={onInfo}>{k.rating.value}</KpiCard>
        <KpiCard label="Maximum wind" kpi={k.maxWind} onInfo={onInfo}>{k.maxWind.value}</KpiCard>
        <KpiCard label="Time on the ground" kpi={k.duration} onInfo={onInfo}>{k.duration.value}</KpiCard>
        <KpiCard label="Recorded damage" kpi={k.recordedDamage} onInfo={onInfo}>{k.recordedDamage.value}</KpiCard>

        <KpiCard label="Projected cost (2026 CAD)" kpi={k.projectedCost} onInfo={onInfo} accent>
          <div className="kpi__central">{k.projectedCost.centralLabel}</div>
          <div className="kpi__range">{k.projectedCost.rangeLabel}</div>
          <RangeBar
            low={k.projectedCost.low}
            central={k.projectedCost.central}
            high={k.projectedCost.high}
            format={(v) => `$${v}M`}
          />
        </KpiCard>

        <KpiCard label="Lives lost" kpi={k.fatalities} onInfo={onInfo}>{k.fatalities.display}</KpiCard>
        <KpiCard label="Injuries" kpi={k.injuries} onInfo={onInfo}>{k.injuries.display}</KpiCard>

        <KpiCard label="Emergency-resource strain" kpi={k.strainIndex} onInfo={onInfo}>
          <div className="kpi__strainrow">
            <span className="kpi__strainval">{k.strainIndex.value}<span className="kpi__strainmax">/100</span></span>
            <button className="infobtn" onClick={() => onInfo('strain')} aria-label="How is the strain index calculated?">How is this calculated?</button>
          </div>
          <StrainMeter value={k.strainIndex.value} />
        </KpiCard>
      </div>

      {event.projection && (
        <div className="projbox">
          <h3>What's driving the projection</h3>
          <p className="projbox__method">{event.projection.method}</p>
          <div className="projbox__drivers">
            {event.projection.drivers.map((d) => (
              <div key={d.name} className="driver">
                <span className="driver__name">{d.name}</span>
                <span className="driver__val">≈ ${d.median}M</span>
                <span className="driver__note">{d.note}</span>
              </div>
            ))}
          </div>
          <p className="projbox__cat">
            <strong>{Math.round(event.projection.insuredCatProb * 100)}% chance</strong> this becomes an
            insured catastrophe ({event.projection.insuredCatThreshold}). Anchored to a peak of{' '}
            <strong>{event.projection.peakOutages.toLocaleString()}</strong> Manitoba Hydro customers without power.
          </p>
        </div>
      )}
    </section>
  )
}
