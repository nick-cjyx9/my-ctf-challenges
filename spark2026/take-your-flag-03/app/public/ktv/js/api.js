async function toJson(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const fetchSecretPlaylist = () =>
  fetch("/api/room/secret-playlist").then(toJson);

export const fetchDanmu = () => fetch("/api/danmu/list").then(toJson);

export const sendDanmu = (payload) =>
  fetch("/api/danmu/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then(toJson);
