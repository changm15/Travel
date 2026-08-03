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

  const latlngs = stops.map((s) => [s.lat, s.lng]);
  const legs = Array.from(document.querySelectorAll("[data-route]"));

  const map = L.map(el, { scrollWheelZoom: false });

  const isLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
  const tileTheme = isLight ? "light_all" : "dark_all";

  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${tileTheme}/{z}/{x}/{y}{r}.png`, {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  let activePath = null;
  if (latlngs.length > 1) {
    L.polyline(latlngs, { color: isLight ? "#c9beb8" : "#5a4d4a", weight: 3, opacity: 0.9 }).addTo(map);
    activePath = L.polyline([], { color: "#d4213f", weight: 4, opacity: 0.95 }).addTo(map);
  }

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
    if (activePath) activePath.setLatLngs([]);
    uniqueMarkers.forEach((m) => {
      if (!m.getElement()) return;
      m.getElement().classList.remove("is-active", "is-dimmed");
    });
  }

  function highlight(indices) {
    clearHighlight();
    const path = indices.map((i) => latlngs[i]).filter(Boolean);
    if (activePath && path.length > 1) activePath.setLatLngs(path);

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
    const match = legs.find((node) => parseIndices(node).some((i) => indices.includes(i)));
    if (!match) return;
    match.open = true;
    match.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  let openIndices = null;

  legs.forEach((node) => {
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

    node.addEventListener("toggle", () => {
      if (node.open) {
        openIndices = indices;
        highlight(indices);
        focusView(indices);
      } else {
        const stillOpen = document.querySelector("details.leg[open]");
        if (stillOpen) {
          openIndices = parseIndices(stillOpen);
          highlight(openIndices);
        } else {
          openIndices = null;
          clearHighlight();
          resetView();
        }
      }
    });
  });
})();
