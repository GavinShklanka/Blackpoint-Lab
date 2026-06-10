import React, { useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, Polygon, Polyline, CircleMarker, Tooltip, ScaleControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import { toLatLng, revealTrack } from './trackUtils.js'
import { CITIES } from '../data/cities.js'
import manitobaBorder from '../data/manitoba-border.geo.json'
import LocatorInset from './LocatorInset.jsx'

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Gather every coordinate for the event (affected municipalities + tracks) plus
// Winnipeg, so the view always frames the event against a known anchor.
function eventBounds(event, muniFeatures) {
  const pts = []
  const affected = new Set(event.affectedMunicipalities)
  muniFeatures.forEach((f) => {
    if (affected.has(f.properties.id)) f.geometry.coordinates[0].forEach(([lng, lat]) => pts.push([lat, lng]))
  })
  event.tracks.forEach((tr) => tr.coords.forEach(([lng, lat]) => pts.push([lat, lng])))
  pts.push([49.895, -97.138]) // Winnipeg, always in frame
  return L.latLngBounds(pts)
}

function FitExtent({ bounds }) {
  const map = useMap()
  React.useEffect(() => {
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 10, animate: !prefersReduced() })
  }, [bounds]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const RATING_COLOR = (r) => {
  if (!r) return '#5C6B80'
  if (r.includes('F5')) return '#7f1d1d'
  if (r.includes('EF4') || r.includes('F4')) return '#b91c1c'
  if (r.includes('EF2')) return '#a8631a'
  if (r.includes('EF1')) return '#8A5A14'
  return '#2b6cb0'
}

export default function MapView({ event, color, muniFeatures, progress }) {
  const affected = new Set(event.affectedMunicipalities)
  const bounds = useMemo(() => eventBounds(event, muniFeatures), [event, muniFeatures])
  const isPending = event.status === 'survey_pending'

  const polygons = useMemo(() => muniFeatures.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    positions: f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]),
  })), [muniFeatures])

  const visibleCities = CITIES.filter((c) => c.always || bounds.pad(0.15).contains([c.lat, c.lng]))

  return (
    <div className="mapwrap">
      <MapContainer bounds={bounds} className="map" scrollWheelZoom={true} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        <FitExtent bounds={bounds} />
        <ScaleControl position="bottomleft" imperial={false} />

        {/* Provincial boundary — subtle ink-navy stroke, no fill */}
        <GeoJSON data={manitobaBorder} interactive={false} style={{ color: '#16233A', weight: 1.5, fill: false, opacity: 0.7 }} />

        {/* Municipal boundaries; affected areas shaded as an approximate footprint */}
        {polygons.map((p) => {
          const isAffected = affected.has(p.id)
          return (
            <Polygon
              key={p.id + event.id}
              positions={p.positions}
              pathOptions={{
                color: isAffected ? color : '#9aa5b1',
                weight: isAffected ? 1.6 : 0.8,
                dashArray: isAffected ? '5 5' : undefined,
                fillColor: isAffected ? color : '#cbd2d9',
                fillOpacity: isAffected ? 0.18 : 0,
                opacity: isAffected ? 0.85 : 0.3,
              }}
            >
              <Tooltip sticky>
                <strong>{p.name}</strong>
                {isAffected && <div className="map__tip">Approximate affected area{isPending ? ' — survey pending' : ''}</div>}
              </Tooltip>
            </Polygon>
          )
        })}

        {/* Surveyed tornado tracks — the emphasized element */}
        {event.tracks.map((tr) => {
          const { path, head } = revealTrack(tr.coords, progress)
          const full = toLatLng(tr.coords)
          return (
            <React.Fragment key={tr.id + event.id}>
              <Polyline positions={full} pathOptions={{ color: '#475569', weight: 2, opacity: 0.3, dashArray: '3 6' }} />
              <Polyline positions={path} pathOptions={{ color: RATING_COLOR(tr.rating), weight: 5.5, opacity: 1 }}>
                <Tooltip sticky>Surveyed tornado track — rated {tr.rating}</Tooltip>
              </Polyline>
              {head && (
                <CircleMarker center={head} radius={6.5} pathOptions={{ color: '#16233A', weight: 2, fillColor: RATING_COLOR(tr.rating), fillOpacity: 1 }}>
                  <Tooltip>{tr.rating} tornado</Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          )
        })}

        {isPending && (
          <CircleMarker
            center={event.center}
            radius={14 + progress * 9}
            pathOptions={{ color: color, weight: 1.5, dashArray: '4 4', fillColor: color, fillOpacity: 0.1 }}
          >
            <Tooltip>Approximate impact area — ground survey pending</Tooltip>
          </CircleMarker>
        )}

        {/* City anchors */}
        {visibleCities.map((c) => (
          <CircleMarker
            key={c.name}
            center={[c.lat, c.lng]}
            radius={c.name === 'Winnipeg' ? 4.5 : 3}
            pathOptions={{ color: '#16233A', weight: 1.5, fillColor: '#16233A', fillOpacity: 1 }}
          >
            <Tooltip permanent direction="right" offset={[6, 0]} className={`citylabel ${c.name === 'Winnipeg' ? 'citylabel--major' : ''}`}>
              {c.name}
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {isPending && <div className="map__cornernote">Approximate — ground survey pending</div>}

      <div className="map__legend">
        <span className="map__legend-item"><span className="swatch" style={{ background: color }} /> Approximate affected area</span>
        <span className="map__legend-item"><span className="swatch swatch--track" /> Surveyed tornado track</span>
        <span className="map__legend-item"><span className="swatch swatch--city" /> Town / city anchor</span>
      </div>

      <LocatorInset />
    </div>
  )
}
