import { fetchSecretPlaylist } from "./api.js";

const $ = (id) => document.getElementById(id);

const TRACK = 262;

const mmss = (s) =>
  `${String((s / 60) | 0).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export function createPlayer() {
  const title = $("song-name");
  const artist = $("song-artist");
  const fill = $("progress-fill");
  const elapsedEl = $("time-elapsed");
  const totalEl = $("time-total");
  const playIcon = $("btn-play").querySelector("use");

  let elapsed = 0;
  let playing = true;

  const paint = () => {
    fill.style.width = `${(elapsed / TRACK) * 100}%`;
    elapsedEl.textContent = mmss(elapsed);
    playIcon.setAttribute("href", playing ? "#i-pause" : "#i-play");
  };

  $("btn-play").onclick = () => {
    playing = !playing;
    paint();
  };
  $("btn-prev").onclick = $("btn-next").onclick = () => {
    elapsed = 0;
    paint();
  };

  const modes = [...document.querySelectorAll(".mode")];
  modes.forEach((btn) => {
    btn.onclick = () =>
      modes.forEach((m) => m.classList.toggle("is-on", m === btn));
  });

  return {
    async start() {
      totalEl.textContent = mmss(TRACK);
      paint();
      try {
        const data = await fetchSecretPlaylist();
        title.textContent = data.current_song || "—";
        artist.textContent = data.artist || "Anonymous";
        setInterval(() => {
          if (!playing) return;
          elapsed = elapsed >= TRACK ? 0 : elapsed + 1;
          paint();
        }, 1000);
        return true;
      } catch {
        title.textContent = "🔒 隐私曲目";
        artist.textContent = "请扫描大屏的二维码认证后查看";
        totalEl.textContent = "--:--";
        return false;
      }
    },
  };
}
