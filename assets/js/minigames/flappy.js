// While you wait: an endless Flappy run with a best score kept in this
// browser. Ported from the ia-life game; styles are in minigames.css.

import { openModal } from './modal.js';

// Flappy has no target: it runs until the player closes it, and keeps the
// best score this browser has seen.
const FLAPPY_BEST_KEY = 'flappy-best';
// One flap lifts the bird by lift squared over twice gravity, so these two have
// to stay well under the gap or no long run is possible.
const FLAPPY_GRAVITY = 0.38;
const FLAPPY_LIFT = -4.6;
const FLAPPY_GAP = 104;
const FLAPPY_PIPE_WIDTH = 34;
const FLAPPY_PIPE_SPACING = 108;
const FLAPPY_SPEED = 2;
const FLAPPY_BIRD = 13;

/** The best Flappy score saved in this browser, or 0. */
function readBest() {
  try {
    return parseInt(window.localStorage.getItem(FLAPPY_BEST_KEY), 10) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBest(score) {
  try {
    window.localStorage.setItem(FLAPPY_BEST_KEY, String(score));
  } catch (error) {
    // Storage can be blocked; the best score just won't outlive the page.
  }
}

/** Reads a theme colour off the document, so the canvas matches the stylesheet. */
function themeColour(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);

  return value.trim() || fallback;
}

/**
 * Flappy task: fly through the gaps for as long as you can. There is no target
 * score and no ceiling; a pipe or the floor ends the run and the next one
 * starts straight away. The best run is kept in this browser.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} never resolves; the run ends when the modal closes
 */
export function runFlappyTask(title, hint) {
  const body = openModal(title, hint);

  const canvas = document.createElement('canvas');
  canvas.className = 'flappy-screen';
  canvas.tabIndex = 0;

  const status = document.createElement('p');
  status.className = 'minigame-status';

  body.appendChild(canvas);
  body.appendChild(status);

  return new Promise(function () {
    const box = canvas.getBoundingClientRect();
    const width = Math.round(box.width);
    const height = Math.round(box.height);

    // The backing store is scaled for the display, and every coordinate below
    // stays in CSS pixels.
    const ratio = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);

    const ink = themeColour('--heading', '#041f3b');
    const panel = themeColour('--bg-alt', '#f4f6fa');
    const pipe = themeColour('--tile-1', '#041f3b');
    const bird = themeColour('--hc-red', '#c44569');

    const birdX = Math.round(width * 0.26);

    let birdY = height / 2;
    let fall = 0;
    let pipes = [];
    let sincePipe = FLAPPY_PIPE_SPACING;
    let score = 0;
    let best = readBest();
    // The bird hovers until the first flap, at the start and after each crash.
    let waiting = true;
    let loop = 0;

    function restart() {
      birdY = height / 2;
      fall = 0;
      pipes = [];
      sincePipe = FLAPPY_PIPE_SPACING;
      score = 0;
      waiting = true;
    }

    function report() {
      status.textContent = 'Score ' + score + ' · Best ' + best;
    }

    function lift() {
      if (waiting) {
        waiting = false;
        report();
      }

      fall = FLAPPY_LIFT;
    }

    function draw() {
      context.fillStyle = panel;
      context.fillRect(0, 0, width, height);

      context.fillStyle = pipe;
      pipes.forEach(function (item) {
        context.fillRect(item.x, 0, FLAPPY_PIPE_WIDTH, item.gapTop);
        context.fillRect(
          item.x,
          item.gapTop + FLAPPY_GAP,
          FLAPPY_PIPE_WIDTH,
          height - item.gapTop - FLAPPY_GAP
        );
      });

      context.fillStyle = bird;
      context.fillRect(birdX, Math.round(birdY), FLAPPY_BIRD, FLAPPY_BIRD);

      context.strokeStyle = ink;
      context.lineWidth = 1;
      context.strokeRect(birdX + 0.5, Math.round(birdY) + 0.5, FLAPPY_BIRD - 1, FLAPPY_BIRD - 1);
    }

    function step() {
      // The modal moved on to something else, so stop burning frames.
      if (!canvas.isConnected) {
        window.cancelAnimationFrame(loop);

        return;
      }

      if (waiting) {
        draw();
        loop = window.requestAnimationFrame(step);

        return;
      }

      fall += FLAPPY_GRAVITY;
      birdY += fall;

      // No ceiling death: the bird just bumps the top and falls away from it.
      if (birdY < 0) {
        birdY = 0;
        fall = 0;
      }

      sincePipe += 1;

      if (sincePipe >= FLAPPY_PIPE_SPACING) {
        sincePipe = 0;

        // A margin top and bottom, so no gap ever opens off the screen.
        const gapTop = 18 + Math.random() * Math.max(1, height - FLAPPY_GAP - 36);

        pipes.push({ x: width, gapTop: gapTop, passed: false });
      }

      pipes.forEach(function (item) {
        item.x -= FLAPPY_SPEED;

        if (!item.passed && item.x + FLAPPY_PIPE_WIDTH < birdX) {
          item.passed = true;
          score += 1;

          report();
        }
      });

      pipes = pipes.filter(function (item) {
        return item.x + FLAPPY_PIPE_WIDTH > 0;
      });

      const hitFloor = birdY + FLAPPY_BIRD >= height;
      const hitPipe = pipes.some(function (item) {
        const across = birdX + FLAPPY_BIRD > item.x && birdX < item.x + FLAPPY_PIPE_WIDTH;
        const through = birdY > item.gapTop && birdY + FLAPPY_BIRD < item.gapTop + FLAPPY_GAP;

        return across && !through;
      });

      if (hitFloor || hitPipe) {
        const run = score;

        if (run > best) {
          best = run;
          saveBest(best);
        }

        restart();
        status.textContent = 'Crashed at ' + run + '. Best ' + best + '. Flap to go again.';
      }

      draw();

      loop = window.requestAnimationFrame(step);
    }

    canvas.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      canvas.focus();
      lift();
    });

    canvas.addEventListener('keydown', function (event) {
      if (event.key !== ' ' && event.key !== 'ArrowUp' && event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      lift();
    });

    status.textContent = 'Tap, click, or press space to start. Best ' + best + '.';

    // Focus directly rather than through a frame callback: the game loop can
    // be throttled, and the keyboard should work before the first frame.
    canvas.focus();

    loop = window.requestAnimationFrame(step);
  });
}
