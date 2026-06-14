# BLUEPRINT: Cape Breton ED page build pattern

A reverse-documentation of `cape-breton-ed/index.html` (live at
`https://gavinshklanka.github.io/Blackpoint-Lab/cape-breton-ed/`). It records how the page is
built so a classmate can understand it and a fresh session can reproduce the pattern for a new
page (Project 2). It documents what exists. It does not propose changes.

This file is read-only documentation. It does not modify the page.

---

## 0. How to read this document

Two audiences are served at once.

- A person reads the prose top to bottom and understands the look, the sections, the tables,
  the charts, and the interactive features.
- A fresh AI session reads the same document and reproduces the pattern, because every
  reusable piece below carries an HTML skeleton, the CSS approach, and the actual interaction
  code copied from the source.

Where a real value is quoted (a hex code, a coordinate, a line of JavaScript), it is the
actual value found in the source, not an approximation.

---

## 1. Technology model (what kind of artifact this is)

- **One self-contained HTML file.** All CSS lives in a single `<style>` block in the `<head>`.
  All JavaScript lives in one `<script>` block at the end of `<body>`. All charts are inline
  `<svg>` written by hand into the markup.
- **No build step. No framework. No CDN. No external chart library.** The file renders by
  opening it. This is a hard rule of the pattern: charts are hand-built SVG, never a charting
  library.
- **No images for charts.** Every figure is vector SVG in the markup, so it scales crisply and
  has zero network dependencies.
- **Hosting.** The page is a static file served by GitHub Pages. The lab's deploy workflow
  copies `cape-breton-ed/*` into the published site, so the page lives at
  `/Blackpoint-Lab/cape-breton-ed/`. A new sibling folder is published the same way once the
  deploy step copies it (see Section 8).

Reproduction note: create one `.html` file, put all styles in `<head><style>`, all script in a
single `<script>` before `</body>`, and hand-write each chart as `<svg>`.

---

## 2. Page architecture and the section rule

### 2.1 The structural rule (applies to every section)

Every section opens with one executive-readable plain-English sentence before any technical
detail. In the markup this lead is a paragraph with class `plain` (larger type), and any
deeper or more technical material sits below it, inside a `<details>` toggle, inside a
`callout`, or inside a speaker-note panel. A non-technical reader can scroll the leads alone
and still get the whole story.

### 2.2 Section inventory (document order)

| # | Region | Heading | Content type | Plain-English lead (opening sentence) |
|---|---|---|---|---|
| 0 | Sticky top bar | brand + controls | nav | n/a (brand, global notes toggle, back to lab link) |
| 1 | Hero | "Where do Cape Breton's emergency patients end up?" | prose + stat cards | "Today one in five people who arrive at this emergency department leave before any provider sees them." |
| 2 | The problem | "Roughly 7,000 people a year give up and walk out." | prose | The 2023-24 figures: 38,900 visits, 5.73 h wait, 18.24 percent leave. |
| 3 | What the model represents | "A working model of the department, calibrated to reality." | prose + CTAS bar chart (Figure 1) + `details` deep-dive | "The model reproduces both published figures at once." |
| 4 | What the analysis tested | "Two practical changes, alone and together." | two cards + realism prose + two callouts | "Both target the same underserved group." |
| 5 | What the analysis found | "One nurse practitioner does what diversion cannot." | three findings + callout + dose-response SVG (Figure 2) + dot-and-CI SVG (Figure 3) + stacked-bar SVG (Figure 4) + arrival-curve SVG (Figure 5) + parameter/assumption/limitation cards | "Diverting one in five low-urgency patients cuts walkouts..." |
| 6 | Full statistics | "Every metric, every scenario." | four toggleable tables | "Ten-replication results. Select a scenario..." |
| 7 | Glossary | "What each term means in this model." | definition list | n/a (each term grounded to its model role) |
| 8 | Registered failure modes | "The honesty is the point." | prose + table | "Every modelling error and limitation was logged, dated, and either resolved or disclosed." |
| 9 | Recommendation | "Adopt both, and be clear about why." | deep-green hero panel + integrity strip | "The recommendation is to adopt the combination." |
| 10 | Footer | author + lab line | prose | n/a |

Speaker-note expanders (the `+` control and panel) are attached to sections 2, 3, 4, 5, 8, 9.

---

## 3. Design system and tokens (real values)

The page inherits the parent Blackpoint-Lab identity (deep forest green, warm off-white ground,
serif display headings) and defines it explicitly as CSS custom properties. Reuse these tokens
verbatim on a new page so it reads as the same brand.

```css
:root{
  --ground:#F6F3EC;      /* warm off-white page background */
  --panel:#FFFFFF;       /* card / figure surface */
  --ink:#23271F;         /* body text (charcoal) */
  --ink-soft:#5C6157;    /* secondary text, kickers, captions */
  --line:#E4E0D6;        /* hairline borders and section rules */
  --forest:#1E4D34;      /* primary green (links, accents, stat numbers) */
  --forest-deep:#143524; /* deep green SURFACE: recommendation hero AND speaker-note panels */
  --slate:#9AA09A;       /* baseline/neutral series in charts */
  --blue:#3E6B8C;        /* "ED physician" / Scenario A series */
  --green:#3DA468;       /* "fast-track" / win series */
  --amber:#D69A3C;       /* "community care" / warm accent, callout left border */
  --danger:#C0463A;      /* walkout red */
  --serif:Georgia,"Hoefler Text","Times New Roman",serif;          /* display headings */
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; /* body + chart text */
  --wrap:980px;          /* max content width */
}
```

Typography and rhythm, as actually used:

- Body: `--sans`, `font-size:18px`, `line-height:1.62`, color `--ink`, background `--ground`.
- Display headings `h1`/`h2`/card `h3`/glossary `dt`: `--serif`, weight 700, color `--forest-deep`.
- Fluid heading sizes via `clamp()`: `h1` is `clamp(30px,5vw,50px)`; `h2` is
  `clamp(24px,3.4vw,34px)`; `h2.sub` is `clamp(20px,2.6vw,26px)`.
- `.plain` lead paragraph: `clamp(18px,2.2vw,21px)`, `max-width:62ch`. Body `p` is capped at
  `max-width:66ch` for line length.
- Section kicker (`.kicker`): 13px, uppercase, `letter-spacing:.16em`, color `--ink-soft`.
- Content is centered in `.wrap` (`max-width:var(--wrap); margin:0 auto; padding:0 24px`).
- Section spacing: `section{padding:52px 0;border-top:1px solid var(--line)}`. Sections are
  separated by a single hairline rule, no heavy dividers.

Cards, figures, borders (the repeated surface recipe):

- `.card`, `.figure`, `table`, `dl.gloss`, `.callout`: white `--panel` background, `1px solid
  var(--line)` border, generous `border-radius` (10px to 18px), interior padding 18 to 34px.
- `.callout` adds a 4px left accent border: amber by default, green when `.callout.ext`.
- The two dark surfaces both use `--forest-deep`: the recommendation panel (`.rec`) and every
  speaker-note panel (`.notes`). This is the single "dark" treatment in an otherwise light page.

Responsive treatment (two breakpoints):

```css
@media (max-width:820px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .duo,.dosegrid{grid-template-columns:1fr}   /* two-up blocks stack */
  table{font-size:14px}
}
@media (max-width:480px){
  .stats{grid-template-columns:1fr 1fr}
}
```

Charts stay responsive because every `<svg>` uses a `viewBox` and `.figure svg{width:100%;
height:auto}`, so they scale to the container at any width.

---

## 4. Reusable component patterns

Each pattern below gives the HTML skeleton, the CSS approach, and the live interaction code.

### 4.1 Sticky top bar and navigation

There is no in-page table of contents. Traversal is plain vertical scroll, made smooth by
`html{scroll-behavior:smooth}`, with a sticky header that stays in reach. The header holds the
brand, the global speaker-notes toggle, and a back link to the lab.

```html
<div class="topbar"><div class="wrap">
  <div class="brand">Black Point Analytics<small>Blackpoint Lab</small></div>
  <div class="topright">
    <button class="gnotes" id="globalNotes">Speaker notes: off</button>
    <a class="backlink" href="../">&larr; Lab</a>
  </div>
</div></div>
```

```css
.topbar{border-bottom:1px solid var(--line);background:var(--ground);position:sticky;top:0;z-index:20}
.topbar .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 0}
```

### 4.2 Hero and stat cards

A 5-up responsive grid of single-number cards. Display-serif number over a small label. Add
`.alarm` to color a number with `--danger`.

```html
<div class="stats">
  <div class="stat"><div class="num">38,900</div><div class="lab">emergency visits a year</div></div>
  <div class="stat alarm"><div class="num">1 in 5</div><div class="lab">leave today without being seen</div></div>
  <!-- ...three more... -->
</div>
```

```css
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:20px 18px}
.stat .num{font-family:var(--serif);font-weight:700;font-size:clamp(24px,3vw,30px);color:var(--forest)}
.stat.alarm .num{color:var(--danger)}
```

### 4.3 Section header with a speaker-note control

Each section that has speaker notes opens with a `.sec-head` flex row: the kicker on the left,
the `+` toggle button pinned to the right.

```html
<div class="sec-head">
  <div><p class="kicker">The problem</p></div>
  <button class="note-toggle" aria-label="Speaker notes" onclick="toggleNotes(this)">+</button>
</div>
```

### 4.4 Speaker-note expanders and the global toggle (the trickiest state logic)

Behavior contract, reproduced exactly:

1. Default page state is clean: the global toggle reads "Speaker notes: off", the per-section
   `+` buttons are hidden, and all note panels are collapsed.
2. Turning the global toggle ON only reveals the `+` controls. It does not open any panel.
3. A per-section `+` opens only its own panel and flips to a minus glyph; pressing again
   collapses it.
4. Turning the global toggle OFF collapses every open panel, resets every button to `+`, and
   hides the controls again.

The note panel sits at the end of a section and uses the deep-green surface:

```html
<div class="notes"><b>Say</b><ul>
  <li>38,900 visits per year.</li>
  <li>1 in 5 leave without being seen (18.24 percent).</li>
</ul></div>
```

CSS (visibility is driven entirely by classes; nothing is shown unless opened):

```css
.note-toggle{ /* ...button styling... */ display:none}      /* hidden by default */
body.notes-on .note-toggle{display:block}                   /* global ON reveals controls */
.note-toggle:hover{border-color:var(--forest)}
.notes{display:none;margin:18px 0 4px;background:var(--forest-deep);color:#CFE0D4;
       border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:16px 20px;font-size:14.5px}
.notes.open{display:block}                                  /* only an opened panel shows */
.notes b{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#9FCBAE;margin-bottom:8px}
```

JavaScript (verbatim):

```js
function toggleNotes(btn){
  var p=btn.closest('section').querySelector('.notes');
  if(!p) return;
  p.classList.toggle('open');
  btn.textContent=p.classList.contains('open')?'−':'+';
}
document.getElementById('globalNotes').addEventListener('click',function(){
  var on=document.body.classList.toggle('notes-on');
  this.classList.toggle('active',on);
  this.textContent='Speaker notes: '+(on?'on':'off');
  if(!on){
    document.querySelectorAll('.notes.open').forEach(function(p){p.classList.remove('open');});
    document.querySelectorAll('.note-toggle').forEach(function(b){b.textContent='+';});
  }
});
```

The two-layer rule is the key: controls appear only under `body.notes-on`, and a panel appears
only under `.notes.open`. The global toggle never forces panels open; it only gates the
controls and, when turned off, sweeps everything closed.

### 4.5 Four toggleable scenario tables (click-through, one visible at a time)

A pill-button tab strip switches which table is shown. Base is the default (its tab carries
`active`, its table carries `show`). Each tab names the id of its table in `data-scn`.

```html
<div class="tabs">
  <button class="scn-tab active" data-scn="scn-base">Base</button>
  <button class="scn-tab" data-scn="scn-a">Scenario A</button>
  <button class="scn-tab" data-scn="scn-b">Scenario B</button>
  <button class="scn-tab" data-scn="scn-ab">Scenario A+B</button>
</div>

<div id="scn-base" class="scn-table show">
  <table>
    <thead><tr><th>Metric</th><th>Plain-English name</th>
      <th class="num">Mean</th><th class="num">Std dev</th><th class="num">95% CI</th></tr></thead>
    <tbody>
      <tr><td>Door-to-doctor wait (h)</td><td class="pl">Time to see a physician</td>
          <td class="num">5.51</td><td class="num">0.27</td><td class="num">[5.32, 5.70]</td></tr>
      <!-- ...one row per KPI... -->
    </tbody>
  </table>
</div>
<!-- #scn-a, #scn-b, #scn-ab: same structure, class "scn-table" without "show" -->
```

```css
.tabs{display:flex;flex-wrap:wrap;gap:8px}
.scn-tab,.cmp-tab{border:1px solid var(--line);background:var(--panel);color:var(--ink-soft);
  border-radius:999px;padding:9px 18px;cursor:pointer;font-size:14.5px;font-weight:600}
.scn-tab.active,.cmp-tab.active{background:var(--forest-deep);color:#fff;border-color:var(--forest-deep)}
.scn-table{display:none}
.scn-table.show{display:block}
table{width:100%;border-collapse:collapse;font-size:15px;background:var(--panel);
  border:1px solid var(--line);border-radius:12px;overflow:hidden}
thead th{background:#EFEBE1;text-transform:uppercase;font-size:12.5px;color:var(--ink-soft)}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
```

JavaScript (clear active on all tabs, hide all tables, then activate the clicked pair):

```js
document.querySelectorAll('.scn-tab').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.scn-tab').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.scn-table').forEach(function(t){t.classList.remove('show');});
    b.classList.add('active');
    document.getElementById(b.dataset.scn).classList.add('show');
  });
});
```

A scenario-specific note can be attached inside one table block (for example a `.callout`
inside `#scn-a`); it then appears only when that scenario is selected. Column convention is
fixed: Metric, Plain-English name, Mean, Std dev, 95% CI. Numbers use `tabular-nums` so columns
align.

### 4.6 Toggleable comparison charts (same control, two SVGs)

The dot-and-CI comparison uses the identical tab pattern, applied to whole SVGs instead of
tables. Buttons carry `cmp-tab`, each names a `cmp-svg` id in `data-cmp`, and the default SVG
carries `show`.

```js
document.querySelectorAll('.cmp-tab').forEach(function(b){
  b.addEventListener('click',function(){
    document.querySelectorAll('.cmp-tab').forEach(function(x){x.classList.remove('active');});
    document.querySelectorAll('.cmp-svg').forEach(function(s){s.classList.remove('show');});
    b.classList.add('active');
    document.getElementById(b.dataset.cmp).classList.add('show');
  });
});
```

```css
.cmp-svg{display:none}
.cmp-svg.show{display:block}
```

This is the general "one control, many panels" pattern, reused for both the tables and the
charts. To add a third toggle group, copy the loop with a new class prefix.

### 4.7 Inline SVG charts (the coordinate recipe)

Every chart is hand-built. They all follow one method, so reproduce the method rather than
memorizing coordinates.

**The recipe**

1. Set a fixed `viewBox`, for example `0 0 640 380`. All coordinates are in this space; the SVG
   then scales to the container via CSS.
2. Define a plot rectangle inside the viewBox: a left edge for the y-axis, a right edge, a top,
   and a bottom (for example left x=80, right x=600, top y=40, bottom y=320; so plot width 520,
   plot height 280).
3. Define linear scales from data to pixels:
   - `x(value) = left + (value - xmin) / (xmax - xmin) * plotWidth`
   - `y(value) = bottom - (value - ymin) / (ymax - ymin) * plotHeight` (y is inverted because
     SVG y grows downward).
4. Draw, back to front: gridlines (`<line class="grid">`), the axis line
   (`<line class="baseaxis">`), tick labels (`<text class="axis">`), then the data series, then
   value labels (`<text class="val">`).

Chart text and series colors come from dedicated classes, defined once:

```css
.chart text{font-family:var(--sans);fill:var(--ink)}
.chart .axis{font-size:13px;fill:#73776E}
.chart .grid{stroke:#ECE8DE;stroke-width:1}
.chart .baseaxis{stroke:#C7C3B7;stroke-width:1.4}
.chart .err{stroke:#2B2F27;stroke-width:2;fill:none}   /* CI whiskers */
.chart .fit{stroke:var(--forest);stroke-width:2.4;fill:none}       /* straight fit line */
.chart .fitcurve{stroke:var(--green);stroke-width:2.4;fill:none}   /* curved fit */
.chart .ref{stroke:#9AA09A;stroke-width:1.6;stroke-dasharray:6 5}  /* reference line */
```

**Regression panels (Figure 2).** Two panels side by side in `.dosegrid` (a two-column grid
that stacks on mobile). Each panel plots the swept points as `<circle>` and the fitted model as
a single line or polyline. The displayed equation and R-squared are written in a `.eqn` span
and must match the drawn line.

- Linear fit (diversion) is one straight `<line class="fit">` spanning the full x-range,
  computed by evaluating the equation at the two axis ends:

```html
<line class="fit" x1="80" y1="70.0" x2="600" y2="249.5"/>          <!-- y from LWBS% = 19.36 - 12.82*divertFrac at x=0 and x=0.30 -->
<circle cx="80" cy="86.2" r="5.5" fill="#1E4D34"/>                 <!-- each swept data point -->
<!-- ...remaining points... -->
<span class="eqn">LWBS% = 19.36 - 12.82 &middot; divertFrac &nbsp; R&sup2; = 0.90</span>
```

- A curved fit (fast-track, a log shape) is a `<polyline class="fitcurve">` sampled across the
  x-range so it spans the whole axis end to end:

```html
<polyline class="fitcurve" points="145,97.4 210,110.4 275,119.7 340,126.9 405,132.7 470,137.6 535,141.9"/>
<span class="eqn">LWBS% = 3.18 - 0.46 &middot; ln(nNPPA) &nbsp; R&sup2; = 0.39</span>
```

Honesty rule visible here: a weak fit keeps its true R-squared (0.39) and the caption explains
why, rather than smoothing the curve to look stronger.

**Dot-and-CI comparison (Figure 3).** Categories sit at evenly spaced x positions
(145, 275, 405, 535 for four categories). Each category draws a confidence interval as a
whisker (one vertical line plus two short caps) and the mean as a filled `<circle>`:

```html
<g class="err">
  <line x1="145" y1="63.7" x2="145" y2="92.3"/>     <!-- whisker from y(high) to y(low) -->
  <line x1="137" y1="63.7" x2="153" y2="63.7"/>     <!-- top cap -->
  <line x1="137" y1="92.3" x2="153" y2="92.3"/>     <!-- bottom cap -->
</g>
<circle cx="145" cy="78.1" r="6" fill="#9AA09A"/>   <!-- mean -->
```

Series are colored by scenario using the tokens: Base `--slate`, Scenario A `--blue`,
Scenario B `--green`, Combined `--forest-deep`.

**Stacked bar (Figure 4, disposition).** Each scenario is a stack of `<rect>` segments drawn
from the baseline upward, each segment's height equal to `value/scaleMax * plotHeight`, colored
by outcome (ED physician `--blue`, fast-track `--green`, community `--amber`, walkout
`--danger`). A `.legend` row below maps swatch color to label.

**Simple bar (Figure 1, CTAS mix) and area curve (Figure 5, arrivals).** Bars are single
`<rect>` per category; the arrival curve is a `<polyline>` over a translucent `<path>` fill,
both using the same scale recipe.

Every figure closes with a `.figcap` whose bold lead states the takeaway, not the chart's
contents (for example "One nurse practitioner removes almost every walkout.").

### 4.8 Glossary / legend block

A definition list where each term is grounded to its role in this specific model, not a generic
dictionary definition.

```html
<dl class="gloss">
  <div><dt>LWBS (Left Without Being Seen)</dt>
    <dd>A patient who leaves before any provider sees them. In this model it is not programmed;
        it emerges when a low-acuity patient's patience runs out while higher-acuity patients
        keep taking priority.</dd></div>
  <!-- ...one div per term... -->
</dl>
```

```css
dl.gloss{background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden}
dl.gloss > div{padding:16px 20px;border-bottom:1px solid var(--line)}
dl.gloss > div:last-child{border-bottom:none}
dl.gloss dt{font-family:var(--serif);font-weight:700;color:var(--forest-deep);font-size:17px}
```

### 4.9 Callouts and the integrity strip

`.callout` is a white card with a colored left border for an inline aside: amber by default,
green for a labeled extension (`.callout.ext`). It carries an uppercase `.lab` label.

```html
<div class="callout ext"><span class="lab">Effect modeled · ambulance lane is a future extension</span>
  <p>...labeled rationale that does not assert an unbuilt mechanism...</p></div>
```

The **integrity strip** is a Blackpoint Analytics signature element: a single `.integrity`
paragraph with a green left rule that states the labeled assumptions, the staffed-bed evidence,
the excluded-and-replaced replication, and the line "decision-support model for capacity
planning, not an operational tool." Reuse it near the recommendation on any BPA page.

```css
.integrity{font-size:13.5px;color:var(--ink-soft);background:var(--panel);
  border:1px solid var(--line);border-left:4px solid var(--green);border-radius:10px;padding:20px 22px}
```

### 4.10 `details` deep-dive expander

For optional technical depth that is not a speaker note, the page uses a native
`<details>/<summary>` with a custom `+` / minus marker, so no JavaScript is needed.

```css
summary{list-style:none}
summary::-webkit-details-marker{display:none}
summary::before{content:"+ ";font-weight:700}
details[open] summary::before{content:"\2212 "}   /* minus glyph when open */
```

---

## 5. Content discipline baked into the page (keep these on any new page)

- **Locked numbers.** Every figure comes from the study results and is typed into the markup as
  a literal. Nothing is recomputed or invented in the page. Charts plot those same locked
  numbers. If a value is not in the source data, it does not appear.
- **Plain-English first.** Every section leads with one executive sentence (the `.plain`
  paragraph) before any technical content.
- **Inline SVG over chart libraries.** Charts are hand-built vector, never a CDN library.
- **Honesty as a brand asset.** The integrity strip, the failure-mode register, and labeled
  assumptions are first-class content. Weak results (a low R-squared) are shown and explained,
  not hidden.
- **Veracity guard.** The page never asserts a model mechanism that does not exist. Real-world
  rationale or future work is explicitly labeled as such (see the `.callout.ext` example).
- **No em-dashes** anywhere in the prose. Use commas, colons, or full stops.

---

## 6. How to build the Project 2 page (fresh-session guide)

A fresh session with only this blueprint can build the Project 2 page as follows.

1. **Create a new sibling folder and page.** For example `project-2/index.html` (or
   `cape-breton-ed-round2/index.html`). Start from the Section 1 technology model: one
   self-contained HTML file, all CSS in one `<head><style>`, all JS in one `<script>` before
   `</body>`, charts as inline SVG.
2. **Paste the design system.** Copy the full `:root` token block from Section 3, plus the base
   `body`, `.wrap`, section, card, figure, table, tabs, notes, callout, glossary, and `.chart`
   styles. This guarantees the new page reads as the same brand.
3. **Lay out sections with the structural rule.** Each section: a `.sec-head` with a kicker
   (and a `+` note control if it has speaker notes), an `h2`, then a `.plain` lead sentence,
   then the body. Reuse the Section 2.2 inventory as a template skeleton.
4. **Reuse the components from Section 4** for the interactive parts:
   - Toggleable tables (4.5) for the Project 2 scenario or KPI sets.
   - The "one control, many panels" toggle (4.6) for comparison charts.
   - The SVG coordinate recipe (4.7) for new regressions, dot-and-CI plots, stacked bars.
   - Speaker-note expanders and the global toggle (4.4): copy the CSS and the JS verbatim.
   - Glossary (4.8), callouts and integrity strip (4.9), `details` deep-dive (4.10).
   - Copy the single `<script>` block from Section 4; it already wires notes, scenario tabs,
     and comparison tabs, and works unchanged as long as the class and `data-` names match.
5. **Reference Project 1.** Project 2 builds from Project 1's findings (community-routing
   realism and the boarding decomposition). Open the page by linking back to the Project 1 page
   and stating what is carried forward, then present the new tables, charts, and findings using
   the same components.
6. **Plan for heavy content.** The components that scale to a full report are the toggleable
   tables (add scenarios or KPI rows without lengthening the page), the toggle groups (group
   many charts behind one control), and the expanders (`details` and speaker notes keep depth
   collapsed by default). Lead with plain-English summaries and push detail into these.
7. **Add one homepage entry.** In the lab homepage list, add a new "(live)" entry in the exact
   existing style (heading, short description, "Live system:" label, then the relative path),
   pointing at the new folder, mirroring how `./app/` and `./cape-breton-ed/` are listed.
8. **Publish.** The new folder is served once the deploy step copies it into the site, the same
   way `cape-breton-ed/` is copied. Mirror that copy line for the new folder.
9. **Keep the content discipline** from Section 5: locked numbers, plain-English first, inline
   SVG, honesty strip, veracity guard, no em-dashes.

---

## 7. Reproduction checklist

A new page matches the pattern when all of these hold.

- One self-contained HTML file, no build, no CDN, no chart library.
- The `:root` tokens match Section 3; deep green `--forest-deep` is the only dark surface, used
  by the recommendation panel and the speaker-note panels.
- Every section leads with a `.plain` sentence.
- Tables and comparison charts switch with the pill-tab pattern, one visible at a time, with a
  default carrying `show`.
- Charts are inline SVG built with the Section 4.7 recipe; fit lines span the full axis;
  equations match the drawn line; CI whiskers are line-plus-two-caps.
- Speaker notes follow the two-layer state logic: controls gated by `body.notes-on`, panels
  gated by `.notes.open`, global-off sweeps everything closed; default state is clean.
- Glossary terms are grounded to model roles; the integrity strip is present near the
  recommendation.
- Locked numbers only, honesty content kept, no unbuilt mechanism asserted, no em-dashes.

---

*Reverse-documented from `cape-breton-ed/index.html` for the Blackpoint Lab. The blueprint is
the template for the Project 2 page. Black Point Analytics.*
