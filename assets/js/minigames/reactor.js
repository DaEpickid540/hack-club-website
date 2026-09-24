// Systems check: a pattern lights up on the left panel and the player mirrors
// it on the right. Ported from the ia-life game; styles are in minigames.css.

import { openModal } from './modal.js';

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
        }, PATTERN_STEP_MS * (order + 1));
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
