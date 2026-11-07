// Site-wide script: theme, copy.json text, images, hero traces and the glitch effect.

// ---------- Layout and theme ----------
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

// Light / dark theme (the inline script in <head> sets the starting one)
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

// Follow the OS setting until the visitor picks a theme themselvs
systemDark.addEventListener("change", (e) => {
  if (!savedTheme()) {
    applyTheme(e.matches ? "dark" : "light");
  }
});

// ---------- Copy ----------
// Fills [data-copy] text and [data-copy-list] templates from assets/data/copy.json (*x* = accent, \n = <br>); window.siteCopy resolves when done.

const COPY_URL = "assets/data/copy.json";

function copyLookup(copy, path) {
  return path.split(".").reduce((node, key) => {
    return node == null ? undefined : node[key];
  }, copy);
}

// Builds nodes instead of using innerHTML so a stray "<" in the JSON stays text.
function fillText(el, text) {
  el.replaceChildren();

  String(text).split("\n").forEach((line, i) => {
    if (i > 0) {
      el.appendChild(document.createElement("br"));
    }

    // Odd pieces sit between asterisks.
    line.split("*").forEach((piece, j) => {
      if (!piece) {
        return;
      }
      if (j % 2 === 1) {
        const accent = document.createElement("span");
        accent.className = "accent";
        accent.textContent = piece;
        el.appendChild(accent);
      } else {
        el.appendChild(document.createTextNode(piece));
      }
    });
  });
}

function fillItem(fragment, item) {
  const fields = typeof item === "string" ? { text: item } : item;

  fragment.querySelectorAll("[data-field]").forEach((el) => {
    fillText(el, fields[el.dataset.field] || "");
  });

  fragment.querySelectorAll("[data-field-href]").forEach((el) => {
    const href = fields[el.dataset.fieldHref];
    if (href) {
      el.href = href;
    } else {
      el.remove();
    }
  });

  fragment.querySelectorAll("[data-field-media]").forEach((el) => {
    el.dataset.media = fields[el.dataset.fieldMedia] || el.dataset.media || "";
  });

  fragment.querySelectorAll("[data-field-alt]").forEach((el) => {
    el.alt = fields[el.dataset.fieldAlt] || "";
  });
}

function renderList(host, items) {
  const template = host.querySelector("template");
  if (!template) {
    console.warn("data-copy-list needs a <template> inside", host);
    return;
  }

  items.forEach((item) => {
    const fragment = template.content.cloneNode(true);
    fillItem(fragment, item);
    host.appendChild(fragment);
  });
}

window.siteCopy = fetch(COPY_URL)
  .then((response) => {
    if (!response.ok) {
      throw new Error(COPY_URL + " returned " + response.status);
    }
    return response.json();
  })
  .then((copy) => {
    document.querySelectorAll("[data-copy]").forEach((el) => {
      const text = copyLookup(copy, el.dataset.copy);
      if (typeof text === "string") {
        fillText(el, text);
      } else {
        console.warn("copy.json has no text at", el.dataset.copy);
      }
    });

    document.querySelectorAll("[data-copy-list]").forEach((host) => {
      const items = copyLookup(copy, host.dataset.copyList);
      if (Array.isArray(items)) {
        renderList(host, items);
      } else {
        console.warn("copy.json has no list at", host.dataset.copyList);
      }
    });

    return copy;
  })
  .catch((error) => {
    console.error("Could not load page text:", error);
    return null;
  });

// ---------- Media ----------
// Fills [data-media] images, the favicon and [data-gallery] from assets/data/media.json; waits for the copy above.

const MEDIA_URL = "assets/data/media.json";

function applyImage(el, entry) {
  if (el.tagName === "LINK") {
    el.href = entry.src;
    return;
  }

  el.src = entry.src;

  // A page-authored alt wins, so the same entry can be described per page.
  if (!el.hasAttribute("alt")) {
    el.alt = entry.alt || "";
  }
}

function galleryTile(photo, hidden) {
  const col = document.createElement("div");
  col.className = "col-6 col-md-4";
  col.hidden = hidden;

  const tile = document.createElement("div");
  tile.className = "media-tile";

  const img = document.createElement("img");
  img.src = photo.src;
  img.alt = photo.alt;
  img.loading = "lazy";
  img.decoding = "async";
  if (photo.width) {
    img.width = photo.width;
  }
  if (photo.height) {
    img.height = photo.height;
  }

  tile.appendChild(img);
  col.appendChild(tile);

  return col;
}

function renderGallery(grid, photos) {
  // Shows the first few, and a button reveals the rest.
  const preview = parseInt(grid.dataset.galleryPreview, 10) || photos.length;
  const more = grid.parentElement.querySelector("[data-gallery-more]");

  photos.forEach((photo, i) => {
    grid.appendChild(galleryTile(photo, i >= preview));
  });

  if (!more || photos.length <= preview) {
    return;
  }

  more.textContent = "Show all " + photos.length + " photos";
  more.hidden = false;
  more.addEventListener("click", () => {
    grid.querySelectorAll(".col-6[hidden]").forEach((col) => {
      col.hidden = false;
    });
    more.hidden = true;
  });
}

const mediaData = fetch(MEDIA_URL).then((response) => {
  if (!response.ok) {
    throw new Error(MEDIA_URL + " returned " + response.status);
  }
  return response.json();
});

Promise.all([mediaData, window.siteCopy])
  .then(([media]) => {
    document.querySelectorAll("[data-media]").forEach((el) => {
      const entry = media[el.dataset.media];
      if (entry) {
        applyImage(el, entry);
      } else {
        console.warn("media.json has no entry named", el.dataset.media);
      }
    });

    const grids = document.querySelectorAll("[data-gallery]");
    grids.forEach((grid) => {
      renderGallery(grid, media.gallery || []);
    });

    // The gallery loads after the #hash jump and shifts the page, so jump again.
    const target = grids.length && location.hash && document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView();
    }
  })
  .catch((error) => {
    console.error("Could not load images:", error);
  });

// ---------- Traces ----------
// Hero circuit traces: glowing signals on a grid layer that drifts one cell per loop; colors come from CSS tokens.

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

    if (horizontal) {
      x = Math.max(1, Math.min(cols, x + step));
    } else {
      y = Math.max(1, Math.min(rows, y + step));
    }

    const last = points[points.length - 1];
    if (last[0] !== x || last[1] !== y) {
      points.push([x, y]);
    }
    horizontal = !horizontal;
  }

  return points;
}

function svgEl(name, attrs) {
  const el = document.createElementNS(SVG_NS, name);
  Object.keys(attrs).forEach((key) => {
    el.setAttribute(key, attrs[key]);
  });
  return el;
}

function buildTraces(hero) {
  const old = hero.querySelector(".hero-traces");
  if (old) {
    old.remove();
  }

  const cols = Math.ceil(hero.offsetWidth / GRID) + 1;
  const rows = Math.ceil(hero.offsetHeight / GRID) + 1;

  const wrap = document.createElement("div");
  wrap.className = "hero-traces";
  wrap.setAttribute("aria-hidden", "true");

  const layer = document.createElement("div");
  layer.className = "hero-traces-layer";

  // Grid lines at multiples of GRID, offset 0.5px so 1px lines match the background grid.
  const svg = svgEl("svg", { width: cols * GRID + 1, height: rows * GRID + 1 });
  function at(cell) {
    return cell * GRID + 0.5;
  }

  layer.appendChild(svg);
  wrap.appendChild(layer);
  hero.prepend(wrap);
  hero.classList.add("has-traces");

  const count = Math.min(5, Math.max(2, Math.round((cols * rows) / 90)));

  for (let i = 0; i < count; i += 1) {
    const points = traceWalk(cols - 1, rows - 1);
    if (points.length < 3) {
      continue;
    }

    const coords = points.map((p) => {
      return at(p[0]) + " " + at(p[1]);
    });
    const d = "M" + coords.join(" L");
    const start = points[0];
    const end = points[points.length - 1];

    svg.appendChild(svgEl("path", { d: d, class: "trace-line" }));
    svg.appendChild(svgEl("circle", {
      cx: at(start[0]),
      cy: at(start[1]),
      r: 3.5,
      class: "trace-node",
    }));
    svg.appendChild(svgEl("circle", {
      cx: at(end[0]),
      cy: at(end[1]),
      r: 3.5,
      class: "trace-node",
    }));

    if (reduceMotion.matches) {
      continue;
    }

    const pulse = svgEl("path", { d: d, class: "trace-pulse" });
    svg.appendChild(pulse);

    const length = pulse.getTotalLength();
    pulse.style.strokeDasharray = PULSE + " " + (length + PULSE);

    // Each signal runs for part of the loop and idles the rest, so traces fire out of step.
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

// The hero's text comes from copy.json, so size the traces once it has landed.
Promise.resolve(window.siteCopy).then(() => {
  heroes.forEach(buildTraces);
});

// Rebuild when the width changes; height alone changes as mobile URL bars hide.
let traceWidth = window.innerWidth;
let traceTimer = 0;
window.addEventListener("resize", () => {
  if (window.innerWidth === traceWidth) {
    return;
  }
  traceWidth = window.innerWidth;
  clearTimeout(traceTimer);
  traceTimer = setTimeout(() => {
    heroes.forEach(buildTraces);
  }, 200);
});
reduceMotion.addEventListener("change", () => {
  heroes.forEach(buildTraces);
});

// ---------- Glitch ----------
// Glitch effect: places pink/red bar clusters (other heroes, hackathon card, "start hacking?"); styling lives in styles.css.

const GLITCH_SPOTS = [
  {
    // Skips the home page hero, which holds the logo card
    selector: ".page-hero:not(:has(.hero-logo-wrap))",
    place: "hero",
    bars: 12,
    pixels: 5,
    rest: [0.25, 0.7],
  },
  {
    selector: ".feature",
    place: "feature",
    bars: 8,
    pixels: 3,
    rest: [0.25, 0.7],
  },
  {
    // Over text, so it rests fainter between bursts
    selector: "#join h2 .accent",
    place: "join",
    bars: 8,
    pixels: 3,
    rest: [0.15, 0.4],
  },
];

// Four tones, all pink or red, picked with the pink-N classes in styles.css (glitch section).
const GLITCH_TONES = 4;

function glitchRandom(min, max) {
  return min + Math.random() * (max - min);
}

function glitchPiece(className, width, height, spot) {
  const piece = document.createElement("span");
  piece.className = className + " pink-" + Math.floor(glitchRandom(0, GLITCH_TONES));

  piece.style.left = glitchRandom(0, 88) + "%";
  piece.style.top = glitchRandom(0, 92) + "%";
  piece.style.width = width;
  piece.style.height = height;

  // Each piece gets its own rhythm, so the bursts don't happen in step.
  piece.style.setProperty("--glitch-duration", glitchRandom(2.4, 6.5).toFixed(2) + "s");
  piece.style.setProperty("--glitch-delay", (-glitchRandom(0, 6)).toFixed(2) + "s");
  piece.style.setProperty("--glitch-shift", glitchRandom(-28, 28).toFixed(0) + "px");

  // Resting brightness boost so pixels read against the bars (the animation owns opacity).
  let boost = 0;

  if (className.includes("glitch-pixel")) {
    boost = 0.2;
  }

  const rest = Math.min(1, glitchRandom(spot.rest[0], spot.rest[1]) + boost);
  piece.style.setProperty("--glitch-rest", rest.toFixed(2));

  return piece;
}

function buildGlitch(host, spot) {
  const box = document.createElement("span");
  box.className = "glitch glitch-" + spot.place;
  box.setAttribute("aria-hidden", "true");

  for (let i = 0; i < spot.bars; i += 1) {
    const width = glitchRandom(8, 42).toFixed(0) + "%";
    const height = glitchRandom(2, 9).toFixed(0) + "px";

    box.appendChild(glitchPiece("glitch-bar", width, height, spot));
  }

  for (let i = 0; i < spot.pixels; i += 1) {
    const size = glitchRandom(4, 9).toFixed(0) + "px";

    box.appendChild(glitchPiece("glitch-bar glitch-pixel", size, size, spot));
  }

  host.appendChild(box);
}

// The join accent comes from copy.json, so wait for the text to land.
Promise.resolve(window.siteCopy).then(() => {
  GLITCH_SPOTS.forEach((spot) => {
    document.querySelectorAll(spot.selector).forEach((host) => {
      buildGlitch(host, spot);
    });
  });
});
