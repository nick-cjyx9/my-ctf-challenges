import { fetchDanmu, sendDanmu } from "./api.js";

const $ = (id) => document.getElementById(id);

export function createBulletin() {
  const list = $("danmu-screen");
  const input = $("danmu-input");
  let previous = "";

  function render(items) {
    const current = JSON.stringify(items);
    if (current === previous) return;
    previous = current;

    list.replaceChildren(
      ...items.map(({ sender, text, time }) => {
        const item = document.createElement("div");
        item.className = "bulletin-item";
        item.textContent = `[${sender}] ${text} ${time}`;
        return item;
      }),
    );
  }

  async function refresh() {
    try {
      const { danmu = [] } = await fetchDanmu();
      render(danmu);
    } catch {}
  }

  $("danmu-form").onsubmit = async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    await sendDanmu({ sender: "Anonymous", text }).catch(() => {});
    refresh();
  };

  return {
    start() {
      refresh();
      setInterval(refresh, 3000);
    },
  };
}
