import React, { useEffect, useMemo, useState } from 'react'
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

// Frame the event against known anchors: Winnipeg plus a lake always in view, so
// southern Manitoba stays recognizable (we never zoom tighter than that).
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
  const affectedNames = event.affectedMunicipalities.map((id) => muniNames[id]).filter(Boolean)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    Promise.all([
      fetch(`${base}geo/manitoba-boundary.geojson`).then((r) => r.json()).catch(() => null),
      fetch(`${base}geo/manitoba-lakes.geojson`).then((r) => r.json()).catch(() => null),
    ]).then(([boundary, lakes]) => setGeo({ boundary, lakes }))
  }, [])

  // Legend, with a provenance tier on every drawn impact shape.
  const legend = []
  if (event.tracks.length) legend.push({ label: 'Surveyed tornado track', tier: 'confirmed', kind: 'track' })
  impact.swaths.forEach((s) => legend.push({ label: s.label, tier: s.tier, kind: s.hazard }))
  legend.push({ label: 'Town / city anchor', kind: 'city' })
  if (impact.winnipegOutline) legend.push({ label: 'City of Winnipeg', kind: 'winnipeg' })
  legend.push({ label: 'Lakes & province (Natural Earth)', kind: 'lake' })

  return (
    <div className="mapwrap">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <pattern id="hailHatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="#2C7DA0" fillOpacity="0.10" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="#2C7DA0" strokeWidth="2.2" strokeOpacity="0.55" />
          </pattern>
        </defs>
      </svg>

      <MapContainer bounds={bounds} className="map" scrollWheelZoom={true} zoomControl={true}>
        {/* Baked geography sits UNDER the tiles; if the tile CDN fails the map
            degrades to a clean paper-and-geography view instead of gray void. */}
        <Pane name="basemap-geo" style={{ zIndex: 150 }} />
        {geo.boundary && <GeoJSON data={geo.boundary} pane="basemap-geo" interactive={false}
          style={{ color: '#16233A', weight: 1.5, fill: false, opacity: 0.85 }} />}
        {geo.lakes && <GeoJSON data={geo.lakes} pane="basemap-geo" interactive={false}
          style={{ color: '#9FB8C8', weight: 0.5, fillColor: '#CFE0EA', fillOpacity: 1, opacity: 1 }} />}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO · Boundaries: Natural Earth'
        />
        <FitExtent bounds={bounds} />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Elongated storm swaths (replaces round blobs) */}
        {impact.swaths.map((s, i) => {
          const ring = swathRing(s.line, s.halfWidthKm)
          const isHail = s.hazard === 'hail'
          return (
            <Polygon
              key={`${event.id}-swath-${i}`}
              positions={ring}
              pathOptions={{
                className: isHail ? 'swath-hail' : undefined,
                color: isHail ? '#2C7DA0' : color,
                weight: 1.3,
                dashArray: '6 5',
                fillColor: color,
                fillOpacity: isHail ? 0 : 0.16,
                opacity: 0.8,
              }}
            >
              <Popup>
                <strong>{s.label}</strong> — {TIER_LABEL[s.tier]}<br />
                Approximate, drawn from ECCC warning areas{isPending ? ' (survey pending)' : ''}.<br />
                {affectedNames.length > 0 && <span>Within: {affectedNames.join(', ')}</span>}
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

        {/* City of Winnipeg footprint — carries the June 9 exposure argument */}
        {impact.winnipegOutline && (
          <Polygon positions={toLatLng(WINNIPEG_OUTLINE)}
            pathOptions={{ color: '#5C6B80', weight: 1.5, dashArray: '5 5', fillColor: '#5C6B80', fillOpacity: 0.05 }}>
            <Tooltip permanent direction="center" className="citylabel citylabel--area">City of Winnipeg</Tooltip>
          </Polygon>
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

      {isPending && <div className="map__cornernote">Approximate — drawn from ECCC warning areas (survey pending)</div>}

      <div className="map__legend">
        {legend.map((it) => (
          <span className="map__legend-item" key={it.label}>
            <span className={`swatch swatch--${it.kind}`} style={it.kind === 'tornado' ? { background: color } : undefined} />
            {it.label}{it.tier && <em className="map__legend-tier"> · {TIER_LABEL[it.tier]}</em>}
          </span>
        ))}
      </div>

      <LocatorInset />
    </div>
  )
}
