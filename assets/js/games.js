// Stand-in for ia-life's modal.js: openModal(title, hint) returns a Bootstrap modal body to render into.

const dialog = document.getElementById('game-modal');
const titleEl = dialog.querySelector('[data-game-title]');
const hintEl = dialog.querySelector('[data-game-hint]');
const bodyEl = dialog.querySelector('[data-game-body]');

const modal = bootstrap.Modal.getOrCreateInstance(dialog);

/** Sets the heading and hint, clears the body, and returns it. */
function openModal(title, hint) {
  titleEl.textContent = title;
  hintEl.textContent = hint || '';
  hintEl.hidden = !hint;
  bodyEl.replaceChildren();

  return bodyEl;
}

/** Resolves once the modal has finished opening, so canvases measure correctly. */
function showModal() {
  return new Promise(function (resolve) {
    if (dialog.classList.contains('show')) {
      resolve();

      return;
    }

    dialog.addEventListener('shown.bs.modal', function () {
      resolve();
    }, { once: true });
    modal.show();
  });
}

// Emptying the body on close disconnects the flappy canvas, which stops its loop.
dialog.addEventListener('hidden.bs.modal', function () {
  bodyEl.replaceChildren();
});



// Mirror the pattern from the left panel on the right. Ported from ia-life; styles in styles.css.


const GRID = 5;
const PATTERN_LENGTH = 5;
// Time between cells lighting up while the pattern is shown.
const PATTERN_STEP_MS = 650;

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

/** Reactor task: repeat the pattern; a wrong cell resets it. Resolves once matched. */
function runReactorTask(title, hint) {
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
        }, PATTERN_STEP_MS * (order + 1));
      });
    }

    right.cells.forEach(function (cell, index) {
      cell.addEventListener('click', function () {
        if (!accepting || matched.includes(index)) {
          return;
        }

        // Pattern stays visible, so any order works; only a cell outside it is a miss.
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


// Drag the marker onto the ring over several rounds. Ported from ia-life; styles in styles.css.


const ROUTE_ROUNDS = 5;

/** Picks a goal at least 35% of the screen away from where the marker is. */
function routeGoal(from) {
  let goal;

  do {
    goal = { x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 };
  } while (Math.hypot(goal.x - from.x, goal.y - from.y) < 35);

  return goal;
}

/** Set route task: drag the marker onto a new target each round. Resolves after the last. */
function runSetRouteTask(title, hint) {
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
  screen.appendChild(target);
  screen.appendChild(marker);
  body.appendChild(screen);
  body.appendChild(status);

  return new Promise(function (resolve) {
    // Percentages, so the task works at any screen size.
    let round = 1;
    let goal = routeGoal({ x: 50, y: 50 });
    const start = { x: goal.x > 50 ? 12 : 88, y: goal.y > 50 ? 12 : 88 };

    function placeGoal() {
      target.style.left = goal.x + '%';
      target.style.top = goal.y + '%';
      target.classList.remove('is-near');
      status.textContent = 'Round ' + round + ' of ' + ROUTE_ROUNDS + '. Drag the marker onto the ring.';
    }

    placeGoal();
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

        if (round === ROUTE_ROUNDS) {
          status.textContent = 'All ' + ROUTE_ROUNDS + ' routes set. Well played.';
          window.setTimeout(resolve, 450);

          return;
        }

        // A short beat on the ring, then the next targt appears.
        status.textContent = 'Locked in.';
        window.setTimeout(function () {
          round += 1;
          goal = routeGoal(goal);
          placeGoal();
          done = false;
        }, 450);
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
      const steps = {
        ArrowLeft: [-4, 0],
        ArrowRight: [4, 0],
        ArrowUp: [0, -4],
        ArrowDown: [0, 4],
      };
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


// Close every pop-up against the clock while new ones keep opening. Ported from ia-life; styles in styles.css.


const POPUP_COUNT = 6;
// A new window every few seconds, and a misclick opens this many more.
const POPUP_SPAWN_MS = 4000;
const POPUP_MISCLICK_PENALTY = 2;

// Fake window text; the joke is that none of them are what the player wanted.
const POPUP_WINDOWS = [
  { title: 'Registration', text: 'Are you sure you want to leave this page?' },
  { title: 'Reminder', text: 'The run of show has been updated. Again.' },
  { title: 'Printer', text: 'Badge printer is offline. Check the cable.' },
  { title: 'Calendar', text: 'Judges briefing started 3 minutes ago.' },
  { title: 'Inbox', text: 'A sponsor replied to a thread from March.' },
  { title: 'Wi-Fi', text: 'The guest network needs the password again.' },
  { title: 'Updates', text: 'Restart now to finish installing 14 updates.' },
  { title: 'Catering', text: 'The pizza order is 40 minutes out.' },
  { title: 'Slack', text: '37 new messages in #volunteers.' },
  { title: 'Battery', text: 'Your laptop is at 4%. Plug in soon.' },
  { title: 'Audio', text: 'Microphone feedback detected in Main Stage.' },
  { title: 'Parking', text: 'Your validation ticket has expired.' },
  { title: 'Security', text: 'Badges required beyond this checkpoint.' },
  { title: 'Storage', text: 'Google Drive is out of shared space.' },
  { title: 'Stage', text: 'Next speaker is missing from green room.' },
  { title: 'Zoom', text: 'You are muted. Everyone is waiting.' },
  { title: 'GitHub', text: 'Merge conflict detected in main branch.' },
  { title: 'Spotify', text: 'Ad playing. Upgrade to Premium to continue.' },
  { title: 'Auth', text: 'Session expired. Please log in again.' },
  { title: 'Docker', text: 'Container exited with code 137.' },
  { title: 'Bluetooth', text: 'Connected to headphones that are in another room.' },
  { title: 'Cloud', text: 'AWS billing threshold exceeded.' },
  { title: 'Password', text: 'Must contain a symbol, a dream, and a lowercase letter.' },
  { title: 'Photos', text: 'Your storage is full. Back up 4,000 screenshots?' },
  { title: 'Disk', text: 'Low disk space. Delete system files to free up room?' },
  { title: 'Stripe', text: 'Payment gateway declined transaction.' },
  { title: 'Vercel', text: 'Deployment failed. Check build logs.' },
  { title: 'Figma', text: 'Someone is currently editing this frame.' },
  { title: 'Notion', text: 'Changes cannot be saved while offline.' },
  { title: 'Coffee', text: 'Machine needs descaling immediately.' },
  { title: 'Elevator', text: 'Service temporarily unavailable.' },
  { title: 'Signage', text: 'Projector bulb life at 2%.' },
  { title: 'Trolley', text: 'AV cables are tangled behind the main podium.' },
  { title: 'Fire Alarm', text: 'Mandatory test scheduled in 5 minutes.' },
];

/** Formats milliseconds as seconds with one decimal, e.g. 12.3s. */
function seconds(ms) {
  return (ms / 1000).toFixed(1) + 's';
}

/** Popup task: close every window (clicking elsewhere opens two more); resolves when none are left. */
function runPopupTask(title, hint) {
  const body = openModal(title, hint);

  const screen = document.createElement('div');
  screen.className = 'popup-screen';

  const status = document.createElement('p');
  status.className = 'minigame-status';

  body.appendChild(screen);
  body.appendChild(status);

  return new Promise(function (resolve) {
    const started = performance.now();
    let open = 0;
    let made = 0;
    let done = false;

    function report() {
      const windows = open === 1 ? '1 window left' : open + ' windows left';
      status.textContent = windows + ' · ' + seconds(performance.now() - started);
    }

    // Stops both timers, whether the player won or closed the modal.
    function stop() {
      window.clearInterval(clock);
      window.clearInterval(spawner);
    }

    function spawn() {
      const entry = POPUP_WINDOWS[made % POPUP_WINDOWS.length];
      made += 1;
      open += 1;

      const popup = document.createElement('div');
      popup.className = 'popup-window';

      // Percent positions fit any screen; each window stacks above the last.
      popup.style.left = (4 + Math.random() * 42) + '%';
      popup.style.top = (4 + Math.random() * 46) + '%';
      popup.style.zIndex = String(made);

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
        if (done) {
          return;
        }

        popup.remove();
        open -= 1;

        if (open > 0) {
          report();

          return;
        }

        done = true;
        stop();
        status.textContent = 'Cleared in ' + seconds(performance.now() - started) + '. Well played.';

        window.setTimeout(resolve, 450);
      });
    }

    // Anything on the screen that is not a close button counts as a misclick.
    screen.addEventListener('pointerdown', function (event) {
      if (done || event.target.closest('.popup-close')) {
        return;
      }

      for (let i = 0; i < POPUP_MISCLICK_PENALTY; i += 1) {
        spawn();
      }

      report();
    });

    const clock = window.setInterval(function () {
      // The modal moved on to something else, so stop the timers.
      if (!screen.isConnected) {
        stop();

        return;
      }

      report();
    }, 100);

    const spawner = window.setInterval(function () {
      if (!screen.isConnected) {
        stop();

        return;
      }

      spawn();
      report();
    }, POPUP_SPAWN_MS);

    for (let i = 0; i < POPUP_COUNT; i += 1) {
      spawn();
    }

    report();
  });
}


// Endless Flappy run with a per-browser best score. Ported from ia-life; styles in styles.css.


// No target score: runs until the modal closes and keeps this browser's best.
const FLAPPY_BEST_KEY = 'flappy-best';
// One flap rises lift²/(2·gravity); keep that well under the gap or long runs are impossible.
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

/** Flappy task: fly the gaps until a pipe or the floor ends the run; never resolves. */
function runFlappyTask(title, hint) {
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

    // Backing store is scaled for the dispaly; coordinates below stay in CSS pixels.
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

    // Focus now, not in a frame callback, so keys work before the (possibly throttled) first frame.
    canvas.focus();

    loop = window.requestAnimationFrame(step);
  });
}


// Minigames borrowed from ia-life; titles and hints come from "games" in copy.json.
const GAMES = {
  reactor: runReactorTask,
  setroute: runSetRouteTask,
  popups: runPopupTask,
  flappy: runFlappyTask,
};

async function play(key) {
  const copy = await window.siteCopy;
  const text = (copy && copy.games[key]) || {};

  await showModal();
  await GAMES[key](text.title || '', text.hint || '');

  // The game will only finish on a win, and only if the modal is still open.
  if (!document.getElementById('game-modal').classList.contains('show')) {
    return;
  }

  const again = document.createElement('button');
  again.type = 'button';
  again.className = [
    'btn',
    'btn-hc',
    'mt-3',
    'd-block',
    'mx-auto',
  ].join(' ');
  again.innerHTML = '<i class="bi bi-arrow-repeat"></i> Play again';
  again.addEventListener('click', function () {
    play(key);
  });

  bodyEl.appendChild(again);
  again.focus();
}

document.querySelectorAll('[data-game]').forEach(function (button) {
  button.addEventListener('click', function () {
    play(button.dataset.game);
  });
});
