import crypto from "node:crypto";

const challengeTtl = 10 * 60 * 1000;
const maxChallenges = 256;
const challenges = new Map();

export const powDifficulty = Math.max(
  3,
  Math.min(6, Number.parseInt(process.env.POW_DIFFICULTY || "4", 10) || 4),
);

function cleanup() {
  const expiresBefore = Date.now() - challengeTtl;
  for (const [id, challenge] of challenges) {
    if (challenge.createdAt < expiresBefore) challenges.delete(id);
  }
  while (challenges.size > maxChallenges)
    challenges.delete(challenges.keys().next().value);
}

export function issuePow() {
  cleanup();
  const id = crypto.randomBytes(18).toString("base64url");
  const challenge = crypto.randomBytes(24).toString("hex");
  challenges.set(id, { challenge, createdAt: Date.now() });
  return { id, challenge, difficulty: powDifficulty, expiresIn: challengeTtl };
}

export function verifyPow(id, nonce, url) {
  cleanup();
  if (
    typeof id !== "string" ||
    typeof nonce !== "string" ||
    !/^[0-9a-f]{1,32}$/i.test(nonce)
  )
    return false;

  const entry = challenges.get(id);
  challenges.delete(id);
  if (!entry || Date.now() - entry.createdAt > challengeTtl) return false;

  const digest = crypto
    .createHash("sha256")
    .update(`${entry.challenge}:${url}:${nonce}`)
    .digest("hex");
  return digest.startsWith("0".repeat(powDifficulty));
}
