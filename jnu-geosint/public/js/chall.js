import { Viewer } from "@photo-sphere-viewer/core";
import { EquirectangularTilesAdapter } from "@photo-sphere-viewer/equirectangular-tiles-adapter";

const title = document.getElementById("chall-title");
const result = document.getElementById("chall-result");
const submitButton = document.getElementById("submit");
const coordinateEntry = document.getElementById("coordinate-entry");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const mapPanel = document.getElementById("map-panel");
const mapToggle = document.getElementById("map-toggle");

const BAIDU_MAP_AK = "FWboMLDElbRty177Aq6CvrAHHkTImfiR";
const EARTH_SEMI_MAJOR_AXIS = 6378245;
const ECCENTRICITY_SQUARED = 0.006693421622965943;
const X_PI = (Math.PI * 3000) / 180;

let map;
let marker;
let guess;

function showResult(message, state = "") {
  result.textContent = message;
  if (state) result.dataset.state = state;
  else delete result.dataset.state;
}

function setMapCollapsed(collapsed, persist = true) {
  mapPanel.classList.toggle("is-collapsed", collapsed);
  mapToggle.setAttribute("aria-expanded", String(!collapsed));
  mapToggle.setAttribute(
    "aria-label",
    collapsed ? "Show challenge controls" : "Hide challenge controls",
  );
  mapToggle.title = collapsed
    ? "Show challenge controls"
    : "Hide challenge controls";
  if (persist) localStorage.setItem("geosint-map-collapsed", String(collapsed));

  if (!collapsed) {
    requestAnimationFrame(() => map?.checkResize?.());
  }
}

mapToggle.addEventListener("click", () => {
  setMapCollapsed(!mapPanel.classList.contains("is-collapsed"));
});

setMapCollapsed(
  localStorage.getItem("geosint-map-collapsed") === "true",
  false,
);

function isOutsideChina(latitude, longitude) {
  return (
    longitude < 72.004 ||
    longitude > 137.8347 ||
    latitude < 0.8293 ||
    latitude > 55.8271
  );
}

function transformLatitude(longitude, latitude) {
  let value =
    -100 +
    2 * longitude +
    3 * latitude +
    0.2 * latitude ** 2 +
    0.1 * longitude * latitude +
    0.2 * Math.sqrt(Math.abs(longitude));
  value +=
    ((20 * Math.sin(6 * longitude * Math.PI) +
      20 * Math.sin(2 * longitude * Math.PI)) *
      2) /
    3;
  value +=
    ((20 * Math.sin(latitude * Math.PI) +
      40 * Math.sin((latitude / 3) * Math.PI)) *
      2) /
    3;
  value +=
    ((160 * Math.sin((latitude / 12) * Math.PI) +
      320 * Math.sin((latitude * Math.PI) / 30)) *
      2) /
    3;
  return value;
}

function transformLongitude(longitude, latitude) {
  let value =
    300 +
    longitude +
    2 * latitude +
    0.1 * longitude ** 2 +
    0.1 * longitude * latitude +
    0.1 * Math.sqrt(Math.abs(longitude));
  value +=
    ((20 * Math.sin(6 * longitude * Math.PI) +
      20 * Math.sin(2 * longitude * Math.PI)) *
      2) /
    3;
  value +=
    ((20 * Math.sin(longitude * Math.PI) +
      40 * Math.sin((longitude / 3) * Math.PI)) *
      2) /
    3;
  value +=
    ((150 * Math.sin((longitude / 12) * Math.PI) +
      300 * Math.sin((longitude / 30) * Math.PI)) *
      2) /
    3;
  return value;
}

function wgs84ToGcj02(latitude, longitude) {
  if (isOutsideChina(latitude, longitude)) return [latitude, longitude];

  let latitudeDelta = transformLatitude(longitude - 105, latitude - 35);
  let longitudeDelta = transformLongitude(longitude - 105, latitude - 35);
  const latitudeRadians = (latitude / 180) * Math.PI;
  let magic = Math.sin(latitudeRadians);
  magic = 1 - ECCENTRICITY_SQUARED * magic ** 2;
  const squareRootMagic = Math.sqrt(magic);
  latitudeDelta =
    (latitudeDelta * 180) /
    (((EARTH_SEMI_MAJOR_AXIS * (1 - ECCENTRICITY_SQUARED)) /
      (magic * squareRootMagic)) *
      Math.PI);
  longitudeDelta =
    (longitudeDelta * 180) /
    ((EARTH_SEMI_MAJOR_AXIS / squareRootMagic) *
      Math.cos(latitudeRadians) *
      Math.PI);
  return [latitude + latitudeDelta, longitude + longitudeDelta];
}

function gcj02ToWgs84(latitude, longitude) {
  if (isOutsideChina(latitude, longitude)) return [latitude, longitude];

  let wgsLatitude = latitude;
  let wgsLongitude = longitude;
  for (let iteration = 0; iteration < 6; iteration++) {
    const [testLatitude, testLongitude] = wgs84ToGcj02(
      wgsLatitude,
      wgsLongitude,
    );
    wgsLatitude -= testLatitude - latitude;
    wgsLongitude -= testLongitude - longitude;
  }
  return [wgsLatitude, wgsLongitude];
}

function gcj02ToBd09(latitude, longitude) {
  const z =
    Math.sqrt(longitude ** 2 + latitude ** 2) +
    0.00002 * Math.sin(latitude * X_PI);
  const theta =
    Math.atan2(latitude, longitude) + 0.000003 * Math.cos(longitude * X_PI);
  return [z * Math.sin(theta) + 0.006, z * Math.cos(theta) + 0.0065];
}

function bd09ToGcj02(latitude, longitude) {
  const x = longitude - 0.0065;
  const y = latitude - 0.006;
  const z = Math.sqrt(x ** 2 + y ** 2) - 0.00002 * Math.sin(y * X_PI);
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI);
  return [z * Math.sin(theta), z * Math.cos(theta)];
}

function setGuess(latitude, longitude, baiduPosition) {
  if (map && baiduPosition) {
    if (marker) map.removeOverlay(marker);
    const point = new BMapGL.Point(baiduPosition[1], baiduPosition[0]);
    marker = new BMapGL.Marker(point);
    map.addOverlay(marker);
  }

  guess = [latitude, longitude];
  latitudeInput.value = latitude.toFixed(6);
  longitudeInput.value = longitude.toFixed(6);
  submitButton.disabled = false;
  submitButton.textContent = "Submit location";
  if (result.dataset.state) {
    showResult("Location updated. Submit to check.");
  }
}

function loadBaiduMap() {
  if (window.BMapGL) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const callbackName = `__baiduMapReady_${Date.now()}`;
    const script = document.createElement("script");
    let timeout;

    const cleanup = () => {
      clearTimeout(timeout);
      delete window[callbackName];
    };

    window[callbackName] = () => {
      cleanup();
      resolve();
    };
    script.async = true;
    script.src = `https://api.map.baidu.com/api?v=1.0&type=webgl&ak=${encodeURIComponent(BAIDU_MAP_AK)}&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Baidu Map could not be loaded"));
    };
    timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Baidu Map timed out"));
    }, 12_000);
    document.head.append(script);
  });
}

async function initializeMap() {
  try {
    await loadBaiduMap();
    map = new BMapGL.Map("map");
    map.centerAndZoom(new BMapGL.Point(104, 35), 4);
    map.enableScrollWheelZoom(true);
    map.addControl(new BMapGL.ZoomControl());
    map.addEventListener("click", (event) => {
      const [gcjLatitude, gcjLongitude] = bd09ToGcj02(
        event.latlng.lat,
        event.latlng.lng,
      );
      const [latitude, longitude] = gcj02ToWgs84(gcjLatitude, gcjLongitude);
      setGuess(latitude, longitude, [event.latlng.lat, event.latlng.lng]);
    });

    const mapBox = document.getElementById("map-box");
    new ResizeObserver(() => map.checkResize?.()).observe(mapBox);
  } catch {
    showResult("Basemap unavailable. Enter latitude and longitude below.");
  }
}

coordinateEntry.addEventListener("submit", (event) => {
  event.preventDefault();
  const latitude = Number(latitudeInput.value);
  const longitude = Number(longitudeInput.value);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    showResult("Enter a valid latitude and longitude.", "incorrect");
    return;
  }

  const gcjPosition = wgs84ToGcj02(latitude, longitude);
  const baiduPosition = gcj02ToBd09(...gcjPosition);
  setGuess(latitude, longitude, baiduPosition);
  if (map) {
    const point = new BMapGL.Point(baiduPosition[1], baiduPosition[0]);
    map.centerAndZoom(point, Math.max(map.getZoom(), 15));
  }
});

submitButton.addEventListener("click", async () => {
  if (!guess) return;
  submitButton.disabled = true;
  submitButton.textContent = "Checking…";
  try {
    const response = await fetch(`/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(guess),
    });
    const payload = await response.json();
    showResult(
      payload.message || "Invalid server response.",
      payload.correct ? "correct" : "incorrect",
    );
  } catch {
    showResult("Could not check that location. Try again.", "incorrect");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit location";
  }
});

async function initializeChallenge() {
  const response = await fetch(`/config`);
  if (!response.ok) throw new Error("challenge not found");
  const challenge = await response.json();

  document.title = `${challenge.title} | Geosint`;
  title.textContent = challenge.title;

  const tileSize = 512;
  const asset = encodeURIComponent(challenge.asset || slug);
  new Viewer({
    container: document.getElementById("pano"),
    adapter: EquirectangularTilesAdapter.withConfig({ baseBlur: false }),
    panorama: {
      baseUrl: `/img/${asset}/preview.jpg`,
      width: tileSize * challenge.width,
      cols: challenge.width,
      rows: challenge.height,
      tileUrl: (col, row) =>
        `/img/${asset}/tile_${col}_${row}_${challenge.maxZ}.jpg`,
    },
    defaultYaw: `${challenge.heading}deg`,
    defaultPitch: `${challenge.pitch || 0}deg`,
    mousewheelCtrlKey: false,
    navbar: ["zoom", "fullscreen"],
  });
}

initializeMap();
initializeChallenge().catch((error) => {
  title.textContent = "Challenge unavailable";
  showResult(error.message, "incorrect");
  submitButton.disabled = true;
});
