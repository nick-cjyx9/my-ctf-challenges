import { createPlayer } from "./player.js";
import { createSongbook } from "./songbook.js";
import { createBulletin } from "./danmu.js";

const $ = (id) => document.getElementById(id);

function mergeParams(target, params) {
  for (const [key, value] of Object.entries(params)) {
    const parts = key.split("[").map((k) => k.replace("]", ""));
    let current = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!current[p]) current[p] = {};
      current = current[p];
    }
    current[parts[parts.length - 1]] = value;
  }
  return target;
}

const roomConfig = mergeParams(
  {},
  Object.fromEntries(new URLSearchParams(location.search)),
);

$("room-chip").firstElementChild.textContent =
  roomConfig.room || "SHIBUYA 501 VIP";

const displayConfig = window.displayConfig || {};

if (displayConfig.customHtml)
  $("status-bar").innerHTML = displayConfig.customHtml;

const clock = () => {
  const now = new Date();
  $("clock").textContent =
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};
clock();
setInterval(clock, 10000);

const songbook = createSongbook();
createBulletin().start();

createPlayer()
  .start()
  .then((authorized) => {
    document.body.classList.toggle("is-guest", !authorized);
    songbook.setUnlocked(authorized);
    $("danmu-form").hidden = !authorized;
    $("danmu-locked").hidden = authorized;
    document
      .querySelectorAll(".tbtn, .mode")
      .forEach((button) => (button.disabled = !authorized));
  });
