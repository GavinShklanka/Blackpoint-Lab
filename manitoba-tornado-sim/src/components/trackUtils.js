// Track helpers. Coordinates in events.json are GeoJSON order [lng, lat];
// Leaflet wants [lat, lng]. These helpers convert and reveal a track up to a
// fraction so playback can "draw" the path as the timeline advances.

export function toLatLng(coords) {
  return coords.map(([lng, lat]) => [lat, lng])
}

function dist(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return Math.sqrt(dx * dx + dy * dy)
}

// Returns { path: [[lat,lng]...], head: [lat,lng] } revealed up to fraction f.
export function revealTrack(coords, f) {
  const pts = toLatLng(coords)
  if (pts.length === 0) return { path: [], head: null }
  if (f >= 1) return { path: pts, head: pts[pts.length - 1] }
  if (f <= 0) return { path: [pts[0]], head: pts[0] }

  const segLens = []
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const d = dist(pts[i - 1], pts[i])
    segLens.push(d)
    total += d
  }
  let target = f * total
  const path = [pts[0]]
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const t = segLens[i] === 0 ? 0 : target / segLens[i]
      const a = pts[i]
      const b = pts[i + 1]
      const head = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      path.push(head)
      return { path, head }
    }
    target -= segLens[i]
    path.push(pts[i + 1])
  }
  return { path: pts, head: pts[pts.length - 1] }
}
