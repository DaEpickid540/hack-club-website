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
// Titles and hints come from "games" in assets/data/copy.json.
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
