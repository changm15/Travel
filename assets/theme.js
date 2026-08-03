(function () {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const moonIcon = document.getElementById("theme-icon-moon");
  const sunIcon = document.getElementById("theme-icon-sun");

  function currentTheme() {
    const stored = (function () {
      try {
        return localStorage.getItem("theme");
      } catch (e) {
        return null;
      }
    })();
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyIcon(theme) {
    if (moonIcon) moonIcon.style.display = theme === "dark" ? "" : "none";
    if (sunIcon) sunIcon.style.display = theme === "light" ? "" : "none";
  }

  applyIcon(currentTheme());

  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    document.documentElement.setAttribute("data-theme", next);
    applyIcon(next);
  });
})();

(function () {
  const btn = document.getElementById("share-btn");
  const toast = document.getElementById("site-toast");
  if (!btn) return;

  let hideTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  btn.addEventListener("click", async () => {
    const shareData = { title: document.title, url: location.href };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // user cancelled or share failed — nothing to do
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(location.href);
      showToast("Link copied!");
    } catch (e) {
      showToast("Couldn't copy link");
    }
  });
})();
