// Geometry helpers for meteorologically honest impact shapes. Input coordinates
// are GeoJSON order [lng, lat]; Leaflet outputs are [lat, lng].

const DEG_PER_KM = 1 / 111.32

function haversineKm(a, b) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const lat1 = toRad(a[1]); const lat2 = toRad(b[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function lineLengthKm(coords) {
  let total = 0
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i])
  return total
}

// Buffer a polyline ([lng,lat] points) by halfWidthKm on each side, returning a
// closed corridor ring as [lat,lng] points for Leaflet. Works in a local planar
// frame so the corridor width is isotropic.
export function bufferRing(coords, halfWidthKm) {
  if (coords.length < 2) return []
  const meanLat = coords.reduce((s, c) => s + c[1], 0) / coords.length
  const kx = Math.cos((meanLat * Math.PI) / 180)
  const toXY = ([lng, lat]) => [lng * kx, lat]
  const fromXY = ([x, y]) => [y, x / kx] // -> [lat, lng]
  const pts = coords.map(toXY)
  const hw = halfWidthKm * DEG_PER_KM

  const normals = pts.map((p, i) => {
    const prev = pts[Math.max(0, i - 1)]
    const next = pts[Math.min(pts.length - 1, i + 1)]
    let dx = next[0] - prev[0]
    let dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy) || 1
    dx /= len; dy /= len
    return [-dy, dx] // perpendicular
  })

  const left = pts.map((p, i) => [p[0] + normals[i][0] * hw, p[1] + normals[i][1] * hw])
  const right = pts.map((p, i) => [p[0] - normals[i][0] * hw, p[1] - normals[i][1] * hw])
  const ring = [...left, ...right.reverse(), left[0]]
  return ring.map(fromXY)
}

// Elongated storm swath from a 2+ point centre line.
export function swathRing(line, halfWidthKm) {
  return bufferRing(line, halfWidthKm)
}

export const toLatLng = (coords) => coords.map(([lng, lat]) => [lat, lng])
