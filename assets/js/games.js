import { runReactorTask, runSetRouteTask, runPopupTask, runFlappyTask } from './minigames.js';
import { showModal, bodyEl } from './game-modal.js';

// Titles and hints are adapted from the ones the tasks had in ia-life.
const GAMES = {
  reactor: {
    run: runReactorTask,
    title: 'Systems check',
    hint: 'The demo machine needs a reboot sequence. Repeat the pattern.',
  },
  setroute: {
    run: runSetRouteTask,
    title: 'Set your route',
    hint: 'Registration is open. Line the marker up with the target.',
  },
  popups: {
    run: runPopupTask,
    title: 'The morning of',
    hint: 'The laptop at the check-in desk has opinions. Clear the screen.',
  },
  flappy: {
    run: runFlappyTask,
    title: 'While you wait',
    hint: 'The badge queue is long and somebody left this open. Five gaps and it is yours.',
  },
};

async function play(key) {
  const game = GAMES[key];

  await showModal();
  await game.run(game.title, game.hint);

  // The task only resolves on a win, and only if the modal is still open.
  if (!document.getElementById('game-modal').classList.contains('show')) {
    return;
  }

  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn btn-hc mt-3 d-block mx-auto';
  again.innerHTML = '<i class="bi bi-arrow-repeat"></i> Play again';
  again.addEventListener('click', function () { play(key); });

  bodyEl.appendChild(again);
  again.focus();
}

document.querySelectorAll('[data-game]').forEach(function (button) {
  button.addEventListener('click', function () {
    play(button.dataset.game);
  });
});
