# Travel

Hub site for trip itineraries. Static, no build step.

- `index.html` — top-level hub. Upcoming trips sorted soonest-first, then a Past trips section.
- `trips/peru.html` — Peru, Sep 2–9, 2026 (single trip, no legs).
- `trips/asia/index.html` — Asia trip hub, Dec 18, 2026 – Jan 10, 2027. Lists each leg.
  - `trips/asia/tokyo-hokkaido.html` — Leg 1: Japan.
  - `trips/asia/hongkong-southchina-sichuan.html` — Leg 2: Hong Kong, Shenzhen/Guangzhou, Chengdu, Chongqing.
  - `trips/asia/taiwan.html` — Leg 3: Taiwan, then home via Tokyo.
- `assets/style.css` — shared styles.
- `assets/main.js` — countdown widget. Looks for `#countdown[data-departure]` (an ISO date string) and counts down to it; does nothing if the attribute is missing.
- `assets/map.js` — interactive route map (Leaflet + CARTO dark tiles, no API key). Looks for `#trip-map[data-stops]`, a JSON array of `{label, lat, lng}` points in route order. Draws the full route, then highlights the relevant segment when you hover/focus/open a `[data-route="i,j,..."]` element elsewhere on the page (indices into the stops array), and opens+scrolls to the matching leg when you click a map pin.

## Page patterns

**Single trip, no legs yet** (like `trips/peru.html`): hero + route-strip + itinerary (map + `<details class="leg">` list) + optional notes. Countdown only if a real date is known.

**Multi-leg trip** (like the Asia trip): a hub page (`trips/asia/index.html`) with trip-cards linking to each leg, and each leg page is its own single-trip-style page with `data-route` indices matching its own map's stops.

**Adding a leg to an itinerary:**
1. Add a stop object to the map's `data-stops` JSON (if it's a new place).
2. Add a `<details class="leg" data-route="i,j">` block to the `.legs` list, where `i,j` are the stop indices this day's segment touches. Keep it terse: date, city, 2–4 short highlights — not paragraphs.
3. If dates/route aren't locked in, say so directly (e.g. "TBD") rather than guessing.

**Adding a new top-level trip:**
1. Copy `trips/peru.html` (single trip) as a starting point, or `trips/asia/` (multi-leg) if it'll have legs.
2. Add a `.trip-card` to `index.html`, in the Upcoming section, ordered soonest-first. Move it to Past trips once it's over.
