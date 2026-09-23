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
      if (oc) oc.hide();
    });
  });
}

// Light / dark theme
// The inline script in <head> sets the starting theme; this keeps it in sync.
const root = document.documentElement;
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const themeColors = { light: "#f4f6fa", dark: "#031426" };

function savedTheme() {
  try { return localStorage.getItem("theme"); } catch (e) { return null; }
}

function applyTheme(theme) {
  root.setAttribute("data-bs-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", themeColors[theme]);
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
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
});

// Hero circuit traces
// Draws a few right-angle traces on the hero grid and sends a glowing signal
// along each. The grid and traces sit on one layer that drifts by exactly one
// cell per loop, so the lines always stay lined up. Colors come from CSS tokens,
// so the theme toggle restyles them without a rebuild.
const GRID = 42;
const PULSE = 56;
const SVG_NS = "http://www.w3.org/2000/svg";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/** A walk of alternating horizontal and vertical runs, in grid cells. */
function traceWalk(cols, rows) {
  let x = randInt(Math.floor(cols * 0.35), cols);
  let y = randInt(1, rows);
  let horizontal = Math.random() < 0.5;
  const points = [[x, y]];

  for (let i = randInt(3, 6); i > 0; i -= 1) {
    const step = randInt(2, 6) * (Math.random() < 0.5 ? -1 : 1);

    if (horizontal) x = Math.max(1, Math.min(cols, x + step));
    else y = Math.max(1, Math.min(rows, y + step));

    const last = points[points.length - 1];
    if (last[0] !== x || last[1] !== y) points.push([x, y]);
    horizontal = !horizontal;
  }

  return points;
}

function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach((key) => el.setAttribute(key, attrs[key]));
  return el;
}

function buildTraces(hero) {
  const old = hero.querySelector(".hero-traces");
  if (old) old.remove();

  const cols = Math.ceil(hero.offsetWidth / GRID) + 1;
  const rows = Math.ceil(hero.offsetHeight / GRID) + 1;

  const wrap = document.createElement("div");
  wrap.className = "hero-traces";
  wrap.setAttribute("aria-hidden", "true");

  const layer = document.createElement("div");
  layer.className = "hero-traces-layer";

  // Layer coordinates: grid lines sit at multiples of GRID, half a pixel in
  // so a 1px line lands on the same pixels as the background grid.
  const svg = svgEl("svg", { width: cols * GRID + 1, height: rows * GRID + 1 });
  const at = (cell) => cell * GRID + 0.5;

  layer.appendChild(svg);
  wrap.appendChild(layer);
  hero.prepend(wrap);
  hero.classList.add("has-traces");

  const count = Math.min(9, Math.max(4, Math.round((cols * rows) / 45)));

  for (let i = 0; i < count; i += 1) {
    const points = traceWalk(cols - 1, rows - 1);
    if (points.length < 3) continue;

    const d = "M" + points.map((p) => at(p[0]) + " " + at(p[1])).join(" L");
    const start = points[0];
    const end = points[points.length - 1];

    svg.appendChild(svgEl("path", { d: d, class: "trace-line" }));
    svg.appendChild(svgEl("circle", { cx: at(start[0]), cy: at(start[1]), r: 3.5, class: "trace-node" }));
    svg.appendChild(svgEl("circle", { cx: at(end[0]), cy: at(end[1]), r: 3.5, class: "trace-node" }));

    if (reduceMotion.matches) continue;

    const pulse = svgEl("path", { d: d, class: "trace-pulse" });
    svg.appendChild(pulse);

    const length = pulse.getTotalLength();
    pulse.style.strokeDasharray = PULSE + " " + (length + PULSE);

    // The signal runs for part of each loop and waits off the end for the
    // rest, so the traces fire at different moments instead of in step.
    const travel = 0.45 + Math.random() * 0.3;

    pulse.animate(
      [
        { strokeDashoffset: PULSE, offset: 0 },
        { strokeDashoffset: -length, offset: travel },
        { strokeDashoffset: -length, offset: 1 },
      ],
      {
        duration: 2600 + length * 5,
        delay: -Math.random() * 6000,
        iterations: Infinity,
        easing: "linear",
      }
    );
  }
}

const heroes = document.querySelectorAll(".page-hero");
heroes.forEach(buildTraces);

// Rebuild when the width changes; height alone changes as mobile URL bars hide.
let traceWidth = window.innerWidth;
let traceTimer = 0;
window.addEventListener("resize", () => {
  if (window.innerWidth === traceWidth) return;
  traceWidth = window.innerWidth;
  clearTimeout(traceTimer);
  traceTimer = setTimeout(() => heroes.forEach(buildTraces), 200);
});
reduceMotion.addEventListener("change", () => heroes.forEach(buildTraces));

// Follow the OS setting until the visitor picks a theme themselves
systemDark.addEventListener("change", (e) => {
  if (!savedTheme()) applyTheme(e.matches ? "dark" : "light");
});
