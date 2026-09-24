// Set your route: drag the marker onto the ring, over several rounds. Ported
// from the ia-life game; styles are in minigames.css.

import { openModal } from './modal.js';

const ROUTE_ROUNDS = 5;

/** Picks a goal at least 35% of the screen away from where the marker is. */
function routeGoal(from) {
  let goal;

  do {
    goal = { x: 12 + Math.random() * 76, y: 15 + Math.random() * 70 };
  } while (Math.hypot(goal.x - from.x, goal.y - from.y) < 35);

  return goal;
}

/**
 * Set route task: drag the marker onto the target, over several rounds. Each
 * round moves the target somewhere new and the marker starts where it stopped.
 *
 * @param {string} title - modal heading
 * @param {string} hint - line under the heading
 * @returns {Promise<void>} resolves once every round is done
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

        // A short beat on the ring, then the next target appears.
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
