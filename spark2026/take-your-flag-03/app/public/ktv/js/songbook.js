const $ = (id) => document.getElementById(id);

const HOT = [
  { title: "Last Surprise", artist: "Lyn", dur: "03:55" },
  { title: "EXCITE", artist: "三浦大知", dur: "03:06" },
  { title: "夏霞", artist: "あたらよ", dur: "03:48" },
  { title: "Never Meant", artist: "American Football", dur: "04:28" },
  { title: "10年", artist: "奥華子", dur: "05:51" },
];

export function createSongbook() {
  const list = $("song-list");
  const count = $("queue-count");
  const tabs = [...document.querySelectorAll(".tab")];

  let queue = HOT.slice(0, 2).map((song) => ({ ...song }));
  let view = "hot";
  let unlocked = false;

  const span = (cls, text) => {
    const el = document.createElement("span");
    el.className = cls;
    el.textContent = text;
    return el;
  };

  function row(song, index) {
    const li = document.createElement("li");
    li.className = "song-row";

    const act = document.createElement("button");
    act.className = "song-act";
    act.type = "button";

    if (!unlocked) {
      act.disabled = true;
      act.style.opacity = "0.3";
      act.style.cursor = "not-allowed";
      act.textContent = "+";
    } else if (view === "queue") {
      act.textContent = "×";
      act.title = "取消已点";
      act.onclick = () => {
        queue.splice(index, 1);
        render();
      };
    } else {
      act.textContent = "+";
      act.title = "加入已点";
      act.onclick = () => {
        queue.push({ ...song });
        render();
      };
    }

    li.append(
      span("song-no", String(index + 1).padStart(2, "0")),
      span("song-title", song.title),
      span("song-artist", song.artist),
      span("song-dur", song.dur),
      act,
    );
    return li;
  }

  function render() {
    tabs.forEach((tab) => {
      if (tab.dataset.view === "queue") {
        tab.disabled = !unlocked;
      }
      tab.classList.toggle("is-on", tab.dataset.view === view);
    });

    if (!unlocked && view === "queue") {
      count.textContent = "—";
      list.replaceChildren(span("empty", "请扫描大屏的二维码认证后点歌"));
      return;
    }

    const songs = view === "queue" ? queue : HOT;
    count.textContent = unlocked ? `${queue.length} 首` : "—";
    list.replaceChildren(
      ...(songs.length ? songs.map(row) : [span("empty", "暂无已点歌曲")]),
    );
  }

  tabs.forEach((tab) => {
    tab.onclick = () => {
      if (!unlocked && tab.dataset.view === "queue") return;
      view = tab.dataset.view;
      render();
    };
  });

  render();

  return {
    setUnlocked(value) {
      unlocked = value;
      if (unlocked) view = "queue";
      render();
    },
  };
}
