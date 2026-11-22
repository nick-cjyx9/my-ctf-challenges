<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import AlibabaAvatar from "./components/AlibabaAvatar.vue";
import MessageBubble from "./components/MessageBubble.vue";
import PartyIcon from "./components/PartyIcon.vue";

type Season = "none" | "spring" | "winter";
type PlayMode = "story" | "fast";

interface ChatMessage {
  sender: "alibaba" | "me";
  text: string;
  unlock: number;
  action?: "medjed";
}
interface Particle {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
}

const fullMessages: ChatMessage[] = [
  {
    sender: "alibaba",
    text: "系统连接确认……你就是传说中在涉谷大闹特闹的怪盗团团长，JOKER 吧？",
    unlock: 0,
  },
  {
    sender: "me",
    text: "（扶了扶面具）正是在下。",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "哼哼，代号『阿里巴巴（Alibaba）』。听好了，想让我担任你们的领航员（Navi），可没那么容易！先通过我设下的『认知潜入四重试炼』再说！",
    unlock: 0,
  },
  {
    sender: "me",
    text: "随时奉陪，Show me what you got.",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "听好了，现在是第一关，本关考验你暗号交接功夫。向 /api/challenge/handshake 发送 POST 握手请求，并在 Payload 里写明你的怪盗代号 codename=JOKER。要是连报上名号都不会，趁早回卢布朗洗盘子吧！",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "不会发自定义请求？去装个浏览器插件 HackBar、或者用 Apifox/Postman/Python requests，随便挑你顺手的武器。实在不会就点左下角【HELP?】看指南！",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "通信劫持确认。哼……最基本的握手而已，热身运动算你合格。",
    unlock: 1,
  },
  {
    sender: "alibaba",
    text: "第二关，内部潜入，目标防火墙 /api/challenge/trust。伪装你的请求来源，让对面的安全系统认定你是来自本地回环地址的可信系统！",
    unlock: 1,
  },
  {
    sender: "alibaba",
    text: "伪装生效！那群呆瓜门禁真把你当成自家服务器了，干得漂亮！",
    unlock: 2,
  },
  {
    sender: "alibaba",
    text: "还没结束，依然是 /api/challenge/trust。怪盗潜入可不能留下足迹，在请求链路头里伪造一条途经『phantom-proxy』的 “代理” 痕迹！",
    unlock: 2,
  },
  {
    sender: "alibaba",
    text: "神不知鬼不觉，这招很有怪盗的风格嘛~",
    unlock: 3,
  },
  {
    sender: "alibaba",
    text: "终极考验！让服务器坚信——你是直接从大众认知的最深处『https://mementos.local/』（印象空间）一跃而来的！",
    unlock: 3,
  },
  {
    sender: "alibaba",
    text: "All Clear！！(๑•̀ㅂ•́)و✧ 呜哇……没想到你这家伙不仅体术好，协议栈摸得也挺透嘛！",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "本天才认可你了！既然你已经证明了实力，那就去盗取属于你的第一个真正秘宝（Flag）吧！",
    unlock: 4,
  },
  {
    sender: "me",
    text: "目标是谁？该发预告信了。",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "国际知名黑客组织『MEDJED』……哈！他们到处借着我当年玩剩下的名号四处恐吓，本质上不过是一群只会用扫描器的半吊子罢了！",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "他们最近为了装门面搭了个宣传官网，结果那群马大哈居然直接把整个 Git 版本控制目录（.git）一起丢在公网上！连源码和历史提交日志都在里面！",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "去把他们隐藏在历史提交版本里的老底彻底掀翻吧，让他们见识一下真正怪盗的黑客实力！",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "潜入 MEDJED 官网，夺取隐藏的 Flag 秘宝",
    unlock: 4,
    action: "medjed",
  },
];

const fastMessages: ChatMessage[] = [
  {
    sender: "alibaba",
    text: "【试炼 01】：向 /api/challenge/handshake 发送 POST 请求，请求正文包含 codename=JOKER。（可用 HackBar/Apifox/Postman/Python requests/curl 等发包）",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "【试炼 02】：请求 /api/challenge/trust，伪造用于标识客户端的真实 IP 地址的请求头为本地回环地址。",
    unlock: 1,
  },
  {
    sender: "alibaba",
    text: "【试炼 03】：请求 /api/challenge/trust，添加表示代理服务器的请求头，内容为 phantom-proxy。",
    unlock: 2,
  },
  {
    sender: "alibaba",
    text: "【试炼 04】：请求 /api/challenge/trust，添加表示当前请求页面的来源页面的地址的请求头，内容为 https://mementos.local/。",
    unlock: 3,
  },
  {
    sender: "alibaba",
    text: "试炼通过！目标 MEDJED 官网存在 .git 源码泄露漏洞，找到你的第一个 Flag 吧。",
    unlock: 4,
  },
  {
    sender: "alibaba",
    text: "任务：潜入 MEDJED 官网",
    unlock: 4,
    action: "medjed",
  },
];

const modeStorageKey = "p5-play-mode";
const countStorageKey = "im-read-count";
const stageStorageKey = "im-read-stage";
const storedMode = localStorage.getItem(modeStorageKey) as PlayMode | null;
const playMode = ref<PlayMode>(storedMode || "story");
const showModeModal = ref<boolean>(!storedMode);

const messages = computed(() => (playMode.value === "fast" ? fastMessages : fullMessages));

function chooseMode(mode: PlayMode) {
  playMode.value = mode;
  localStorage.setItem(modeStorageKey, mode);
  showModeModal.value = false;
  count.value = 1;
  localStorage.setItem(countStorageKey, "1");
}

const serverStage = ref(0);
// 高水位线：记录见过的最高 stage。服务器/worker 重启把 stage 清零时，
// 只提示、不回退已读剧情，也不把回退后的值写回 localStorage。
const maxStage = ref(
  Math.max(0, Number(localStorage.getItem(stageStorageKey) || 0)),
);
const count = ref(
  Math.max(1, Number(localStorage.getItem(countStorageKey) || 1)),
);
const resetNotice = ref(false);
let resetNoticeDismissed = false;
const transcript = ref<HTMLElement>();
const season = ref<Season>("none");
const showSeasonMenu = ref(false);
const helpOpen = ref(false);
const particles = ref<Particle[]>([]);
let nextParticleId = 0;
let particleTimer: ReturnType<typeof setInterval> | undefined;
let statusTimer: ReturnType<typeof setInterval> | undefined;
let statusInitialized = false;

const unlockedCount = computed(
  () =>
    messages.value.filter((message) => message.unlock <= maxStage.value).length,
);
const visibleMessages = computed(() =>
  messages.value.slice(0, Math.min(count.value, unlockedCount.value)),
);
const canAdvance = computed(() => count.value < unlockedCount.value);

function advance() {
  if (!canAdvance.value) return;
  count.value += 1;
  localStorage.setItem(countStorageKey, String(count.value));
}

function dismissResetNotice() {
  resetNotice.value = false;
  resetNoticeDismissed = true;
}

function selectSeason(value: Season) {
  season.value = value;
  showSeasonMenu.value = false;
  clearInterval(particleTimer);
  particles.value = [];
  if (value === "none") return;
  const spawn = (initial = false) => {
    particles.value.push({
      id: nextParticleId++,
      x: Math.random() * 110,
      size: 14 + Math.random() * 22,
      delay: initial ? -Math.random() * 8 : 0,
      duration: 7 + Math.random() * 4,
      drift: -90 + Math.random() * 120,
    });
    if (particles.value.length > 25) particles.value.shift();
  };
  for (let index = 0; index < 12; index += 1) spawn(true);
  particleTimer = setInterval(spawn, 600);
}

async function refresh() {
  let nextStage: number;
  try {
    const response = await fetch("/api/status");
    if (!response.ok) return;
    nextStage = Number((await response.json()).stage ?? 0);
  } catch {
    // 网络抖动 / 网关错误：保持现状，绝不回退本地进度
    return;
  }
  if (!Number.isFinite(nextStage)) return;

  const previousMax = maxStage.value;
  const stageAdvanced = statusInitialized && nextStage > serverStage.value;
  serverStage.value = nextStage;

  if (nextStage > maxStage.value) {
    maxStage.value = nextStage;
    localStorage.setItem(stageStorageKey, String(nextStage));
  }

  // 服务器进度低于历史最高 => worker/容器重启导致状态丢失，只提示，不回写、不回退
  const regressed = nextStage < previousMax;
  if (!regressed) resetNoticeDismissed = false;
  resetNotice.value = regressed && !resetNoticeDismissed;

  if (stageAdvanced && count.value < unlockedCount.value) {
    count.value += 1;
    localStorage.setItem(countStorageKey, String(count.value));
  }
  statusInitialized = true;
}

function openHeaderDocs() {
  helpOpen.value = false;
  window.open(
    "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Reference/Headers",
    "_blank",
    "noopener,noreferrer",
  );
}

function openRequestDocs() {
  helpOpen.value = false;
  window.open(
    "https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/Messages#http_请求",
    "_blank",
    "noopener,noreferrer",
  );
}

function openToolsDoc() {
  helpOpen.value = false;
  window.open(
    "https://hello-ctf.com/hc-web/http/#curl",
    "_blank",
    "noopener,noreferrer",
  );
}

function openLeakDoc() {
  helpOpen.value = false;
  window.open(
    "https://ctf-wiki.org/web/php/php/#_19",
    "_blank",
    "noopener,noreferrer",
  );
}

watch(visibleMessages, async () => {
  await nextTick();
  transcript.value?.scrollTo({
    top: transcript.value.scrollHeight,
    behavior: "smooth",
  });
});

onMounted(() => {
  refresh();
  statusTimer = setInterval(refresh, 2200);
});
onUnmounted(() => {
  clearInterval(statusTimer);
  clearInterval(particleTimer);
});
</script>

<template>
  <main class="persona-app">
    <div class="halftone" aria-hidden="true" />
    <div class="background-splatter" aria-hidden="true" />
    <div class="particles" aria-hidden="true">
      <i
        v-for="particle in particles"
        :key="particle.id"
        :class="['particle', season]"
        :style="{
          '--x': `${particle.x}%`,
          '--size': `${particle.size}px`,
          '--delay': `${particle.delay}s`,
          '--duration': `${particle.duration}s`,
          '--drift': `${particle.drift}px`,
        }"
      />
    </div>

    <Transition name="menu">
      <div v-if="showModeModal" class="mode-modal-overlay">
        <section
          class="mode-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-modal-title"
        >
          <div class="mode-modal__paper">
            <div class="mode-modal__topline" aria-hidden="true">
              <span>PHANTOM THIEVES // ENTRY</span>
              <span>01 / 02</span>
            </div>
            <h2 id="mode-modal-title">
              <span>TAKE YOUR</span>
              <strong>CHOICE</strong>
            </h2>
            <p class="mode-desc">
              <b>选择你的潜入路线</b>
              <span>确认后将锁定当前体验模式</span>
            </p>
            <div class="mode-buttons">
              <button
                class="mode-btn story"
                type="button"
                aria-label="选择剧情模式"
                @click="chooseMode('story')"
              >
                <span class="mode-btn__number" aria-hidden="true">01</span>
                <span class="mode-btn__copy">
                  <strong>剧情模式 <em>RECOMMENDED</em></strong>
                  <span>沉浸式体验 P5R 怪盗对话与剧情</span>
                </span>
                <span class="mode-btn__arrow" aria-hidden="true">↗</span>
              </button>
              <button
                class="mode-btn fast"
                type="button"
                aria-label="选择快速模式"
                @click="chooseMode('fast')"
              >
                <span class="mode-btn__number" aria-hidden="true">02</span>
                <span class="mode-btn__copy">
                  <strong>快速模式</strong>
                  <span>精简冗余对白，我要直接做题！</span>
                </span>
                <span class="mode-btn__arrow" aria-hidden="true">↗</span>
              </button>
            </div>
            <div class="mode-modal__footer" aria-hidden="true">
              <span>SELECT YOUR ROUTE</span>
            </div>
          </div>
        </section>
      </div>
    </Transition>

    <header class="app-header">
      <div class="logo-area">
        <button
          class="im-logo"
          aria-label="选择背景效果"
          @click="showSeasonMenu = !showSeasonMenu"
        >
          <svg viewBox="0 0 218 170" aria-hidden="true">
            <path
              fill="#000"
              d="M99.21 144.84 106.92 156.2 217.91 120.69 189.27 5.3 126.27.17l-3.62 28.5-9.87-15.16-3.69-10.8-37.75 15.91-2.67-12.57L.09 20.15 40.77 170Z"
            />
            <path
              fill="#fd1700"
              d="m24.15 42.43 35.92-15.11 24.27 113.2-27.49 5.69Z"
            />
            <path
              fill="#fff"
              d="m108.11 134.34 21.81-5.78-23.94-79.95 33.38 48.7L141.89 34l25.37 86.75 22.01-5.68-18.26-98.21-34.6-3.35-4.36 50.32-24.33-34.44-3.8-10.37L73 31.27Z"
            />
          </svg>
        </button>
        <Transition name="menu">
          <div v-if="showSeasonMenu" class="season-menu">
            <button
              v-for="item in ['none', 'spring', 'winter'] as Season[]"
              :key="item"
              @click="selectSeason(item)"
            >
              {{ item }}
            </button>
          </div>
        </Transition>
      </div>
      <div class="participants">
        <div class="participant"><span /><PartyIcon name="alibaba" /></div>
      </div>
    </header>

    <Transition name="menu">
      <div v-if="resetNotice" class="reset-notice" role="alert">
        <div class="reset-notice__copy">
          <strong>服务器状态已重置</strong>
          <span
            >后台进度被清空（服务重启或 worker 超时回收），请重新完成四重试炼后再进入
            MEDJED。</span
          >
        </div>
        <button
          class="reset-notice__close"
          type="button"
          aria-label="关闭提示"
          @click="dismissResetNotice"
        >
          ×
        </button>
      </div>
    </Transition>

    <section ref="transcript" class="transcript">
      <div class="transcript-content">
        <article
          v-for="(message, index) in visibleMessages"
          :key="`${index}-${message.text}`"
          :class="['entry', { reply: message.sender === 'me' }]"
        >
          <template v-if="message.sender === 'alibaba'">
            <AlibabaAvatar />
            <a
              v-if="message.action === 'medjed' && serverStage >= 4"
              class="p5-action"
              href="/medjed/"
              target="_blank"
              ><i />{{ message.text }}<b>▶</b></a
            >
            <MessageBubble v-else :text="message.text" />
          </template>
          <MessageBubble v-else :text="message.text" reply />
          <div
            v-if="index < visibleMessages.length - 1"
            :class="[
              'connecting-line',
              message.sender === 'me' ? 'from-right' : 'from-left',
              visibleMessages[index + 1]?.sender === 'me'
                ? 'to-right'
                : 'to-left',
            ]"
            aria-hidden="true"
          />
        </article>
        <div v-if="!canAdvance && serverStage < 4 && !resetNotice" class="typing-entry">
          <div class="typing-bubble">
            <svg viewBox="0 0 230 116">
              <path
                fill="#6c0100"
                d="M0 113.32 57.06 69.28l5.51 11.92 8.87-12.52-13.01-34.09L222.6 0l7 98.05-140.91 17.05-4.44-12.12-31.33 11.92-5.03-19.22Z"
              /></svg
            ><span><i /><i /><i /></span>
          </div>
        </div>
      </div>
    </section>

    <div class="help-area">
      <Transition name="menu">
        <div v-if="helpOpen" class="p5-choice">
          <button @click="openRequestDocs">HTTP 基础</button>
          <button @click="openToolsDoc">如何发送请求</button>
          <button @click="openHeaderDocs">常用请求头</button>
          <button @click="openLeakDoc">Git 泄露还原</button>
        </div>
      </Transition>
      <button class="help-trigger" @click="helpOpen = !helpOpen">HELP?</button>
    </div>
    <button
      v-if="canAdvance"
      class="next-button"
      aria-label="下一条消息"
      @click="advance"
    >
      <svg viewBox="0 0 130 57">
        <path
          fill="#000"
          d="m47.24 3.82 13.56.87 3.85 6.14 1.27-6.82L77.18 7.1l1.2 5.74 8.88-3.68 4.43 6.15 9.36.16.88-7L114 4.01l1.68 8.36 4.01.12 2.44 8.32-3.05 2.98.3 5.69 6.95 4.92-8.36 13.26-8.1-4.89-3.89 2.06-5.35-.11-1.99-1.34-2.75 1.6-10.08.24-1.41-3.56-4.22 1.39-1.81 5.14 1.6 3.48-14.55.53-2.25-4.96-2.56 3.97-13.94.3Z"
        />
        <circle cx="24.72" cy="27.48" r="21.36" fill="#000" />
        <path
          fill="#fff"
          d="m21.02 38.99-4.11-2.05 9.46-9.46-9.46-9.46 4.11-2.06 11.51 11.52Z"
        />
      </svg>
      <span>NEXT</span>
    </button>
  </main>
</template>
