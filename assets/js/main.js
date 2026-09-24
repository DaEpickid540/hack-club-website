// Footer year
document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = new Date().getFullYear();
});

// Close the mobile sidebar after tapping a link
const sidebarEl = document.getElementById("sidebar");
if (sidebarEl) {
  sidebarEl.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => {
      const oc = bootstrap.Offcanvas.getInstance(sidebarEl);
      if (oc) {
        oc.hide();
      }
    });
  });
}

// Light / dark theme
// The inline script in <head> sets the starting theme
const root = document.documentElement;
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const themeColors = { 
  light: "#f4f6fa", 
  dark: "#031426" 
};

function savedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch (e) {
    return null;
  }
}

function applyTheme(theme) {
  root.setAttribute("data-bs-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", themeColors[theme]);
  }
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    const next = theme === "dark" ? "light" : "dark";
    btn.querySelector("i").className = next === "dark" ? "bi bi-moon-stars" : "bi bi-sun";
    btn.querySelector("span").textContent = next === "dark" ? "Dark mode" : "Light mode";
    btn.setAttribute("aria-label", `Switch to ${next} mode`);
  });
}

applyTheme(root.getAttribute("data-bs-theme") || "light");

document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {
      // Storage can be blocked; the theme just won't be remembered.
    }
  });
});

// Follow the OS setting until the visitor picks a theme themselves
systemDark.addEventListener("change", (e) => {
  if (!savedTheme()) {
    applyTheme(e.matches ? "dark" : "light");
  }
});
