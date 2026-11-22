const form = document.querySelector("#report-form");
const urlInput = form.querySelector('input[name="url"]');
const powIdInput = form.querySelector('input[name="powId"]');
const nonceInput = form.querySelector('input[name="nonce"]');
const status = document.querySelector("#pow-status");
const submit = form.querySelector("button[type=submit]");
const challenge = window.POW;
let solving = false;

// Keep the PoW usable on plain HTTP deployments too. Web Crypto is not
// available outside a secure context, while this small implementation is.
const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];
const initialHash = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
  0x1f83d9ab, 0x5be0cd19,
];

function rotateRight(value, amount) {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Fallback(value) {
  const input = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  new DataView(padded.buffer).setUint32(paddedLength - 4, input.length * 8);

  const hash = initialHash.slice();
  const words = new Int32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    const view = new DataView(padded.buffer, offset, 64);
    for (let i = 0; i < 16; i++) words[i] = view.getInt32(i * 4);
    for (let i = 16; i < 64; i++) {
      const a = words[i - 15];
      const b = words[i - 2];
      const s0 = rotateRight(a, 7) ^ rotateRight(a, 18) ^ (a >>> 3);
      const s1 = rotateRight(b, 17) ^ rotateRight(b, 19) ^ (b >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) | 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i++) {
      const sum1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + sum1 + choice + K[i] + words[i]) | 0;
      const sum0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) | 0;
      [h, g, f, e, d, c, b, a] = [
        g,
        f,
        e,
        (d + temp1) | 0,
        c,
        b,
        a,
        (temp1 + temp2) | 0,
      ];
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }
  return hash
    .map((part) => (part >>> 0).toString(16).padStart(8, "0"))
    .join("");
}

async function hashCandidate(value) {
  if (!globalThis.crypto?.subtle) return sha256Fallback(value);
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 0));

async function solve(url) {
  if (!url || !challenge) return null;
  const prefix = "0".repeat(challenge.difficulty);
  const batchSize = 256;
  for (let nonce = 0; nonce <= 0xffffffff; nonce += batchSize) {
    const candidates = Array.from(
      { length: Math.min(batchSize, 0x100000000 - nonce) },
      (_, offset) => (nonce + offset).toString(16),
    );
    const hashes = await Promise.all(
      candidates.map((candidate) =>
        hashCandidate(`${challenge.challenge}:${url}:${candidate}`),
      ),
    );
    const match = hashes.findIndex((hash) => hash.startsWith(prefix));
    if (match !== -1) return candidates[match];
    await nextFrame();
  }
  return null;
}

urlInput.addEventListener("input", () => {
  powIdInput.value = "";
  nonceInput.value = "";
  status.textContent = "点击提交后，浏览器将计算工作量证明";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (solving) return;

  const url = urlInput.value.trim();
  solving = true;
  urlInput.readOnly = true;
  submit.disabled = true;
  status.textContent = "正在计算浏览器工作量证明…";

  const nonce = await solve(url);
  if (!nonce) {
    solving = false;
    urlInput.readOnly = false;
    submit.disabled = false;
    status.textContent = "计算失败，请刷新页面重试";
    return;
  }

  powIdInput.value = challenge.id;
  nonceInput.value = nonce;
  status.textContent = "计算完成，正在提交…";
  HTMLFormElement.prototype.submit.call(form);
});
