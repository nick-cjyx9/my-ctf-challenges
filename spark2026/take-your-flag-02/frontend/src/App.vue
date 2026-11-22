<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import AlibabaAvatar from "./components/AlibabaAvatar.vue";
import KanadeAvatar from "./components/KanadeAvatar.vue";
import MessageBubble from "./components/MessageBubble.vue";
import PartyIcon from "./components/PartyIcon.vue";

type Season = "none" | "spring" | "winter";
type PlayMode = "story" | "fast";

interface ChatMessage {
  sender: "alibaba" | "kanade" | "me";
  text: string;
  unlock: number;
  action?: "source" | "shop";
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
    text: "JOKER 紧急呼叫！！大事不好了！",
    unlock: 0,
  },
  {
    sender: "me",
    text: "怎么，有新的宫殿出现了？",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "不，比那严重多了——据点卢布朗的极品咖啡豆见底了，再交不上伙食费老板要把我们全轰出去！",
    unlock: 0,
  },
  {
    sender: "me",
    text: "...说重点。",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "咳咳！所以我利用暗网渠道接了一单报酬极其丰厚的『企业级安全代码审计』！对方是似乎是秩父的高级酒铺的负责人，她已经在对接频道里了——",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "我刚才看了一眼，这家店居然收了『六代目百合』还有『百年の孤独』这种名酒！只要帮她测完系统，不仅能拿到报酬，还能顺两瓶好酒给老板！",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "不过我刚好到了《女神异闻录》限定副本的刷新时间...所以现场渗透就交给你了！JOKER 加油，我相信你！(溜)",
    unlock: 0,
  },
  {
    sender: "alibaba",
    text: "[用户 @alibaba 进入专注模式：游戏中，请勿打扰]",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "...你好。我是郡上，这家酒铺系统的技术对接人。",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "开发部门那群家伙号称写了『全宇宙最无懈可击的 SQL 关键字过滤系统』，但我看他们的代码怎么看都觉得像是在过家家。",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "源码档案：新建 文本文档.txt",
    unlock: 0,
    action: "source",
  },
  {
    sender: "kanade",
    text: "测试站点：DrinkDrankDrunk 秩父酒铺",
    unlock: 0,
    action: "shop",
  },
  {
    sender: "kanade",
    text: "据点数据库里有一张存放机密数据的 `flag` 数据表。如果你能绕过他们所谓的单次替换过滤，把里面的 flag 抽出来，就证明他们的防御确实是个笑话。",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "抱歉，今晚我得先失联一阵子。我约了人在居酒屋...电车还有二十分钟进站，我得提前过去占座...",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "【语音消息 00:28 自动转文字】\n「（背景里传来居酒屋暖帘的风铃声与轻快的脚步声）...学姐？好巧，你怎么一个人站在这里看手机呀？」",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "【语音消息 00:28 自动转文字】\n「...！景、景岚？！你...你怎么会在这里...明明距离电车到站还有二十...」",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "【语音消息 00:28 自动转文字】\n「ふふ，因为一想到是要来见学姐，在宿舍就根本坐不住嘛。而且...只要是来见你的时间，哪怕只是站在旁边等，我都觉得好开心哦。...学姐，耳朵怎么这么红？明明还没开始喝酒呢？」",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "【语音消息 00:28 自动转文字】\n「才、才没有红！只是外面的风有点冷而已...真是的，你这家伙总是...唔，靠得太近了...！...好啦，今晚你想喝什么都随你...！等下，录音怎么开着——（一阵急促布料摩擦声与撞击声）」",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "[用户 @kanade 已离线]",
    unlock: 0,
  },
  {
    sender: "me",
    text: "...",
    unlock: 0,
  },
  {
    sender: "me",
    text: "不仅把活全甩给我，还要在离线前给我塞一整车狗粮是吧。",
    unlock: 0,
  },
  {
    sender: "me",
    text: "真是败给你们了",
    unlock: 0,
  },
  {
    sender: "me",
    text: "算了，看在报酬的份上...单次过滤是吧？用双写构造 union 注入，迅速把这个破系统拿下来吧。",
    unlock: 0,
  },
];

const fastMessages: ChatMessage[] = [
  {
    sender: "kanade",
    text: "任务：对 DrinkDrankDrunk 酒铺系统的搜索接口进行 SQL 注入安全审计，提取数据库中的 flag 表内容。",
    unlock: 0,
  },
  {
    sender: "kanade",
    text: "源码：新建 文本文档.txt",
    unlock: 0,
    action: "source",
  },
  {
    sender: "kanade",
    text: "测试站点：DrinkDrankDrunk 秩父酒铺",
    unlock: 0,
    action: "shop",
  }
];

const modeStorageKey = "p5-play-mode";
const storedMode = localStorage.getItem(modeStorageKey) as PlayMode | null;
const playMode = ref<PlayMode>(storedMode || "story");
const showModeModal = ref<boolean>(!storedMode);

const messages = computed(() => (playMode.value === "fast" ? fastMessages : fullMessages));

function chooseMode(mode: PlayMode) {
  playMode.value = mode;
  localStorage.setItem(modeStorageKey, mode);
  showModeModal.value = false;
  count.value = 1;
  localStorage.setItem("im-read-count", "1");
}

const serverStage = ref(4);
const count = ref(
  Math.max(1, Number(localStorage.getItem("im-read-count") || 1)),
);
const transcript = ref<HTMLElement>();
const season = ref<Season>("none");
const showSeasonMenu = ref(false);
const helpOpen = ref(false);
const particles = ref<Particle[]>([]);
let nextParticleId = 0;
let particleTimer: ReturnType<typeof setInterval> | undefined;

const unlockedCount = computed(
  () =>
    messages.value.filter((message) => message.unlock <= serverStage.value).length,
);
const visibleMessages = computed(() =>
  messages.value.slice(0, Math.min(count.value, unlockedCount.value)),
);
const canAdvance = computed(() => count.value < unlockedCount.value);

function advance() {
  if (!canAdvance.value) return;
  count.value += 1;
  localStorage.setItem("im-read-count", String(count.value));
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

function openRequestDocs() {
  helpOpen.value = false;
  window.open(
    "https://hello-ctf.com/hc-web/sql_injection/",
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

onUnmounted(() => clearInterval(particleTimer));
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

    <!-- 首次模式选择弹窗 -->
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
                class="mode-btn fast"
                type="button"
                aria-label="选择快速模式"
                @click="chooseMode('fast')"
              >
                <span class="mode-btn__number" aria-hidden="true">02</span>
                <span class="mode-btn__copy">
                  <strong>快速模式 <em>RECOMMENDED</em></strong>
                  <span>精简冗余对白，直接展示题目附件与目标</span>
                </span>
                <span class="mode-btn__arrow" aria-hidden="true">↗</span>
              </button>
              <button
                class="mode-btn story"
                type="button"
                aria-label="选择剧情模式"
                @click="chooseMode('story')"
              >
                <span class="mode-btn__number" aria-hidden="true">01</span>
                <span class="mode-btn__copy">
                  <strong>剧情模式</strong>
                  <span>沉浸式体验剧情，包含 Girls' Love 元素，自行避雷</span>
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
        <div class="participant"><span /><img src="/kanade-gujyo.png" alt="郡上奏" /></div>
      </div>
    </header>

    <section ref="transcript" class="transcript">
      <div class="transcript-content">
        <article
          v-for="(message, index) in visibleMessages"
          :key="`${index}-${message.text}`"
          :class="['entry', { reply: message.sender === 'me' }]"
        >
          <template v-if="message.sender === 'kanade'">
            <KanadeAvatar />
            <a
              v-if="message.action === 'source'"
              class="p5-action"
              href="/attachments/新建%20文本文档.txt"
              ><i />{{ message.text }}<b>↓</b></a
            >
            <a
              v-else-if="message.action === 'shop'"
              class="p5-action"
              href="/shop.php"
              target="_blank"
              ><i />{{ message.text }}<b>▶</b></a
            >
            <MessageBubble v-else :text="message.text" />
          </template>
          <template v-else-if="message.sender === 'alibaba'"
            ><AlibabaAvatar /><MessageBubble :text="message.text"
          /></template>
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
        <div v-if="!canAdvance && serverStage < 0" class="typing-entry">
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
      <Transition name="menu"
        ><div v-if="helpOpen" class="p5-choice">
          <button @click="openRequestDocs">SQL 联合注入与双写绕过</button>
        </div></Transition
      >
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
