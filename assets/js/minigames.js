// Four Among Us-style tasks, ported from the ia-life game. Each is a small
// mechanical job on a panel. Styling lives in styles.css under MINIGAMES.

import { openModal } from './game-modal.js';

const GRID = 5;
const PATTERN_LENGTH = 5;

const POPUP_COUNT = 6;

const FLAPPY_TARGET = 5;
// One flap lifts the bird by lift squared over twice gravity, so these two have
// to stay well under the gap or no run of five is possible.
const FLAPPY_GRAVITY = 0.38;
const FLAPPY_LIFT = -4.6;
const FLAPPY_GAP = 104;
const FLAPPY_PIPE_WIDTH = 34;
const FLAPPY_PIPE_SPACING = 108;
const FLAPPY_SPEED = 2;
const FLAPPY_BIRD = 13;

// What the fake windows say. The joke is that none of them are the thing the
// player was trying to do.
const POPUP_WINDOWS = [
  { title: 'Registration', text: 'Are you sure you want to leave this page?' },
  { title: 'Reminder', text: 'The run of show has been updated. Again.' },
  { title: 'Printer', text: 'Badge printer is offline. Check the cable.' },
  { title: 'Calendar', text: 'Judges briefing started 3 minutes ago.' },
  { title: 'Inbox', text: 'A sponsor replied to a thread from March.' },
  { title: 'Wi-Fi', text: 'The guest network needs the password again.' },
];

/** Picks a pattern of distinct cells for the reactor task. */
function makePattern() {
  const cells = [];

  while (cells.length < PATTERN_LENGTH) {
    const cell = Math.floor(Math.random() * GRID * GRID);

    if (!cells.includes(cell)) {
      cells.push(cell);
    }
  }

  return cells;
}

/** Builds one 5x5 grid and returns it with its cell buttons. */
function makeGrid(interactive) {
  const grid = document.createElement('div');
  grid.className = 'reactor-grid';

  const cells = [];

  for (let i = 0; i < GRID * GRID; i += 1) {
    const cell = document.createElement(interactive ? 'button' : 'span');
    cell.className = 'reactor-cell';

    if (interactive) {
      cell.type = 'button';
    }

    grid.appendChild(cell);
    cells.push(cell);
  }

  return { grid: grid, cells: cells };
}

/**
 * Reactor task: a pattern lights up on the left panel, the player repeats it on
 * the right. A wrong cell resets the attempt and shows the pattern again.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} resolves once the pattern is matched
 */
export function runReactorTask(title, hint) {
  const body = openModal(title, hint);

  const board = document.createElement('div');
  board.className = 'reactor-board';

  const left = makeGrid(false);
  const right = makeGrid(true);

  board.appendChild(left.grid);
  board.appendChild(right.grid);

  const status = document.createElement('p');
  status.className = 'minigame-status';
  status.textContent = 'Watch the sequence, then repeat it.';

  body.appendChild(board);
  body.appendChild(status);

  return new Promise(function (resolve) {
    const pattern = makePattern();
    const matched = [];
    let accepting = false;

    function showPattern() {
      accepting = false;
      matched.length = 0;

      left.cells.concat(right.cells).forEach(function (cell) {
        cell.classList.remove('is-lit');
      });

      // The pattern lights up one cell at a time, then stays up for copying.
      pattern.forEach(function (index, order) {
        window.setTimeout(function () {
          left.cells[index].classList.add('is-lit');

          if (order === pattern.length - 1) {
            accepting = true;
            status.textContent = 'Now mirror it on the right.';
          }
        }, 260 * (order + 1));
      });
    }

    right.cells.forEach(function (cell, index) {
      cell.addEventListener('click', function () {
        if (!accepting || matched.includes(index)) {
          return;
        }

        // The pattern is on screen the whole time, so any order will do. Only
        // a cell that is not part of it counts as a miss.
        if (!pattern.includes(index)) {
          status.textContent = 'Wrong cell. Watch again.';
          showPattern();

          return;
        }

        cell.classList.add('is-lit');
        matched.push(index);

        if (matched.length === pattern.length) {
          accepting = false;
          status.textContent = 'Well played.';

          window.setTimeout(resolve, 450);
        }
      });
    });

    showPattern();
  });
}

/**
 * Set route task: drag the marker onto the target on a screen.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} resolves once the marker sits on the target
 */
export function runSetRouteTask(title, hint) {
  const body = openModal(title, hint);

  const screen = document.createElement('div');
  screen.className = 'route-screen';

  const target = document.createElement('div');
  target.className = 'route-target';

  const marker = document.createElement('div');
  marker.className = 'route-marker';
  marker.tabIndex = 0;

  const status = document.createElement('p');
  status.className = 'minigame-status';
  status.textContent = 'Drag the marker onto the ring.';

  screen.appendChild(target);
  screen.appendChild(marker);
  body.appendChild(screen);
  body.appendChild(status);

  return new Promise(function (resolve) {
    // Percentages, so the task works at any screen size.
    const goal = { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 };
    const start = { x: goal.x > 50 ? 12 : 88, y: goal.y > 50 ? 12 : 88 };

    target.style.left = goal.x + '%';
    target.style.top = goal.y + '%';
    marker.style.left = start.x + '%';
    marker.style.top = start.y + '%';

    let dragging = false;
    let done = false;

    function moveTo(clientX, clientY) {
      const box = screen.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((clientX - box.left) / box.width) * 100));
      const y = Math.max(0, Math.min(100, ((clientY - box.top) / box.height) * 100));

      marker.style.left = x + '%';
      marker.style.top = y + '%';

      const near = Math.abs(x - goal.x) < 6 && Math.abs(y - goal.y) < 6;

      target.classList.toggle('is-near', near);

      if (near && !done) {
        done = true;
        dragging = false;
        marker.style.left = goal.x + '%';
        marker.style.top = goal.y + '%';
        status.textContent = 'Well played.';

        window.setTimeout(resolve, 450);
      }
    }

    marker.addEventListener('pointerdown', function (event) {
      dragging = true;
      marker.setPointerCapture(event.pointerId);
    });

    marker.addEventListener('pointermove', function (event) {
      if (dragging && !done) {
        moveTo(event.clientX, event.clientY);
      }
    });

    marker.addEventListener('pointerup', function () {
      dragging = false;
    });

    // Keyboard fallback, so the task is not mouse-only.
    marker.addEventListener('keydown', function (event) {
      const steps = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] };
      const move = steps[event.key];

      if (!move || done) {
        return;
      }

      event.preventDefault();

      const box = screen.getBoundingClientRect();
      const current = marker.getBoundingClientRect();

      moveTo(
        current.left + current.width / 2 + (move[0] / 100) * box.width,
        current.top + current.height / 2 + (move[1] / 100) * box.height
      );
    });
  });
}


/**
 * Popup task: a screen full of windows that are not what the player wanted.
 * Close all of them.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} resolves once the last window is gone
 */
export function runPopupTask(title, hint) {
  const body = openModal(title, hint);

  const screen = document.createElement('div');
  screen.className = 'popup-screen';

  const status = document.createElement('p');
  status.className = 'minigame-status';

  body.appendChild(screen);
  body.appendChild(status);

  return new Promise(function (resolve) {
    let left = POPUP_COUNT;

    function report() {
      status.textContent = left === 1 ? '1 window left.' : left + ' windows left.';
    }

    POPUP_WINDOWS.slice(0, POPUP_COUNT).forEach(function (entry, index) {
      const popup = document.createElement('div');
      popup.className = 'popup-window';

      // Percentages, so the scatter works at any screen size. Each window sits
      // above the one before it, which is what makes the pile feel like a pile.
      popup.style.left = (4 + Math.random() * 42) + '%';
      popup.style.top = (4 + Math.random() * 46) + '%';
      popup.style.zIndex = String(index + 1);

      const bar = document.createElement('div');
      bar.className = 'popup-bar';

      const label = document.createElement('span');
      label.className = 'popup-title';
      label.textContent = entry.title;

      const close = document.createElement('button');
      close.className = 'popup-close';
      close.type = 'button';
      close.textContent = '×';
      close.setAttribute('aria-label', 'Close ' + entry.title);

      const text = document.createElement('p');
      text.className = 'popup-text';
      text.textContent = entry.text;

      bar.appendChild(label);
      bar.appendChild(close);
      popup.appendChild(bar);
      popup.appendChild(text);
      screen.appendChild(popup);

      close.addEventListener('click', function () {
        popup.remove();
        left -= 1;

        if (left > 0) {
          report();

          return;
        }

        status.textContent = 'Well played.';

        window.setTimeout(resolve, 450);
      });
    });

    report();
  });
}

/** Reads a theme colour off the document, so the canvas matches the stylesheet. */
function themeColour(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);

  return value.trim() || fallback;
}

/**
 * Flappy task: fly through the gaps. Hitting anything puts the player back to
 * nothing, so the score has to be run in one clean stretch.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} resolves once the target score is reached
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

  return new Promise(function (resolve) {
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
    let done = false;
    let loop = 0;

    function restart() {
      birdY = height / 2;
      fall = 0;
      pipes = [];
      sincePipe = FLAPPY_PIPE_SPACING;
      score = 0;
    }

    function report() {
      status.textContent = 'Score ' + score + ' of ' + FLAPPY_TARGET + '.';
    }

    function lift() {
      if (done) {
        return;
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

      fall += FLAPPY_GRAVITY;
      birdY += fall;

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

      const hitFloor = birdY + FLAPPY_BIRD >= height || birdY <= 0;
      const hitPipe = pipes.some(function (item) {
        const across = birdX + FLAPPY_BIRD > item.x && birdX < item.x + FLAPPY_PIPE_WIDTH;
        const through = birdY > item.gapTop && birdY + FLAPPY_BIRD < item.gapTop + FLAPPY_GAP;

        return across && !through;
      });

      if (score >= FLAPPY_TARGET) {
        done = true;
        status.textContent = 'Well played.';
        draw();
        window.cancelAnimationFrame(loop);
        window.setTimeout(resolve, 450);

        return;
      }

      if (hitFloor || hitPipe) {
        restart();
        status.textContent = 'Clipped it. Back to nothing.';
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

    report();

    // Focus directly rather than through a frame callback: the game loop can
    // be throttled, and the keyboard should work before the first frame.
    canvas.focus();

    loop = window.requestAnimationFrame(step);
  });
}
