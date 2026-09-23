// Stands in for ia-life's modal.js: the minigames call openModal(title, hint)
// and render into the body it returns. Here that body lives in a Bootstrap modal.

const dialog = document.getElementById('game-modal');
const titleEl = dialog.querySelector('[data-game-title]');
const hintEl = dialog.querySelector('[data-game-hint]');
const bodyEl = dialog.querySelector('[data-game-body]');

export const modal = bootstrap.Modal.getOrCreateInstance(dialog);

/**
 * Sets the heading and hint, clears the body, and returns it to render into.
 *
 * @param {string} title - heading text
 * @param {string} hint - one line under the heading, or an empty string
 * @returns {HTMLElement} the body element
 */
export function openModal(title, hint) {
  titleEl.textContent = title;
  hintEl.textContent = hint || '';
  hintEl.hidden = !hint;
  bodyEl.replaceChildren();

  return bodyEl;
}

/** Resolves once the modal has finished opening, so canvases measure correctly. */
export function showModal() {
  return new Promise(function (resolve) {
    if (dialog.classList.contains('show')) {
      resolve();

      return;
    }

    dialog.addEventListener('shown.bs.modal', function () { resolve(); }, { once: true });
    modal.show();
  });
}

// Emptying the body on close disconnects the flappy canvas, which stops its loop.
dialog.addEventListener('hidden.bs.modal', function () {
  bodyEl.replaceChildren();
});

export { bodyEl };
