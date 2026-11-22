import crypto from "node:crypto";

export const baseUrl = "http://localhost:3000";
export const adminPassword =
  process.env.PASSWORD || crypto.randomBytes(24).toString("base64url");
export const flag = process.env.FLAG || "flag{fake_flag_for_local_test}";
export const botTimeout = 3 * 60 * 1000;
