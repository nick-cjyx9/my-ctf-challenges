const express = require("express");
const cookieParser = require("cookie-parser");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();
const PORT = process.env.PORT || 8000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "absolutely_fake_token_for_test";
const FLAG = process.env.FLAG || "flag{fake_flag_for_local_test}";

// 提取 flag 内部的歌名作为播放列表内容
const CURRENT_SONG = FLAG.replace(/^flag\{/, "").replace(/\}$/, "");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "dist")));
app.use("/ktv", express.static(path.join(__dirname, "public/ktv")));

let danmuHistory = [
  {
    sender: "Alibaba",
    text: "test test <img src=0 onerror=alert(1337)>",
    time: "19:42",
  },
  { sender: "Kasumi", text: "双叶你在干嘛呀，看起来很好玩？", time: "19:43" },
  { sender: "Nick", text: "Choose life?!", time: "19:44" },
];

// 私密点播列表接口 (需要 KTV 点歌机的 Cookie)
app.get("/api/room/secret-playlist", (req, res) => {
  const token = req.cookies.session_token;
  if (token !== ADMIN_TOKEN) {
    return res
      .status(403)
      .json({ error: "Forbidden: VIP tablet authorization required" });
  }
  res.json({ current_song: CURRENT_SONG, room: "501-VIP" });
});

// 弹幕列表
app.get("/api/danmu/list", (_req, res) => {
  res.json({ danmu: danmuHistory });
});

// 发送弹幕
app.post("/api/danmu/send", (req, res) => {
  const { sender, text } = req.body || {};
  if (text) {
    danmuHistory.push({
      sender: sender ? String(sender).slice(0, 20) : "Anonymous",
      text: String(text).slice(0, 100),
      time: "刚刚",
    });
    if (danmuHistory.length > 30) danmuHistory.shift();
  }
  res.json({ ok: true });
});

app.get("/report", (_req, res) => {
  res.sendFile(path.join(__dirname, "public/report.html"));
});

let isVisiting = false;

app.post("/report", async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return res
      .status(400)
      .send(
        '<script>alert("请输入合法的 HTTP(S) 链接！");history.back();</script>',
      );
  }

  if (isVisiting) {
    return res.send(
      '<script>alert("芳泽小妹正在满心欢喜地看上一封巴菲兑换券呢，请稍等几秒后再试~");history.back();</script>',
    );
  }

  isVisiting = true;
  visitUrl(url).finally(() => {
    isVisiting = false;
  });

  res.send(
    '<script>alert("钓鱼邮件已成功送达！");location.href="/ktv/";</script>',
  );
});

// Bot 访问逻辑
async function visitUrl(urlToVisit) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    await browser.setCookie({
      name: "session_token",
      value: ADMIN_TOKEN,
      domain: "127.0.0.1",
      path: "/",
    });

    const page = await browser.newPage();

    console.log(`收到草莓巴菲邮件，正在点击: ${urlToVisit}`);
    await page.goto(urlToVisit, { waitUntil: "networkidle2", timeout: 8000 });
    await new Promise((r) => setTimeout(r, 3000));
    console.log(`访问完成！`);
  } catch (err) {
    console.error(`[Error] 访问失败: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Server is up at: http://0.0.0.0:${PORT}`);
});
