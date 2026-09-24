//imports

import { runReactorTask, 
  runSetRouteTask, 
  runPopupTask, 
  runFlappyTask 
} from './minigames/index.js';


import { 
  showModal, 
  bodyEl 
} from './minigames/modal.js';

// Borrowed minigames from ia-life
const GAMES = {
  reactor: {
    run: runReactorTask,
    title: 'Systems check',
    hint: 'The demo machine needs a reboot sequence. Repeat the pattern.',
  },
  setroute: {
    run: runSetRouteTask,
    title: 'Set your route',
    hint: 'Registration is open. Line the marker up with the target, five times over.',
  },
  popups: {
    run: runPopupTask,
    title: 'The morning of',
    hint: 'The check-in laptop has opinions. Clear the screen before it buries you.',
  },
  flappy: {
    run: runFlappyTask,
    title: 'While you wait',
    hint: 'The badge queue is long and somebody left this open. See how far you get.',
  },
};

async function play(key) {
  const game = GAMES[key];

  await showModal();
  await game.run(game.title, game.hint);

  // The game will only finish on a win, and only if the modal is still open.
  if (!document.getElementById('game-modal').classList.contains('show')) {
    return;
  }

  const again = document.createElement('button');
  again.type = 'button';
  again.className = 'btn btn-hc mt-3 d-block mx-auto';
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
