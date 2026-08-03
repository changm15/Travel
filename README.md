# Michael's Travel Log

Hub site for trip itineraries. Static, no build step. Every trip follows the same shape: a top-level hub → a hub page per trip → a page per leg.

- `index.html` — top-level hub. Upcoming trips in a chronological timeline (soonest first, live days-until countdown), then a Past trips section.
- `trips/peru/index.html` — Peru trip hub, Sep 2–9, 2026.
  - `trips/peru/lima-cusco-inca-trail.html` — Leg 1: Lima, Cusco, the Inca Trail.
- `trips/asia/index.html` — Asia trip hub, Dec 18, 2026 – Jan 10, 2027.
  - `trips/asia/tokyo-hokkaido.html` — Leg 1: Japan.
  - `trips/asia/hongkong-southchina-sichuan.html` — Leg 2: Hong Kong, Shenzhen/Guangzhou, Chengdu, Chongqing.
  - `trips/asia/taiwan.html` — Leg 3: Taiwan, then home via Tokyo.
- `trips/denver/index.html` — Denver ValAct trip hub, Aug 22–26, 2026.
  - `trips/denver/valact.html` — Moody's, ValAct, PwC happy hour, ALM talk.
- `trips/pittsburgh/index.html` — SOA Impact conference hub, Oct 25–28, 2026.
  - `trips/pittsburgh/soa-impact.html` — details TBD.
- `assets/style.css` — shared styles. Colors are CSS variables in `:root`, overridden in a `@media (prefers-color-scheme: light)` block — change a palette by editing those two blocks, not individual rules.
- `assets/main.js` — countdown widgets and the service worker registration. `#countdown[data-departure]` gets the hero "X days, Y hours" text. Any `.trip-stop-days-num[data-departure]` (used in the timeline markers) gets a live whole-days count.
- `assets/map.js` — interactive route map (Leaflet + CARTO tiles, no API key, dark/light tile set follows `prefers-color-scheme`). Looks for `#trip-map[data-stops]`, a JSON array of `{label, lat, lng, mode}` points in route order (`mode` on a stop describes how you got there from the previous one: `"flight"` = solid line, `"ground"` = dashed, `"hike"` = dotted; omit on the first stop). Draws the full route, then on hover/focus highlights the relevant segment for a `[data-route="i,j,..."]` element elsewhere on the page (indices into the stops array). Opening a `<details class="leg">` (click, or via a map pin click) also flies the map in to focus tightly on that leg's own stops; closing the last open leg flies back out to the full route.

## Page patterns

**Trip hub** (`trips/<trip>/index.html`): hero + a `<ol class="trip-timeline">` of `<li class="trip-stop">` entries, one per leg, each with a `.trip-stop-marker` (a `.trip-stop-days-num[data-departure]` for a live countdown — same component as the home page's Upcoming list) and a `.trip-card` link into that leg's page.

**Leg page** (e.g. `trips/asia/tokyo-hokkaido.html`): hero + route-strip (quick glance, with dates) + itinerary (map + `<ol class="legs trip-timeline is-compact">` of `<li class="trip-stop">` wrapping a `<details class="leg" name="legs" data-route="i,j">`) + optional notes. The compact timeline reuses the same circular-marker component as trip hubs, just smaller, with a calendar date in the marker instead of a days-count. `name="legs"` makes the day cards an exclusive accordion (opening one closes the others) — keep that attribute on every `<details class="leg">` on a page. Keep highlights terse: 2–4 short bullets, not paragraphs. If dates/route aren't locked in, say so directly ("TBD") rather than guessing.

## PWA

`manifest.webmanifest` + `icons/` (map-pin icon, 32/180/192/512px) + `sw.js` make the site installable ("Add to Home Screen" on iOS, install prompt on Android/desktop Chrome). Every page links the manifest and icons with a path relative to its own depth (`manifest.webmanifest` from the root, `../../manifest.webmanifest` from a two-deep trip page) so it works whether the site is served from a domain root (Vercel) or a subpath (GitHub Pages). `sw.js` is a simple network-first cache: always tries the network first so edits show up immediately, falls back to the last cached copy when offline.

**Adding these tags to a new page:** copy the block of `<link rel="manifest">` / `<link rel="apple-touch-icon">` / theme-color and apple-mobile-web-app meta tags from any existing page, adjusting the relative path prefix to match the new page's folder depth.

## Adding to the site

**New leg on an existing trip:**
1. Add a stop object to that leg's map `data-stops` JSON (if it's a new place), with a `mode` for how you get there.
2. Add a `<li class="trip-stop">` with a `.trip-stop-marker` (date) wrapping a `<details class="leg" name="legs" data-route="i,j">` block, where `i,j` are stop indices this day's segment touches.
3. Add a `.trip-stop` entry (with a days-until marker) to that trip's hub `trip-timeline`.

**New top-level trip:**
1. Copy `trips/peru/` as a starting point (rename the folder and its leg file(s)).
2. Add a `.trip-stop` entry to `index.html`'s Upcoming timeline, with a `data-departure` on the marker, positioned by date (soonest first). Move it to Past trips once it's over.
