import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Pane, Polygon, Polyline, CircleMarker, Tooltip, Popup, ScaleControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { toLatLng, revealTrack } from './trackUtils.js'
import { bufferRing, swathRing, lineLengthKm } from './geometryUtils.js'
import { CITIES } from '../data/cities.js'
import { IMPACT, WINNIPEG_OUTLINE, LAKE_ANCHORS } from '../data/impactShapes.js'
import { TIER_LABEL } from './Badge.jsx'
import LocatorInset from './LocatorInset.jsx'

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const RATING_COLOR = (r) => {
  if (!r) return '#5C6B80'
  if (r.includes('F5')) return '#7f1d1d'
  if (r.includes('EF4') || r.includes('F4')) return '#b91c1c'
  if (r.includes('EF2')) return '#a8631a'
  if (r.includes('EF1')) return '#8A5A14'
  return '#2b6cb0'
}

function eventBounds(event) {
  const pts = []
  ;(IMPACT[event.id]?.swaths || []).forEach((s) => s.line.forEach(([lng, lat]) => pts.push([lat, lng])))
  event.tracks.forEach((tr) => tr.coords.forEach(([lng, lat]) => pts.push([lat, lng])))
  pts.push([49.895, -97.138])      // Winnipeg
  LAKE_ANCHORS.forEach((a) => pts.push(a))
  return L.latLngBounds(pts)
}

function FitExtent({ bounds }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 9, animate: !prefersReduced() })
  }, [bounds]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Once tiles repeatedly fail (CDN unreachable), hide the layer so degraded mode
// is baked geography on clean paper — never a gray field of error tiles.
function ResilientTiles() {
  const tileRef = useRef(null)
  const errs = useRef(0)
  return (
    <TileLayer
      ref={tileRef}
      url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      attribution='&copy; OpenStreetMap contributors &copy; CARTO · Boundaries: Natural Earth'
      eventHandlers={{
        tileerror: () => {
          errs.current += 1
          if (errs.current >= 4 && tileRef.current) tileRef.current.setOpacity(0)
        },
      }}
    />
  )
}

export default function MapView({ event, color, muniFeatures, progress }) {
  const [geo, setGeo] = useState({ boundary: null, lakes: null })
  const bounds = useMemo(() => eventBounds(event), [event])
  const isPending = event.status === 'survey_pending'
  const impact = IMPACT[event.id] || { swaths: [], trackRef: {} }

  const muniNames = useMemo(() => {
    const m = {}
    muniFeatures.forEach((f) => { m[f.properties.id] = f.properties.name })
    return m
  }, [muniFeatures])
  const namesFor = (ids) => (ids || event.affectedMunicipalities).map((id) => muniNames[id]).filter(Boolean)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}geo/manitoba-boundary.geojson`).then((r) => r.json()).catch(() => null),
      fetch(`${base}geo/manitoba-lakes.geojson`).then((r) => r.json()).catch(() => null),
    ]).then(([boundary, lakes]) => setGeo({ boundary, lakes }))
  }, [])

  // Legend (deduped by label), with a provenance tier on every drawn shape.
  const legend = []
  const seen = new Set()
  if (event.tracks.length) legend.push({ label: 'Surveyed tornado track', tier: 'confirmed', kind: 'track' })
  impact.swaths.forEach((s) => {
    if (seen.has(s.label)) return
    seen.add(s.label)
    legend.push({ label: s.label, tier: s.tier, kind: s.hazard })
  })
  legend.push({ label: 'Town / city anchor', kind: 'city' })
  if (impact.winnipegOutline) legend.push({ label: 'City of Winnipeg', kind: 'winnipeg' })
  legend.push({ label: 'Lakes & province (Natural Earth)', kind: 'lake' })

  return (
    <div className="mapwrap">
      <MapContainer bounds={bounds} className="map" scrollWheelZoom={true} zoomControl={true}>
        {/* Baked geography UNDER the tiles: a tile failure degrades to a clean
            paper-and-geography map, not a gray void. */}
        <Pane name="basemap-geo" style={{ zIndex: 150 }} />
        {geo.boundary && <GeoJSON data={geo.boundary} pane="basemap-geo" interactive={false}
          style={{ color: '#16233A', weight: 1.5, fill: false, opacity: 0.85 }} />}
        {geo.lakes && <GeoJSON data={geo.lakes} pane="basemap-geo" interactive={false}
          style={{ color: '#9FB8C8', weight: 0.5, fillColor: '#CFE0EA', fillOpacity: 1, opacity: 1 }} />}

        <ResilientTiles />
        <FitExtent bounds={bounds} />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Elongated storm swaths. Hail uses a distinct teal tint + dense dash
            (a robust substitute for the SVG hatch, which is unreliable in
            Leaflet panes); tornado-warned areas use the event tint + open dash. */}
        {impact.swaths.map((s, i) => {
          const ring = swathRing(s.line, s.halfWidthKm)
          const isHail = s.hazard === 'hail'
          return (
            <Polygon
              key={`${event.id}-swath-${i}`}
              positions={ring}
              pathOptions={isHail
                ? { color: '#2C7DA0', weight: 1.4, dashArray: '3 3', fillColor: '#2C7DA0', fillOpacity: 0.18, opacity: 0.9 }
                : { color, weight: 1.3, dashArray: '7 5', fillColor: color, fillOpacity: 0.16, opacity: 0.8 }}
            >
              <Popup>
                <strong>{s.label}</strong> — {TIER_LABEL[s.tier]}<br />
                {s.cluster && <span>{s.cluster}<br /></span>}
                Approximate, drawn from ECCC warning areas{isPending ? ' (survey pending)' : ''}.<br />
                {namesFor(s.muniIds).length > 0 && <span>Covers: {namesFor(s.muniIds).join(', ')}</span>}
              </Popup>
            </Polygon>
          )
        })}

        {/* Surveyed tornado track corridors — the emphasized element */}
        {event.tracks.map((tr) => {
          const corridor = bufferRing(tr.coords, 0.6)
          const { path, head } = revealTrack(tr.coords, progress)
          const full = toLatLng(tr.coords)
          const ref = impact.trackRef?.[tr.id]
          const lenKm = ref?.lengthKm ?? lineLengthKm(tr.coords)
          const start = full[0]
          const end = full[full.length - 1]
          return (
            <React.Fragment key={tr.id + event.id}>
              <Polygon positions={corridor} interactive={false}
                pathOptions={{ color: RATING_COLOR(tr.rating), weight: 0, fillColor: RATING_COLOR(tr.rating), fillOpacity: 0.25 }} />
              <Polyline positions={full} pathOptions={{ color: '#475569', weight: 1.5, opacity: 0.3, dashArray: '3 6' }} />
              <Polyline positions={path} pathOptions={{ color: RATING_COLOR(tr.rating), weight: 5.5, opacity: 1 }}>
                <Popup>
                  <strong>Surveyed tornado track — {tr.rating}</strong> · {TIER_LABEL.confirmed}<br />
                  Path length ≈ {lenKm.toFixed(1)} km<br />
                  {ref?.maxWidthM ? `Max width ≈ ${ref.maxWidthM} m (${ref.source})` : 'Max width not individually surveyed'}
                </Popup>
              </Polyline>
              {[start, end].map((tick, ti) => (
                <CircleMarker key={ti} center={tick} radius={3.5}
                  pathOptions={{ color: '#16233A', weight: 1.5, fillColor: '#ffffff', fillOpacity: 1 }}>
                  <Tooltip>{ti === 0 ? 'Track start' : 'Track end'}</Tooltip>
                </CircleMarker>
              ))}
              {head && (
                <CircleMarker center={head} radius={6} pathOptions={{ color: '#16233A', weight: 2, fillColor: RATING_COLOR(tr.rating), fillOpacity: 1 }}>
                  <Tooltip>{tr.rating} tornado</Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          )
        })}

        {/* City of Winnipeg footprint — carries the June 9 exposure argument.
            Its label is anchored south of centre to avoid the Winnipeg dot. */}
        {impact.winnipegOutline && (
          <>
            <Polygon positions={toLatLng(WINNIPEG_OUTLINE)} interactive={false}
              pathOptions={{ color: '#5C6B80', weight: 1.5, dashArray: '5 5', fillColor: '#5C6B80', fillOpacity: 0.05 }} />
            <CircleMarker center={[49.735, -97.10]} radius={0.1}
              pathOptions={{ opacity: 0, fillOpacity: 0 }}>
              <Tooltip permanent direction="bottom" className="citylabel citylabel--area">City of Winnipeg</Tooltip>
            </CircleMarker>
          </>
        )}

        {/* City anchors */}
        {CITIES.filter((c) => c.always || bounds.pad(0.12).contains([c.lat, c.lng])).map((c) => (
          <CircleMarker key={c.name} center={[c.lat, c.lng]} radius={c.name === 'Winnipeg' ? 4.5 : 3}
            pathOptions={{ color: '#16233A', weight: 1.5, fillColor: '#16233A', fillOpacity: 1 }}>
            <Tooltip permanent direction="right" offset={[6, 0]} className={`citylabel ${c.name === 'Winnipeg' ? 'citylabel--major' : ''}`}>
              {c.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Legend + provenance banner stacked top-right so neither is clipped. */}
      <div className="map__topright">
        <div className="map__legend">
          {legend.map((it) => (
            <span className="map__legend-item" key={it.label}>
              <span className={`swatch swatch--${it.kind}`} style={it.kind === 'tornado' ? { background: color } : undefined} />
              {it.label}{it.tier && <em className="map__legend-tier"> · {TIER_LABEL[it.tier]}</em>}
            </span>
          ))}
          {impact.hailCaption && <span className="map__legend-cap">Hail footprint approximate — survey pending.</span>}
        </div>
        {isPending && <div className="map__cornernote">Approximate — drawn from ECCC warning areas (survey pending)</div>}
      </div>

      <LocatorInset />
    </div>
  )
}
