import { Hono } from "hono/tiny";

const defaultFlag = "JNSEC{w31c0me_2_JNU_h499y_h4ck1ng_1337}";

const answerBounds = {
  minLatitude: 31.481193,
  maxLatitude: 31.482268,
  minLongitude: 120.265958,
  maxLongitude: 120.268021,
};

const config = {
  title: "JNU HACKING CHALL",
  asset: "jiangnan-university",
  maxZ: 4,
  width: 8,
  height: 4,
  heading: -123.92,
  pitch: -20,
};

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

app.get("/config", (c) => {
  c.header("Cache-Control", "no-store");
  return c.json(config);
});

app.post("/submit", async (c) => {
  let guess;
  try {
    guess = await c.req.json();
  } catch {
    return c.json({ correct: false, message: "invalid location" }, 400);
  }

  const validGuess =
    Array.isArray(guess) &&
    guess.length === 2 &&
    guess.every((coordinate) => Number.isFinite(coordinate));

  if (!validGuess) {
    return c.json({ correct: false, message: "invalid location" }, 400);
  }

  const [latitude, longitude] = guess;
  const correct =
    latitude >= answerBounds.minLatitude &&
    latitude <= answerBounds.maxLatitude &&
    longitude >= answerBounds.minLongitude &&
    longitude <= answerBounds.maxLongitude;

  return c.json({
    correct,
    message: correct ? c.env.FLAG || defaultFlag : "not here",
  });
});

app.notFound((c) => c.text("not found", 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ correct: false, message: "internal server error" }, 500);
});

export default app;
