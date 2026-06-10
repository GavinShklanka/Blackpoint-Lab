import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { toLatLng, revealTrack } from './trackUtils.js'

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.9 })
  }, [center[0], center[1], zoom]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const RATING_COLOR = (r) => {
  if (!r) return '#6b7280'
  if (r.includes('F5')) return '#7f1d1d'
  if (r.includes('EF4') || r.includes('F4')) return '#b91c1c'
  if (r.includes('EF2')) return '#d97706'
  if (r.includes('EF1')) return '#ca8a04'
  return '#0ea5e9'
}

// The Manitoba map: light vector basemap, municipal boundaries (affected ones
// shaded in the event colour), surveyed tornado tracks revealed by playback,
// and an explicit "survey pending" treatment for the June 9 event.
export default function MapView({ event, color, muniFeatures, progress }) {
  const affected = new Set(event.affectedMunicipalities)

  const polygons = useMemo(() => muniFeatures.map((f) => ({
    id: f.properties.id,
    name: f.properties.name,
    positions: f.geometry.coordinates[0].map(([lng, lat]) => [lat, lng]),
  })), [muniFeatures])

  return (
    <div className="mapwrap">
      <MapContainer center={event.center} zoom={event.zoom} className="map" scrollWheelZoom={true} zoomControl={true}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
        <FlyTo center={event.center} zoom={event.zoom} />

        {polygons.map((p) => {
          const isAffected = affected.has(p.id)
          return (
            <Polygon
              key={p.id + event.id}
              positions={p.positions}
              pathOptions={{
                color: isAffected ? color : '#9aa5b1',
                weight: isAffected ? 2 : 1,
                fillColor: isAffected ? color : '#cbd2d9',
                fillOpacity: isAffected ? 0.32 : 0.04,
                opacity: isAffected ? 0.9 : 0.35,
              }}
            >
              <Tooltip sticky>
                <strong>{p.name}</strong>
                {isAffected && <div className="map__tip">Among the areas most impacted</div>}
              </Tooltip>
            </Polygon>
          )
        })}

        {event.tracks.map((tr) => {
          const { path, head } = revealTrack(tr.coords, progress)
          const full = toLatLng(tr.coords)
          return (
            <React.Fragment key={tr.id + event.id}>
              <Polyline positions={full} pathOptions={{ color: '#475569', weight: 2, opacity: 0.25, dashArray: '4 6' }} />
              <Polyline positions={path} pathOptions={{ color: RATING_COLOR(tr.rating), weight: 5, opacity: 0.95 }}>
                <Tooltip sticky>Tornado track — rated {tr.rating}</Tooltip>
              </Polyline>
              {head && (
                <CircleMarker center={head} radius={7} pathOptions={{ color: '#111827', weight: 2, fillColor: RATING_COLOR(tr.rating), fillOpacity: 1 }}>
                  <Tooltip>{tr.rating} tornado</Tooltip>
                </CircleMarker>
              )}
            </React.Fragment>
          )
        })}

        {event.tracks.length === 0 && (
          <CircleMarker
            center={event.center}
            radius={16 + progress * 10}
            pathOptions={{ color: color, weight: 2, fillColor: color, fillOpacity: 0.18 }}
          >
            <Tooltip>Survey pending — no confirmed track yet</Tooltip>
          </CircleMarker>
        )}
        <CircleMarker center={event.center} radius={5} pathOptions={{ color: '#111827', weight: 2, fillColor: color, fillOpacity: 1 }}>
          <Tooltip>{event.shortName} — {event.dateLabel}</Tooltip>
        </CircleMarker>
      </MapContainer>

      <div className="map__legend" aria-hidden="false">
        <span className="map__legend-item"><span className="swatch" style={{ background: color }} /> Areas most impacted</span>
        <span className="map__legend-item"><span className="swatch swatch--track" /> Surveyed tornado track</span>
        {event.tracks.length === 0 && <span className="map__legend-item map__legend-pending">Survey pending — no track</span>}
      </div>
    </div>
  )
}
