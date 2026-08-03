# Michael's Travel Log

> **Archived.** This static site is frozen as a historical mirror. The live site is now a DB-backed Next.js app with an owner login, editor, and live flight tracking — this repo is no longer deployed on push (see `.github/workflows/pages.yml`). Kept here for history.

Hub site for trip itineraries. Static, no build step. Every trip follows the same shape: a top-level hub → a hub page per trip → a page per leg.

- `index.html` — top-level hub. Upcoming trips in a chronological timeline (live days-until countdown per trip, a dashed `.is-home-base` entry for date-ranged home-base overrides), then a Past trips section.
- `trips/peru/` — Peru, Sep 2–9, 2026 (`lima-cusco-inca-trail.html`).
- `trips/asia/` — Asia trip, Dec 18, 2026 – Jan 10, 2027 (`tokyo-hokkaido.html`, `hongkong-southchina-sichuan.html`, `taiwan.html`).
- `trips/denver/` — Denver ValAct, Aug 22–26, 2026 (`valact.html`).
- `trips/pittsburgh/` — SOA Impact conference, Oct 25–28, 2026 (`soa-impact.html`).
- `trips/winter-park/` — Winter Park ski trip, Mar 19–23, 2027 (`ski-trip.html`).
- `assets/style.css` — shared styles. Colors are CSS variables in `:root`, overridden both in a `@media (prefers-color-scheme: light)` block (OS preference) and a `:root[data-theme="light"]` block (explicit override from the toggle) — keep the two light-palette blocks in sync when changing colors.
- `assets/main.js` — countdown widgets, the home-base indicator, and the service worker registration. `#countdown[data-departure]` gets the hero "X days, Y hours" text. Any `.trip-stop-days-num[data-departure]` gets a live whole-days count. `#home-base-label` shows a date-ranged home-base override or the default location — edit the `RANGES` array in that block to add/change one (and update the matching `.is-home-base` entry in `index.html`'s timeline to stay in sync).
- `assets/map.js` — interactive route map (Leaflet + CARTO tiles, no API key, dark/light tile set follows the active theme). Looks for `#trip-map[data-stops]`, a JSON array of `{label, lat, lng, mode}` points in route order (`mode` on a stop describes how you got there from the previous one: `"flight"` = straight solid line, `"ground"` = dashed and traced along real roads via a free no-key OSRM routing lookup, `"hike"` = dotted straight line since there's no free trail-accurate routing API; omit `mode` on the first stop). Any element with `[data-route="i,j,..."]` — day cards *and* route-strip pills — highlights that segment on hover/focus; clicking a non-`<details>` one (a route-strip pill, a map pin) opens and scrolls to the matching leg card. Opening a `<details class="leg">` flies the map in to focus tightly on that leg's own stops; closing the last open leg flies back out to the full route.
- `assets/theme.js` — the dark/light toggle and share button in `.site-actions` (fixed top-right on every page). The toggle sets `data-theme` on `<html>` + `localStorage`, which an inline script in each page's `<head>` reads before first paint to avoid a flash. Share uses the Web Share API where available, otherwise copies the URL and shows a small toast.

## Icons

No emoji — every icon on the site is a custom inline SVG `<symbol>` from a sprite block pasted near the top of `<body>` on every page (search any page for `<symbol id="icon-`). Reference one with `<svg class="icon" aria-hidden="true"><use href="#icon-NAME"/></svg>` — the `.icon` class sizes it to `1em` so it inherits the surrounding text's font-size and `currentColor`. Available: `plane`, `mountain`, `snowflake`, `onsen`, `city`, `panda`, `bed`, `dining`, `flame`, `pagoda`, `boot`, `mic`, `chart`, `podium`, `llama`, `home`, `globe`, `camera`. Favicons are the shared `icons/icon-32.png` (the PWA app icon) on every page, not per-trip emoji.

## Page patterns

**Trip hub** (`trips/<trip>/index.html`): hero + a `<ol class="trip-timeline">` of `<li class="trip-stop">` entries, one per leg, each with a `.trip-stop-marker` (`.trip-stop-days-num[data-departure]` for a live countdown) and a `.trip-card` link into that leg's page. Right after `.trip-summary` (and before the timeline) is a `.trip-photos` element — a link out to that trip's iCloud Shared Album for photos, since this is a static site with no photo hosting/upload of its own. Since no trip has happened yet, there's no real album URL to link to: every hub currently renders `.trip-photos.is-placeholder` — a `<p>` with muted, dashed-border styling and text like "Photos: add an iCloud Shared Album link here" — rather than an `<a href="#">` that goes nowhere. Each placeholder has an HTML comment right above it with the exact markup to swap in once a real album exists (an `<a href="ICLOUD_URL" class="trip-photos">` with the camera icon). Do this once the trip is over and the album link is created.

**Leg page** (e.g. `trips/asia/tokyo-hokkaido.html`): hero + route-strip (quick glance, with dates; each `.stop` carries `data-route` + `tabindex="0"` so it hovers/clicks like a day card) + itinerary (map + `<ol class="legs trip-timeline is-compact">`) + optional notes.

Each day is one `<li class="trip-stop">`:
- `.trip-stop-marker` holds just `.trip-stop-date-num` (day-of-month, e.g. "26") + `.trip-stop-date-mon` (month, e.g. "DEC") — kept short on purpose so it's legible in a small circle. Never put a date range here.
- Inside the `<details class="leg" name="legs" data-route="i,j">`, the `<summary>` has a `.leg-info` block (`.leg-date-range` — the full human range, e.g. "Dec 26–29 · Sat–Tue" — above `.leg-city` with an icon), then a `.leg-lodging` tag (bed icon + the city/place you're actually sleeping that night — use "Home" or "In transit" where relevant), then `.leg-chevron`.

`name="legs"` makes the day cards an exclusive accordion (opening one closes the others) — keep that attribute on every `<details class="leg">` on a page. Keep highlights terse: 2–4 short bullets, not paragraphs. If dates/route aren't locked in, say so directly ("TBD") rather than guessing.

**One card per day, not per date range.** If two+ consecutive days are the same continuing thing (a multi-night stay with nothing new happening), don't create a duplicate card for each date — one card dated at the start of that stretch is enough (the `.leg-date-range` caption can still say "Dec 26–29" in words). Only add a new card when something actually changes (arrival, a different activity, departure).

## PWA

`manifest.webmanifest` + `icons/` (map-pin icon, 32/180/192/512px) + `sw.js` make the site installable ("Add to Home Screen" on iOS, install prompt on Android/desktop Chrome). Every page links the manifest and icons with a path relative to its own depth so it works whether the site is served from a domain root (Vercel) or a subpath (GitHub Pages). `sw.js` is a simple network-first cache.

**Adding these tags to a new page:** copy the `<script>` FOUC-prevention snippet, icon sprite, `.site-actions` markup, manifest/icon `<link>`s, and theme-color/apple-mobile-web-app meta tags from any existing page, adjusting relative path prefixes to match the new page's folder depth.

## Adding to the site

**New leg on an existing trip:**
1. Add a stop object to that leg's map `data-stops` JSON (if it's a new place), with a `mode` for how you get there.
2. Add a `<li class="trip-stop">` (date marker) wrapping a `<details class="leg" name="legs" data-route="i,j">` block per the leg-page pattern above.
3. Add a `.trip-stop` entry (days-until marker) to that trip's hub `trip-timeline`.

**New top-level trip:**
1. Copy `trips/pittsburgh/` (single trip, single leg, TBD details) or `trips/asia/` (multi-leg) as a starting point.
2. Add a `.trip-stop` entry to `index.html`'s Upcoming timeline, with a `data-departure` on the marker, positioned by date. Move it to Past trips once it's over.
