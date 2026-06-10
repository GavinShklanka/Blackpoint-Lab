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
      { hazard: 'hail', tier: 'projection', label: 'Large-hail area',
        line: [[-97.72, 50.00], [-97.30, 50.17], [-96.92, 50.34]], halfWidthKm: 9 },
      { hazard: 'tornado', tier: 'projection', label: 'Tornado-warned area',
        line: [[-96.86, 49.92], [-96.73, 50.09], [-96.60, 50.25]], halfWidthKm: 6 },
    ],
    trackRef: {},
    winnipegOutline: true,
  },
}

// Simple City of Winnipeg footprint (≈ Perimeter Highway), [lng, lat].
export const WINNIPEG_OUTLINE = [
  [-97.34, 49.99], [-96.96, 49.99], [-96.93, 49.88], [-96.95, 49.80],
  [-97.01, 49.72], [-97.28, 49.72], [-97.36, 49.81], [-97.35, 49.92], [-97.34, 49.99],
]

// Lake reference points kept in frame so southern views always show a lake.
export const LAKE_ANCHORS = [
  [50.20, -98.30], // Lake Manitoba, south basin
  [50.40, -96.92], // Lake Winnipeg, south basin
]
