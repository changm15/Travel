(function () {
  const departure = new Date("2026-12-18T00:00:00");
  const el = document.getElementById("countdown");
  if (!el) return;

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
