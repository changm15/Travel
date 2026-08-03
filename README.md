# Travel

Hub site for trip itineraries. Static, no build step. Every trip follows the same shape: a top-level hub → a hub page per trip → a page per leg.

- `index.html` — top-level hub. Upcoming trips in a chronological timeline (soonest first, live days-until countdown), then a Past trips section.
- `trips/peru/index.html` — Peru trip hub, Sep 2–9, 2026. One leg so far.
  - `trips/peru/lima-cusco-inca-trail.html` — Leg 1: Lima, Cusco, the Inca Trail.
- `trips/asia/index.html` — Asia trip hub, Dec 18, 2026 – Jan 10, 2027.
  - `trips/asia/tokyo-hokkaido.html` — Leg 1: Japan.
  - `trips/asia/hongkong-southchina-sichuan.html` — Leg 2: Hong Kong, Shenzhen/Guangzhou, Chengdu, Chongqing.
  - `trips/asia/taiwan.html` — Leg 3: Taiwan, then home via Tokyo.
- `assets/style.css` — shared styles. Colors are CSS variables in `:root`, overridden in a `@media (prefers-color-scheme: light)` block — change a palette by editing those two blocks, not individual rules.
- `assets/main.js` — countdown widgets. `#countdown[data-departure]` gets the hero "X days, Y hours" text. Any `.trip-stop-days-num[data-departure]` (used in the timeline markers) gets a live whole-days count.
- `assets/map.js` — interactive route map (Leaflet + CARTO tiles, no API key, dark/light tile set follows `prefers-color-scheme`). Looks for `#trip-map[data-stops]`, a JSON array of `{label, lat, lng}` points in route order. Draws the full route, then on hover/focus highlights the relevant segment for a `[data-route="i,j,..."]` element elsewhere on the page (indices into the stops array). Opening a `<details class="leg">` (click, or via a map pin click) also flies the map in to focus on that stop plus its immediate neighbor; closing the last open leg flies back out to the full route.

## Page patterns

**Trip hub** (`trips/<trip>/index.html`): hero + a `<ol class="trip-timeline">` of `<li class="trip-stop">` entries, one per leg, each with a `.trip-stop-marker` (leg number, or a `.trip-stop-days-num[data-departure]` for live countdown on the top-level home page) and a `.trip-card` link into that leg's page. Same component as the home page's Upcoming list.

**Leg page** (e.g. `trips/asia/tokyo-hokkaido.html`): hero + route-strip (quick glance, with dates) + itinerary (map + `<ol class="legs">` of `<details class="leg" name="legs" data-route="i,j">`) + optional notes. `name="legs"` makes the day cards an exclusive accordion (opening one closes the others) — keep that attribute on every `<details class="leg">` on a page. Keep highlights terse: 2–4 short bullets, not paragraphs. If dates/route aren't locked in, say so directly ("TBD") rather than guessing.

## Adding to the site

**New leg on an existing trip:**
1. Add a stop object to that leg's map `data-stops` JSON (if it's a new place).
2. Add a `<details class="leg" name="legs" data-route="i,j">` block, where `i,j` are stop indices this day's segment touches.
3. Add a `.trip-stop` entry (with a leg-number marker) to that trip's hub `trip-timeline`.

**New top-level trip:**
1. Copy `trips/peru/` as a starting point (rename the folder and its one leg file).
2. Add a `.trip-stop` entry to `index.html`'s Upcoming timeline, with a `data-departure` on the marker, positioned by date (soonest first). Move it to Past trips once it's over.
