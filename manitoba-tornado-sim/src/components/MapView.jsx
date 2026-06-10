import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Pane, Polygon, Polyline, CircleMarker, Tooltip, Popup, ScaleControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { toLatLng, revealTrack } from './trackUtils.js'
import { bufferRing, swathRing, lineLengthKm } from './geometryUtils.js'
import { CITIES } from '../data/cities.js'
import { IMPACT, LAKE_ANCHORS } from '../data/impactShapes.js'
import { TIER_LABEL } from './Badge.jsx'
import LocatorInset from './LocatorInset.jsx'

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

// Map view updates are instant (no decorative pan) — playback is the only motion.
function FitExtent({ bounds }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 9, animate: false })
  }, [bounds]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// CARTO Voyager basemap supplies real-world road and built-up texture on the
// live site (we never draw our own land texture). If the tile CDN fails
// repeatedly, hide the layer so degraded mode is the baked geography on clean
// paper, never a gray field.
function ResilientTiles() {
  const tileRef = useRef(null)
  const errs = useRef(0)
  return (
    <TileLayer
      ref={tileRef}
      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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

const roadStyle = (f) => f.properties?.type === 'Major Highway'
  ? { color: '#A9988F', weight: 1.5 }
  : { color: '#C9BFA8', weight: 0.75 }

// Locate the Winnipeg footprint in the unlabelled urban file (contains downtown).
function findWinnipeg(urban) {
  if (!urban) return null
  for (const f of urban.features) {
    const ring = f.geometry.coordinates[0]
    const xs = ring.map((p) => p[0]); const ys = ring.map((p) => p[1])
    if (Math.min(...xs) <= -97.14 && -97.14 <= Math.max(...xs) && Math.min(...ys) <= 49.90 && 49.90 <= Math.max(...ys)) {
      let south = ring[0]
      ring.forEach((p) => { if (p[1] < south[1]) south = p })
      return { south: [south[1], south[0]] }
    }
  }
  return null
}

export default function MapView({ event, color, muniFeatures, progress }) {
  const [geo, setGeo] = useState({ boundary: null, lakes: null, rivers: null, roads: null, urban: null })
  const [legendOpen, setLegendOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1100 : true))
  const bounds = useMemo(() => eventBounds(event), [event])
  const isPending = event.status === 'survey_pending'
  const impact = IMPACT[event.id] || { swaths: [], trackRef: {} }
  const winnipeg = useMemo(() => findWinnipeg(geo.urban), [geo.urban])

  const muniNames = useMemo(() => {
    const m = {}
    muniFeatures.forEach((f) => { m[f.properties.id] = f.properties.name })
    return m
  }, [muniFeatures])
  const namesFor = (ids) => (ids || event.affectedMunicipalities).map((id) => muniNames[id]).filter(Boolean)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    const load = (n) => fetch(`${base}geo/${n}.geojson`).then((r) => r.json()).catch(() => null)
    Promise.all([
      load('manitoba-boundary'), load('manitoba-lakes'), load('manitoba-rivers'),
      load('manitoba-roads'), load('manitoba-urban'),
    ]).then(([boundary, lakes, rivers, roads, urban]) => setGeo({ boundary, lakes, rivers, roads, urban }))
  }, [])

  const legend = []
  const seen = new Set()
  if (event.tracks.length) legend.push({ label: 'Surveyed tornado track', tier: 'confirmed', kind: 'track' })
  impact.swaths.forEach((s) => { if (!seen.has(s.label)) { seen.add(s.label); legend.push({ label: s.label, tier: s.tier, kind: s.hazard }) } })
  legend.push({ label: 'Town / city anchor', kind: 'city' })
  if (impact.winnipegOutline) legend.push({ label: 'City of Winnipeg', kind: 'winnipeg' })
  legend.push({ label: 'Highways', kind: 'road' })
  legend.push({ label: 'Built-up area', kind: 'urban' })
  legend.push({ label: 'Rivers', kind: 'river' })
  legend.push({ label: 'Lakes & province (Natural Earth)', kind: 'lake' })

  return (
    <div className="mapwrap">
      <MapContainer bounds={bounds} className="map" scrollWheelZoom={true} zoomControl={true}>
        {/* Baked geography UNDER the tiles (tile-independent): renders on paper if
            the tile CDN is unreachable. Order bottom→top: lakes, rivers, roads,
            urban, province boundary. */}
        <Pane name="basemap-geo" style={{ zIndex: 150 }} />
        {geo.lakes && <GeoJSON data={geo.lakes} pane="basemap-geo" interactive={false}
          style={{ color: '#9FB8C8', weight: 0.5, fillColor: '#CFE0EA', fillOpacity: 1, opacity: 1 }} />}
        {geo.roads && <GeoJSON data={geo.roads} pane="basemap-geo" interactive={false} style={roadStyle} />}
        {geo.urban && <GeoJSON data={geo.urban} pane="basemap-geo" interactive={false}
          style={{ color: '#A99B7E', weight: 0.5, fillColor: '#D8CDB8', fillOpacity: 0.5 }} />}
        {geo.boundary && <GeoJSON data={geo.boundary} pane="basemap-geo" interactive={false}
          style={{ color: '#16233A', weight: 1.5, fill: false, opacity: 0.85 }} />}

        {/* Rivers sit just above the tiles so their name popups are clickable
            (an under-tile layer is unreachable beneath opaque basemap tiles),
            while still rendering on paper in the tiles-blocked state. */}
        <Pane name="rivers-pane" style={{ zIndex: 250 }} />
        {geo.rivers && <GeoJSON data={geo.rivers} pane="rivers-pane"
          style={{ color: '#9FB8C8', weight: 0.8 }}
          onEachFeature={(f, layer) => { if (f.properties?.name) layer.bindPopup(`${f.properties.name} River`) }} />}

        <ResilientTiles />
        <FitExtent bounds={bounds} />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Elongated storm swaths */}
        {impact.swaths.map((s, i) => {
          const ring = swathRing(s.line, s.halfWidthKm)
          const isHail = s.hazard === 'hail'
          return (
            <Polygon key={`${event.id}-swath-${i}`} positions={ring}
              pathOptions={isHail
                ? { color: '#2C7DA0', weight: 1.4, dashArray: '3 3', fillColor: '#2C7DA0', fillOpacity: 0.18, opacity: 0.9 }
                : { color, weight: 1.3, dashArray: '7 5', fillColor: color, fillOpacity: 0.16, opacity: 0.8 }}>
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
          const start = full[0]; const end = full[full.length - 1]
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

        {/* City of Winnipeg label, anchored south of the real footprint so it
            clears the Winnipeg city dot. */}
        {impact.winnipegOutline && winnipeg && (
          <CircleMarker center={winnipeg.south} radius={0.1} pathOptions={{ opacity: 0, fillOpacity: 0 }}>
            <Tooltip permanent direction="bottom" className="citylabel citylabel--area">City of Winnipeg</Tooltip>
          </CircleMarker>
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

      <div className="map__topright">
        <div className={`map__legend ${legendOpen ? '' : 'map__legend--collapsed'}`}>
          <button className="map__legend-toggle" onClick={() => setLegendOpen((v) => !v)} aria-expanded={legendOpen}>
            <span>Legend</span>
            <span className="map__legend-chevron" aria-hidden="true">{legendOpen ? '▾' : '▸'}</span>
          </button>
          {legendOpen && (
            <div className="map__legend-body">
              {legend.map((it) => (
                <span className="map__legend-item" key={it.label}>
                  <span className={`swatch swatch--${it.kind}`} style={it.kind === 'tornado' ? { background: color } : undefined} />
                  {it.label}{it.tier && <em className="map__legend-tier"> · {TIER_LABEL[it.tier]}</em>}
                </span>
              ))}
              {impact.hailCaption && <span className="map__legend-cap">Hail footprint approximate — survey pending.</span>}
            </div>
          )}
        </div>
        {isPending && <div className="map__cornernote">Approximate — drawn from ECCC warning areas (survey pending)</div>}
      </div>

      <LocatorInset />
    </div>
  )
}
