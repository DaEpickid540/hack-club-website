// Glitch effect
// Small clusters of pink and red bars that sit still, then jitter in short bursts.
//   - Other pages' heroes: a cluster in the top-right corner. The home page
//     hero has none, so its logo card stays clean.
//   - Hackathon card: a cluster in its bottom-right padding.
//   - Join section: a faint cluster on top of the words "start hacking?".
// Styling and the animation are in glitch.css; this file only places the bars.

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

// Four tones, all pink or red, picked with the pink-N classes in glitch.css.
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

  // Pixels rest a little brighter so they read against the bars.
  // (The animation owns opacity, so the boost has to go into the resting value.)
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

GLITCH_SPOTS.forEach((spot) => {
  document.querySelectorAll(spot.selector).forEach((host) => {
    buildGlitch(host, spot);
  });
});
