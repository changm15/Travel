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

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  let activePath = null;
  if (latlngs.length > 1) {
    L.polyline(latlngs, { color: "#3d5578", weight: 3, opacity: 0.9 }).addTo(map);
    activePath = L.polyline([], { color: "#7fd4ff", weight: 4, opacity: 0.95 }).addTo(map);
  }

  const groups = new Map();
  stops.forEach((s, i) => {
    const key = `${s.lat},${s.lng}`;
    if (!groups.has(key)) groups.set(key, { label: s.label, lat: s.lat, lng: s.lng, indices: [] });
    groups.get(key).indices.push(i);
  });

  const markers = new Array(stops.length);
  let num = 0;
  groups.forEach((g) => {
    num += 1;
    const icon = L.divIcon({ className: "trip-map-marker", html: `<span>${num}</span>`, iconSize: [24, 24] });
    const marker = L.marker([g.lat, g.lng], { icon }).addTo(map);
    marker.bindPopup(`<strong>${g.label}</strong>`);
    marker.on("click", () => focusLegs(g.indices));
    g.indices.forEach((i) => {
      markers[i] = marker;
    });
  });

  if (latlngs.length > 1) {
    map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
  } else {
    map.setView(latlngs[0], 5);
  }

  function parseIndices(node) {
    return (node.dataset.route || "")
      .split(",")
      .map((n) => parseInt(n, 10))
      .filter((n) => !Number.isNaN(n));
  }

  function clearActive() {
    if (activePath) activePath.setLatLngs([]);
    markers.forEach((m) => m && m.getElement() && m.getElement().classList.remove("is-active"));
  }

  function activate(indices) {
    clearActive();
    const path = indices.map((i) => latlngs[i]).filter(Boolean);
    if (activePath && path.length > 1) activePath.setLatLngs(path);
    indices.forEach((i) => {
      const m = markers[i];
      if (m && m.getElement()) m.getElement().classList.add("is-active");
    });
  }

  function focusLegs(indices) {
    const match = legs.find((node) => parseIndices(node).some((i) => indices.includes(i)));
    activate(indices);
    if (!match) return;
    match.open = true;
    match.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  legs.forEach((node) => {
    const indices = parseIndices(node);
    if (!indices.length) return;
    node.addEventListener("mouseenter", () => activate(indices));
    node.addEventListener("mouseleave", clearActive);
    node.addEventListener("focus", () => activate(indices));
    node.addEventListener("blur", clearActive);
    node.addEventListener("toggle", () => {
      if (node.open) activate(indices);
    });
  });
})();
