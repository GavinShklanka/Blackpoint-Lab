# Manitoba Historical Tornado-System Simulator

**Executive Stakeholder Edition** — a single-page briefing tool for
emergency-management and institutional decision-makers. It presents five
Manitoba tornado events on an interactive map with plain-English KPIs,
duration playback, a side-by-side comparison, and explicit data-tier
labelling on every figure.

Built for a non-technical audience: any event summary is **one click** from the
landing view, there is no statistical notation in the primary UI, and percentile
bands are shown as plain "likely range $X–$Y".

## Stack

- React 18 + Vite (static build, **no server dependency**)
- Leaflet / react-leaflet for the map
- CARTO Positron raster basemap + simplified municipal-boundary GeoJSON
- All event data baked into a versioned [`src/data/events.json`](src/data/events.json)

## The five events (locked roster)

1. **Elie F5** — June 22–23, 2007 outbreak (Canada's only F5)
2. **Alonsa EF4** — Aug 3, 2018 (1 fatality)
3. **June 20, 2023** — 3 confirmed tornadoes
4. **June 2, 2026** — 3 confirmed EF0
5. **June 9, 2026** — *survey-pending* state (projections only)

## Data tiers (a figure without a badge is a defect)

| Badge | Meaning |
|-------|---------|
| **Confirmed** | Verified by official survey — ECCC / Northern Tornadoes Project. |
| **Historical estimate** | Real recorded loss, inflation-normalized to 2026 CAD, shown as a range. |
| **Projection** | Modeled, not yet observed — always shown with its likely range. |

## June 9, 2026 — survey-pending and swappable to "Confirmed"

This event renders an explicit "Damage survey pending" banner and shows only
banded projections (Monte Carlo, 100k draws): total loss **$20M–$139M
(P10–P90), central $44M (P50)**, hail-dominated, ~51% chance of qualifying as an
insured catastrophe.

To publish confirmed figures once the NTP survey lands, edit the `june9-2026`
object in `events.json`:

1. Set `"status": "confirmed"` and remove `pendingBanner`.
2. Replace each `kpis.*` value with the surveyed figure and change its
   `"tier"` from `"projection"` to `"confirmed"` (or `"historical_estimate"`
   for the cost).
3. Add the surveyed `tracks` array; remove the `projection` block if no longer
   needed. No code changes are required — the UI re-renders from the data.

## Emergency-Resource Strain Index

A 0–100 "analytical proxy" composite per event: warnings (count + duration) +
peak power outages + affected-municipality count + casualties (deaths weighted),
each scored as a share of the roster maximum, then averaged. Methodology is
available in-app via the "How is this calculated?" link.

## Develop

```bash
cd manitoba-tornado-sim
npm install
npm run dev      # local dev server
npm run build    # static build to dist/
```

## Deploy

`.github/workflows/deploy.yml` builds this app and publishes it to GitHub Pages
at `/<repo>/app/` (the Blackpoint Lab portfolio stays at the Pages root).
Requires **Settings → Pages → Source: "GitHub Actions"**.
