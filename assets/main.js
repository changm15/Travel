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
