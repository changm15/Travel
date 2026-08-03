(function () {
  const el = document.getElementById("trip-map");
  if (!el || typeof L === "undefined") return;

  let stops;
  try {
    stops = JSON.parse(el.dataset.stops || "[]");
  } catch (e) {
    return;
  }
  if (!stops.length) return;

  // Let the user collapse the map to just read the day-by-day list,
  // especially handy on mobile where the map eats a lot of vertical space.
  const mapWrap = el.closest(".itinerary-map-wrap");
  let toggleBtn = null;
  if (mapWrap) {
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "map-toggle-btn";
    toggleBtn.textContent = "Hide map";
    toggleBtn.setAttribute("aria-label", "Hide map");
    mapWrap.insertBefore(toggleBtn, el);
  }

  const latlngs = stops.map((s) => [s.lat, s.lng]);
  // Any element with data-route participates in hover/focus highlighting
  // (day cards AND the route-strip pills). Only <details class="leg"> is a
  // valid target for "open + scroll to" (marker clicks, route-strip clicks).
  const interactive = Array.from(document.querySelectorAll("[data-route]"));
  const legDetails = interactive.filter((n) => n.tagName === "DETAILS");

  const map = L.map(el, { scrollWheelZoom: false });

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const hidden = mapWrap.classList.toggle("is-hidden");
      toggleBtn.textContent = hidden ? "Show map" : "Hide map";
      toggleBtn.setAttribute("aria-label", hidden ? "Show map" : "Hide map");
      if (!hidden) {
        setTimeout(() => map.invalidateSize(), 50);
      }
    });
  }

  const forcedTheme = document.documentElement.getAttribute("data-theme");
  const isLight =
    forcedTheme === "light" ||
    (forcedTheme !== "dark" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
  const tileTheme = isLight ? "light_all" : "dark_all";

  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileTheme}/{z}/{x}/{y}{r}.png`, {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  // Each stop's `mode` describes how you get there FROM THE PREVIOUS stop.
  // flight = solid straight line (matches how flight paths are drawn).
  // ground (train/car/bus) = dashed, traced along real roads via OSRM.
  // hike = dotted straight line (no free trail-accurate routing available).
  const MODE_DASH = {
    flight: null,
    ground: "10 7",
    hike: "1 8",
  };

  function modeFor(i) {
    return MODE_DASH[stops[i] && stops[i].mode] !== undefined ? stops[i].mode : "flight";
  }

  // Free, no-API-key road routing (OSRM's public demo server, driving
  // profile). Best-effort: on any failure we just keep the straight line.
  const routeCache = new Map();

  function roadRoute(a, b) {
    const key = `${a[0]},${a[1]}-${b[0]},${b[1]}`;
    if (routeCache.has(key)) return routeCache.get(key);
    const promise = fetch(
      `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const coords = data && data.routes && data.routes[0] && data.routes[0].geometry.coordinates;
        return coords && coords.length ? coords.map((c) => [c[1], c[0]]) : null;
      })
      .catch(() => null);
    routeCache.set(key, promise);
    return promise;
  }

  const baseSegments = [];
  for (let i = 1; i < latlngs.length; i++) {
    const mode = modeFor(i);
    const line = L.polyline([latlngs[i - 1], latlngs[i]], {
      color: isLight ? "#c9beb8" : "#5a4d4a",
      weight: 3,
      opacity: 0.9,
      dashArray: MODE_DASH[mode],
      lineCap: "round",
    }).addTo(map);
    baseSegments.push(line);

    if (mode === "ground") {
      roadRoute(latlngs[i - 1], latlngs[i]).then((path) => {
        if (path) line.setLatLngs(path);
      });
    }
  }

  let activeSegments = [];

  const groups = new Map();
  stops.forEach((s, i) => {
    const key = `${s.lat},${s.lng}`;
    if (!groups.has(key)) groups.set(key, { label: s.label, lat: s.lat, lng: s.lng, indices: [] });
    groups.get(key).indices.push(i);
  });

  const markers = new Array(stops.length);
  const uniqueMarkers = [];
  let num = 0;
  groups.forEach((g) => {
    num += 1;
    const icon = L.divIcon({ className: "trip-map-marker", html: `<span>${num}</span>`, iconSize: [24, 24] });
    const marker = L.marker([g.lat, g.lng], { icon }).addTo(map);
    marker.bindPopup(`<strong>${g.label}</strong>`);
    marker.on("click", () => focusLegs(g.indices));
    uniqueMarkers.push(marker);
    g.indices.forEach((i) => {
      markers[i] = marker;
    });
  });

  const overviewBounds = latlngs.length > 1 ? L.latLngBounds(latlngs) : null;

  if (overviewBounds) {
    map.fitBounds(overviewBounds, { padding: [28, 28] });
  } else {
    map.setView(latlngs[0], 5);
  }

  function parseIndices(node) {
    return (node.dataset.route || "")
      .split(",")
      .map((n) => parseInt(n, 10))
      .filter((n) => !Number.isNaN(n));
  }

  function clearHighlight() {
    activeSegments.forEach((s) => map.removeLayer(s));
    activeSegments = [];
    uniqueMarkers.forEach((m) => {
      if (!m.getElement()) return;
      m.getElement().classList.remove("is-active", "is-dimmed");
    });
  }

  function highlight(indices) {
    clearHighlight();

    for (let k = 1; k < indices.length; k++) {
      const i = indices[k];
      const j = indices[k - 1];
      if (Math.abs(i - j) !== 1) continue;
      const hi = Math.max(i, j);
      const mode = modeFor(hi);
      const seg = L.polyline([latlngs[j], latlngs[i]], {
        color: "#d4213f",
        weight: 4,
        opacity: 0.95,
        dashArray: MODE_DASH[mode],
        lineCap: "round",
      }).addTo(map);
      activeSegments.push(seg);

      if (mode === "ground") {
        roadRoute(latlngs[j], latlngs[i]).then((path) => {
          if (path && activeSegments.includes(seg)) seg.setLatLngs(path);
        });
      }
    }

    const activeMarkers = new Set(indices.map((i) => markers[i]).filter(Boolean));
    if (!activeMarkers.size) return;
    uniqueMarkers.forEach((m) => {
      if (!m.getElement()) return;
      m.getElement().classList.add(activeMarkers.has(m) ? "is-active" : "is-dimmed");
    });
  }

  function focusView(indices) {
    // Focus tightly on this leg's own stops — they already encode "this
    // place and where it connects to," so no extra neighbor padding.
    const points = indices.map((i) => latlngs[i]).filter(Boolean);
    if (!points.length) return;

    if (points.length > 1) {
      map.flyToBounds(L.latLngBounds(points), { padding: [70, 70], maxZoom: 12, duration: 0.6 });
    } else {
      map.flyTo(points[0], 10, { duration: 0.6 });
    }
  }

  function resetView() {
    if (overviewBounds) {
      map.flyToBounds(overviewBounds, { padding: [28, 28], duration: 0.6 });
    } else {
      map.flyTo(latlngs[0], 5, { duration: 0.6 });
    }
  }

  function focusLegs(indices) {
    const match = legDetails.find((node) => parseIndices(node).some((i) => indices.includes(i)));
    if (!match) return;
    match.open = true;
    match.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let openIndices = null;

  interactive.forEach((node) => {
    const indices = parseIndices(node);
    if (!indices.length) return;

    node.addEventListener("mouseenter", () => highlight(indices));
    node.addEventListener("mouseleave", () => {
      if (openIndices) highlight(openIndices);
      else clearHighlight();
    });
    node.addEventListener("focus", () => highlight(indices));
    node.addEventListener("blur", () => {
      if (openIndices) highlight(openIndices);
      else clearHighlight();
    });

    if (node.tagName === "DETAILS") {
      node.addEventListener("toggle", () => {
        if (node.open) {
          openIndices = indices;
          highlight(indices);
          focusView(indices);
        } else {
          // In an exclusive name="legs" group, closing this one and opening
          // the next fire as two separate toggle events — this one's close
          // can arrive before the other's open is applied. Defer the "is
          // anything still open" check a tick so we don't reset-zoom out
          // only to immediately zoom back in a moment later.
          setTimeout(() => {
            const stillOpen = document.querySelector("details.leg[open]");
            if (stillOpen) {
              openIndices = parseIndices(stillOpen);
              highlight(openIndices);
            } else {
              openIndices = null;
              clearHighlight();
              resetView();
            }
          }, 0);
        }
      });
    } else {
      // Route-strip pill (or any other non-<details> interactive element):
      // clicking jumps to and opens the matching leg card.
      node.addEventListener("click", () => focusLegs(indices));
    }
  });
})();
