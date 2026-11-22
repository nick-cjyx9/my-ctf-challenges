const state = structuredClone(window.INITIAL_EXPRESSION);
const grid = document.querySelector("#pixel-grid");
const nameInput = document.querySelector("#name");
const colorInput = document.querySelector("#color");
const colorPicker = document.querySelector("#color-picker");

let drawing = false;
let paintValue = "1";

nameInput.value = state.name;
colorInput.value = state.color;
if (/^#[0-9a-f]{6}$/i.test(state.color)) colorPicker.value = state.color;

function render() {
  grid.replaceChildren();
  grid.style.setProperty(
    "--pixel-color",
    /^#[0-9a-f]{6}$/i.test(state.color) ? state.color : "#e47bb7",
  );
  for (let i = 0; i < 418; i++) {
    const pixel = document.createElement("button");
    pixel.className = `pixel${state.pixels[i] === "1" ? " active" : ""}`;
    pixel.dataset.index = i;
    grid.append(pixel);
  }
}

function setPixel(index, value) {
  state.pixels =
    state.pixels.slice(0, index) + value + state.pixels.slice(index + 1);
  grid.children[index].classList.toggle("active", value === "1");
}

grid.addEventListener("pointerdown", (event) => {
  const pixel = event.target.closest(".pixel");
  if (!pixel) return;
  event.preventDefault();
  drawing = true;
  paintValue =
    event.button === 2 || state.pixels[pixel.dataset.index] === "1" ? "0" : "1";
  setPixel(Number(pixel.dataset.index), paintValue);
});

grid.addEventListener("pointerover", (event) => {
  if (!drawing) return;
  const pixel = event.target.closest(".pixel");
  if (pixel) setPixel(Number(pixel.dataset.index), paintValue);
});

grid.addEventListener("contextmenu", (event) => event.preventDefault());

window.addEventListener("pointerup", () => {
  drawing = false;
});

nameInput.addEventListener("input", () => {
  state.name = nameInput.value;
});
colorInput.addEventListener("input", () => {
  state.color = colorInput.value;
  render();
});
colorPicker.addEventListener("input", () => {
  state.color = colorPicker.value;
  colorInput.value = state.color;
  render();
});
document.querySelector("#clear").addEventListener("click", () => {
  state.pixels = "0".repeat(418);
  render();
});
document.querySelector("#invert").addEventListener("click", () => {
  state.pixels = [...state.pixels].map((x) => (x === "1" ? "0" : "1")).join("");
  render();
});

function encode(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

document.querySelector("#share").addEventListener("click", () => {
  state.name = nameInput.value;
  state.color = colorInput.value;
  const url = `${location.origin}/preview?data=${encodeURIComponent(encode(state))}`;
  document.querySelector("#share-url").value = url;
  document.querySelector("#share-box").hidden = false;
});
document.querySelector("#copy").addEventListener("click", async () => {
  await navigator.clipboard.writeText(
    document.querySelector("#share-url").value,
  );
});

render();
