(function () {
  const el = document.getElementById("countdown");
  if (!el || !el.dataset.departure) return;
  const departure = new Date(el.dataset.departure);

  function render() {
    const now = new Date();
    const diff = departure - now;

    if (diff <= 0) {
      el.textContent = "Wheels up — have an amazing trip! ✈️";
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    el.textContent = `${days} day${days === 1 ? "" : "s"}, ${hours} hour${hours === 1 ? "" : "s"} until departure`;
  }

  render();
  setInterval(render, 60000);
})();

(function () {
  const nodes = document.querySelectorAll(".trip-stop-days-num[data-departure]");
  if (!nodes.length) return;

  function render() {
    const now = new Date();
    nodes.forEach((el) => {
      const departure = new Date(el.dataset.departure);
      const diff = departure - now;
      const days = Math.ceil(diff / 86400000);
      const label = el.nextElementSibling;

      if (days <= 0) {
        el.textContent = "✈️";
        if (label) label.textContent = "underway";
      } else {
        el.textContent = String(days);
        if (label) label.textContent = days === 1 ? "day" : "days";
      }
    });
  }

  render();
  setInterval(render, 60000);
})();

(function () {
  const el = document.getElementById("home-base-label");
  if (!el) return;

  // Add more { start, end, label } ranges here as home base changes.
  const RANGES = [{ start: "2026-09-01T00:00:00", end: "2026-09-30T23:59:59", label: "Pickering, ON" }];
  const DEFAULT_LABEL = "New York City";

  function render() {
    const now = new Date();
    const match = RANGES.find((r) => now >= new Date(r.start) && now <= new Date(r.end));
    el.textContent = match ? match.label : DEFAULT_LABEL;
  }

  render();
  setInterval(render, 3600000);
})();

(function () {
  if (!("serviceWorker" in navigator)) return;

  const scripts = document.getElementsByTagName("script");
  let src = "";
  for (let i = 0; i < scripts.length; i++) {
    const s = scripts[i].getAttribute("src") || "";
    if (s.indexOf("assets/main.js") !== -1) {
      src = s;
      break;
    }
  }
  const prefix = src.replace(/assets\/main\.js.*$/, "");

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(prefix + "sw.js").catch(() => {});
  });
})();
