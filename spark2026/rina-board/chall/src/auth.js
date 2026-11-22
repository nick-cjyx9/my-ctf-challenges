import crypto from "node:crypto";
import { Router } from "express";
import { adminPassword } from "./config.js";

const users = {
  guest: "guest",
  admin: adminPassword,
};
const sessions = new Map();
export const authRouter = Router();

export function getSessionUser(sessionId) {
  return sessions.get(sessionId);
}

export function requireLogin(req, res, next) {
  const user = getSessionUser(req.cookies.session);
  if (!user) return res.redirect("/login");
  res.locals.user = user;
  next();
}

authRouter.get("/login", (req, res) => res.render("login", { error: null }));
authRouter.post("/login", (req, res) => {
  const username = String(req.body.username || "")
    .trim()
    .slice(0, 32);
  const password = String(req.body.password || "").slice(0, 64);
  if (!users.hasOwnProperty(username) || users[username] !== password)
    return res.status(403).render("login", { error: "用户名或密码错误" });
  const session = crypto.randomBytes(24).toString("base64url");
  sessions.set(session, username);
  res.cookie("session", session, { httpOnly: true, sameSite: "lax" });
  res.redirect("/");
});

authRouter.post("/logout", (req, res) => {
  sessions.delete(req.cookies.session);
  res.clearCookie("session");
  res.redirect("/login");
});
