import React, { useEffect, useState, useMemo } from 'react'

const W = 124, H = 100, PAD = 5

function polygonsOf(geom) {
  if (geom.type === 'Polygon') return [geom.coordinates]
  if (geom.type === 'MultiPolygon') return geom.coordinates
  return []
}

// Canada locator built from the authoritative provinces GeoJSON: every
// province in a warm grey, Manitoba filled gold. Replaces the freehand blob.
export default function LocatorInset() {
  const [fc, setFc] = useState(null)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}geo/canada-provinces-locator.geojson`)
      .then((r) => r.json())
      .then((d) => { if (alive) setFc(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const paths = useMemo(() => {
    if (!fc) return null
    let lngMin = Infinity, lngMax = -Infinity, latMin = Infinity, latMax = -Infinity
    fc.features.forEach((f) => polygonsOf(f.geometry).forEach((poly) => poly.forEach((ring) => ring.forEach(([lng, lat]) => {
      if (lng < lngMin) lngMin = lng; if (lng > lngMax) lngMax = lng
      if (lat < latMin) latMin = lat; if (lat > latMax) latMax = lat
    }))))
    const midLat = (latMin + latMax) / 2
    const kx = Math.cos((midLat * Math.PI) / 180)
    const wRange = (lngMax - lngMin) * kx
    const hRange = latMax - latMin
    const scale = Math.min((W - 2 * PAD) / wRange, (H - 2 * PAD) / hRange)
    const ox = (W - wRange * scale) / 2
    const oy = (H - hRange * scale) / 2
    const px = (lng) => ox + (lng - lngMin) * kx * scale
    const py = (lat) => oy + (latMax - lat) * scale

    return fc.features.map((f) => {
      let d = ''
      polygonsOf(f.geometry).forEach((poly) => poly.forEach((ring) => {
        ring.forEach(([lng, lat], i) => { d += (i === 0 ? 'M' : 'L') + px(lng).toFixed(1) + ' ' + py(lat).toFixed(1) + ' ' })
        d += 'Z '
      }))
      return { name: f.properties.name, isMB: f.properties.is_manitoba, d }
    })
  }, [fc])

  return (
    <div className="locator" aria-label="Locator map: Manitoba within Canada">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-hidden="true">
        {paths && paths.map((p) => (
          <path key={p.name} d={p.d} fillRule="evenodd"
            fill={p.isMB ? '#B08A2E' : '#EFEDE6'}
            stroke={p.isMB ? '#16233A' : '#B9B4A6'} strokeWidth={p.isMB ? 0.7 : 0.4} strokeLinejoin="round" />
        ))}
      </svg>
      <span className="locator__cap">Manitoba, Canada</span>
    </div>
  )
}
