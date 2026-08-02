# Asia Trip — End of 2026

Trip hub site for the crew. `index.html` is the landing page linking to each leg; each leg gets its own page under `trips/`.

Static site, no build step.

- `index.html` — hub page, lists trip cards
- `trips/tokyo-hokkaido.html` — Chicago → Tokyo → Sapporo → Noboribetsu → Hakodate → Tokyo → Hong Kong, Dec 18–23, 2026
- `assets/style.css`, `assets/main.js` — shared styles/countdown, used by every page

## Adding a new leg

1. Copy `trips/tokyo-hokkaido.html` as a starting point for the new subpage under `trips/`.
2. Add a `.trip-card` link to it in `index.html`.
3. Update the day cards in the new subpage — flight numbers, hotels, and reservation details are still TBD placeholders across the site.
