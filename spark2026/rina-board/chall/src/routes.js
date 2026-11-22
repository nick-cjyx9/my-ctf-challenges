import { Router } from "express";
import { flag } from "./config.js";
import { getSessionUser, requireLogin } from "./auth.js";
import { enqueueBot, getBotStatus } from "./bot.js";
import { issuePow, verifyPow } from "./pow.js";
import {
  decodeExpression,
  emptyExpression,
  encodeExpression,
  presetsExpressions,
} from "./expression.js";

export const siteRouter = Router();

siteRouter.get("/", requireLogin, (req, res) => {
  const cards = presetsExpressions.map((preset) => ({
    ...preset,
    data: encodeExpression(preset),
  }));
  res.render("index", { presets: cards, user: res.locals.user });
});

const csp = () =>
  [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'unsafe-inline' 'self'",
    "img-src http: https:",
    "font-src http: https:",
    "frame-ancestors *",
    "base-uri 'none'",
    "object-src 'none'",
  ].join("; ");

siteRouter.get("/preview", (req, res) => {
  try {
    const expression = decodeExpression(req.query.data);
    const previewColor = expression.color.replace(/[<>]/g, "");
    const isAdmin = getSessionUser(req.cookies.session) === "admin";
    res.set("Cache-Control", "no-store");
    res.set("Content-Security-Policy", csp());
    res.render("preview", { expression, previewColor, isAdmin, flag });
  } catch {
    res.status(400).send("Invalid expression");
  }
});

siteRouter.get("/editor", requireLogin, (req, res) => {
  try {
    const expression = req.query.data
      ? decodeExpression(req.query.data)
      : emptyExpression;
    res.render("editor", {
      initial: JSON.stringify(expression).replace(/</g, "\\u003c"),
    });
  } catch {
    res.status(400).send("Invalid expression");
  }
});

siteRouter.get("/report", requireLogin, (req, res) =>
  res.render("report", {
    message: null,
    pow: issuePow(),
    status: getBotStatus(res.locals.user),
  }),
);

siteRouter.post("/report", requireLogin, (req, res) => {
  const url = String(req.body.url || "").trim();
  const powId = String(req.body.powId || "");
  const nonce = String(req.body.nonce || "");
  const ownerId = res.locals.user;
  const status = getBotStatus(ownerId);

  if (status.hasTask)
    return res.status(429).render("report", {
      message: "你已经有一个正在运行或排队中的任务",
      pow: issuePow(),
      status,
    });

  try {
    const parsed = new URL(url);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      url.length > 2048 ||
      !verifyPow(powId, nonce, url)
    )
      throw new Error("invalid request");

    const result = enqueueBot(url, ownerId);
    if (!result.ok)
      return res.status(result.reason === "duplicate" ? 429 : 503).render("report", {
        message:
          result.reason === "duplicate"
            ? "你已经有一个正在运行或排队中的任务"
            : "队列已满，请稍后重试",
        pow: issuePow(),
        status: getBotStatus(ownerId),
      });

    res.render("report", {
      message: "已提交，A.L.A.N. 将按顺序访问此页面",
      pow: issuePow(),
      status: getBotStatus(ownerId),
    });
  } catch {
    res.status(400).render("report", {
      message: "请求无效或 PoW 错误，请重新计算后提交",
      pow: issuePow(),
      status: getBotStatus(ownerId),
    });
  }
});
