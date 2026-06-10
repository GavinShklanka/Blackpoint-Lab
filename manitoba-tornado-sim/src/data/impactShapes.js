// Honest impact geometry per event. Round blobs are replaced by elongated
// storm swaths aligned with documented storm motion (NE/E across Manitoba), and
// tornado events lead with their surveyed track corridor. Centre lines are
// [lng, lat]; swaths are constrained to the ECCC-warned municipalities.
//
// tier follows the public badge vocabulary: surveyed tracks are "confirmed";
// approximated swaths are "projection".

export const IMPACT = {
  'elie-2007': {
    swaths: [
      { hazard: 'tornado', tier: 'projection', label: 'Storm-affected swath',
        line: [[-98.30, 49.96], [-97.93, 49.93], [-97.54, 49.91]], halfWidthKm: 7 },
    ],
    trackRef: { 'elie-main': { lengthKm: 5.5, maxWidthM: 300, source: 'ECCC / NTP survey' } },
  },
  'alonsa-2018': {
    swaths: [
      { hazard: 'tornado', tier: 'projection', label: 'Storm-affected swath',
        line: [[-99.10, 50.55], [-98.98, 50.77], [-98.85, 50.97]], halfWidthKm: 7 },
    ],
    trackRef: {},
  },
  'june20-2023': {
    swaths: [
      { hazard: 'tornado', tier: 'projection', label: 'Storm-affected swath',
        line: [[-98.56, 49.25], [-98.27, 49.37], [-98.00, 49.50]], halfWidthKm: 7 },
    ],
    trackRef: {},
  },
  'june2-2026': {
    swaths: [
      { hazard: 'tornado', tier: 'projection', label: 'Storm-affected swath',
        line: [[-97.97, 49.16], [-97.62, 49.145], [-97.28, 49.13]], halfWidthKm: 6 },
    ],
    trackRef: {},
  },
  'june9-2026': {
    swaths: [
      // Hail core tracking NE from the SW over the City of Winnipeg, consistent
      // with the loss model's hail driver and the urban-exposure strain note.
      { hazard: 'hail', tier: 'projection', label: 'Large-hail area',
        cluster: 'Hail core tracking NE over Winnipeg',
        line: [[-97.50, 49.68], [-97.14, 49.88], [-96.80, 50.12]], halfWidthKm: 9,
        muniIds: ['woodlands', 'rockwood'] },
      // Tornado-warned clusters — one NE-elongated swath per municipality group.
      { hazard: 'tornado', tier: 'projection', label: 'Tornado-warned area',
        cluster: 'Interlake (Stonewall corridor)',
        line: [[-97.80, 50.02], [-97.50, 50.12], [-97.20, 50.22]], halfWidthKm: 7,
        muniIds: ['woodlands', 'rockwood'] },
      { hazard: 'tornado', tier: 'projection', label: 'Tornado-warned area',
        cluster: 'Selkirk – St. Andrews – St. Clements',
        line: [[-97.05, 50.05], [-96.82, 50.18], [-96.60, 50.32]], halfWidthKm: 7,
        muniIds: ['standrews', 'selkirk', 'stclements'] },
      { hazard: 'tornado', tier: 'projection', label: 'Tornado-warned area',
        cluster: 'East of Winnipeg (Oakbank)',
        line: [[-96.98, 49.82], [-96.78, 49.94], [-96.58, 50.06]], halfWidthKm: 6,
        muniIds: ['springfield'] },
    ],
    trackRef: {},
    winnipegOutline: true,
    hailCaption: true,
  },
}

// The City of Winnipeg footprint now comes from the real urban polygon in
// manitoba-urban.geojson (the freehand hexagon was removed); the label is kept.

// Lake reference points kept in frame so southern views always show a lake.
export const LAKE_ANCHORS = [
  [50.20, -98.30], // Lake Manitoba, south basin
  [50.40, -96.92], // Lake Winnipeg, south basin
]
