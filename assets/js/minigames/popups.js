// The morning of: close every pop-up against the clock while new ones keep
// opening. Ported from the ia-life game; styles are in minigames.css.

import { openModal } from './modal.js';

const POPUP_COUNT = 6;
// A new window every few seconds, and a misclick opens this many more.
const POPUP_SPAWN_MS = 4000;
const POPUP_MISCLICK_PENALTY = 2;

// What the fake windows say. The joke is that none of them are the thing the
// player was trying to do.
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

/**
 * Popup task: a screen full of windows that are not what the player wanted.
 * Close all of them against the clock. A new window opens every few seconds,
 * and clicking anything but a close button opens two more.
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

      // Percentages, so the scatter works at any screen size. Each window sits
      // above the one before it, which is what makes the pile feel like a pile.
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
