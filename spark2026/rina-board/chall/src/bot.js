import puppeteer from "puppeteer";
import { adminPassword, baseUrl, botTimeout } from "./config.js";

const maxWorkers = 2;
const maxQueue = 24;
const queue = [];
const jobsByOwner = new Map();
let active = 0;

const sleep = async (msec) =>
  new Promise((resolve) => setTimeout(resolve, msec));

export const getBotStatus = (ownerId) => ({
  active,
  queued: queue.length,
  capacity: maxQueue,
  hasTask: typeof ownerId === "string" && jobsByOwner.has(ownerId),
});

export function enqueueBot(url, ownerId) {
  if (jobsByOwner.has(ownerId)) return { ok: false, reason: "duplicate" };
  if (queue.length >= maxQueue) return { ok: false, reason: "full" };

  const job = { url, ownerId };
  jobsByOwner.set(ownerId, job);
  queue.push(job);
  drain();
  return { ok: true };
}

async function drain() {
  while (active < maxWorkers && queue.length > 0) {
    const job = queue.shift();
    active += 1;
    void visit(job.url)
      .catch(() => {})
      .finally(() => {
        active -= 1;
        jobsByOwner.delete(job.ownerId);
        drain();
      });
  }
}

async function visit(url) {
  console.log(`Visiting ${url}`);
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        "/usr/bin/google-chrome-stable",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(new URL("/login", baseUrl).href, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await page.locator('input[name="username"]').fill("admin");
    await page.locator('input[name="password"]').fill(adminPassword);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 10000 }),
      page.locator("form button").click(),
    ]);
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });
    await sleep(botTimeout);
  } catch (err) {
    console.error(`Error visiting ${url}:`, err);
  } finally {
    await browser?.close().catch(() => {});
  }
}
