import React from 'react'
import Badge from './Badge.jsx'

// Side-by-side comparison of all five events across the KPI set. Designed so a
// reviewer with no background can instantly see which storm was most destructive.
export default function CompareView({ events, colors, onInfo, onSelect, strainOneLiner }) {
  const maxCost = Math.max(...events.map((e) => e.kpis.projectedCost.central))
  const maxStrain = Math.max(...events.map((e) => e.kpis.strainIndex.value))
  const mostDestructive = events.reduce((a, b) => (b.kpis.projectedCost.central > a.kpis.projectedCost.central ? b : a))

  const Cell = ({ kpi, children }) => (
    <td>
      <div className="cmp__cellval">{children}</div>
      <Badge tier={kpi.tier} onInfo={onInfo} compact />
    </td>
  )

  return (
    <section className="compare" aria-label="Comparison of all five events">
      <div className="compare__callout">
        <span className="compare__calloutlabel">Most destructive on record</span>
        <strong>{mostDestructive.shortName}</strong> — {mostDestructive.dateLabel}. Strongest storm and the
        highest cost among these five events.
      </div>

      <div className="compare__scroll">
        <table className="cmp">
          <thead>
            <tr>
              <th className="cmp__rowhead">Measure</th>
              {events.map((e) => (
                <th key={e.id} className={e.status === 'survey_pending' ? 'cmp__pending' : ''}>
                  <button className="cmp__colbtn" onClick={() => onSelect(e.id)} style={{ borderColor: colors[e.id] }}>
                    <span className="cmp__colname">{e.shortName}</span>
                    <span className="cmp__coldate">{e.dateLabel}</span>
                    {e.status === 'survey_pending' && <span className="cmp__colflag">Survey pending</span>}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr><th className="cmp__rowhead">EF / F rating</th>{events.map((e) => <Cell key={e.id} kpi={e.kpis.rating}>{e.kpis.rating.value}</Cell>)}</tr>
            <tr><th className="cmp__rowhead">Maximum wind</th>{events.map((e) => <Cell key={e.id} kpi={e.kpis.maxWind}>{e.kpis.maxWind.value}</Cell>)}</tr>
            <tr><th className="cmp__rowhead">Time on ground</th>{events.map((e) => <Cell key={e.id} kpi={e.kpis.duration}>{e.kpis.duration.value}</Cell>)}</tr>
            <tr>
              <th className="cmp__rowhead">Projected cost (2026 CAD)</th>
              {events.map((e) => {
                const c = e.kpis.projectedCost
                const isMax = c.central === maxCost
                return (
                  <td key={e.id} className={isMax ? 'cmp__max' : ''}>
                    <div className="cmp__cellval cmp__cost">{c.centralLabel}</div>
                    <div className="cmp__rangetext">{c.rangeLabel}</div>
                    <div className="cmp__minibar"><div style={{ width: `${(c.central / maxCost) * 100}%`, background: colors[e.id] }} /></div>
                    <Badge tier={c.tier} onInfo={onInfo} compact />
                  </td>
                )
              })}
            </tr>
            <tr><th className="cmp__rowhead">Lives lost</th>{events.map((e) => <Cell key={e.id} kpi={e.kpis.fatalities}>{e.status === 'survey_pending' ? e.kpis.fatalities.display : e.kpis.fatalities.value}</Cell>)}</tr>
            <tr><th className="cmp__rowhead">Injuries</th>{events.map((e) => <Cell key={e.id} kpi={e.kpis.injuries}>{e.status === 'survey_pending' ? e.kpis.injuries.display : e.kpis.injuries.value}</Cell>)}</tr>
            <tr>
              <th className="cmp__rowhead">Emergency-resource strain<br /><small>{strainOneLiner}</small></th>
              {events.map((e) => {
                const s = e.kpis.strainIndex
                return (
                  <td key={e.id} className={s.value === maxStrain ? 'cmp__max' : ''}>
                    <div className="cmp__cellval num">{Number(s.value).toFixed(1)}<span className="kpi__strainmax">/100</span></div>
                    <div className="cmp__minibar"><div style={{ width: `${s.value}%`, background: colors[e.id] }} /></div>
                    <Badge tier={s.tier} onInfo={onInfo} compact />
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="compare__hint">Tap any event heading to open its full map and timeline.</p>
    </section>
  )
}
