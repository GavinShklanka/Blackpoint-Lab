// City anchors for map orientation. Winnipeg is always shown; the rest appear
// when they fall within the current event's view, so a labelled town is always
// visible. Coordinates are [lat, lng].
export const CITIES = [
  { name: 'Winnipeg', lat: 49.895, lng: -97.138, always: true },
  { name: 'Brandon', lat: 49.848, lng: -99.950 },
  { name: 'Portage la Prairie', lat: 49.973, lng: -98.292 },
  { name: 'Elie', lat: 49.905, lng: -97.753 },
  { name: 'Alonsa', lat: 50.780, lng: -99.000 },
  { name: 'Carman', lat: 49.500, lng: -98.000 },
  { name: 'Winkler', lat: 49.182, lng: -97.939 },
  { name: 'Altona', lat: 49.104, lng: -97.558 },
  { name: 'Morden', lat: 49.192, lng: -98.101 },
  { name: 'Selkirk', lat: 50.144, lng: -96.884 },
  { name: 'Stonewall', lat: 50.135, lng: -97.323 },
  { name: 'Steinbach', lat: 49.526, lng: -96.685 },
  { name: 'Gimli', lat: 50.631, lng: -96.990 },
  { name: 'Dauphin', lat: 51.149, lng: -100.050 },
  { name: 'Miami', lat: 49.371, lng: -98.232 },
  { name: 'Manitou', lat: 49.248, lng: -98.534 },
]
