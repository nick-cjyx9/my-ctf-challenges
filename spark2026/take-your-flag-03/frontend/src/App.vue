<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import MonaAvatar from "./components/MonaAvatar.vue";
import MessageBubble from "./components/MessageBubble.vue";

interface ChatMessage {
  sender: "mona" | "joker";
  text: string;
  action?: "ktv" | "phish";
}

const messages: ChatMessage[] = [
  {
    sender: "mona",
    text: "喂，Joker！你在卢布朗阁楼鬼鬼祟祟盯着涉谷商业区的局域网拓扑图干嘛呢？",
  },
  {
    sender: "joker",
    text: "...听说今天芳泽约了双叶去涉谷的 BigEcho 唱 KTV。",
  },
  {
    sender: "mona",
    text: "哈？！那个整天宅在房间连卢布朗大门都懒得出的双叶，居然会跟运动少女芳泽去唱 K？！",
  },
  {
    sender: "mona",
    text: "不对，你还没回答我，这和你正在干的事情有什么关系吗，难不成你想偷听？",
  },
  {
    sender: "joker",
    text: "杏也在。",
  },
  {
    sender: "mona",
    text: "去把我的黑客秘籍拿来",
  },
  {
    sender: "joker",
    text: "（转过身继续操作电脑）双叶大概率会点特摄曲或者动画神曲，但芳泽，我完全猜不透。",
  },
  {
    sender: "joker",
    text: "所以我顺手黑进了她们包厢那台 BigEcho 智能云点歌机的前端系统。",
  },
  {
    sender: "mona",
    text: "不愧是吾辈看中的人，行动力真可怕...",
  },
  {
    sender: "joker",
    text: "（嘴角微微上扬）芳泽那孩子，平时除了练艺术体操和吃甜点，对数码产品基本一窍不通，是个完全的电子小白。",
  },
  {
    sender: "mona",
    text: "（满脸嫌弃，似乎猜到了什么）哎，Joker...",
  },
  {
    sender: "joker",
    text: "（一边打字一遍念出来）『尊敬的顾客您好，检测到您正在使用包厢，点击此链接即可免费领取【草莓草莓巨无霸巴菲兑换券】，并自动点亮包厢粉色应援灯！』",
  },
  {
    sender: "mona",
    text: "【TIP】flag: 获取到芳泽她们正在唱的歌的歌名后，用 flag{} 包裹。",
  },
  {
    sender: "mona",
    text: "目标系统：BigEcho 涉谷点歌机前端",
    action: "ktv",
  },
  {
    sender: "mona",
    text: "向芳泽发送钓鱼链接",
    action: "phish",
  },
];

const count = ref(1);
const transcript = ref<HTMLElement>();
const helpOpen = ref(false);

const visibleMessages = computed(() => messages.slice(0, count.value));
const canAdvance = computed(() => count.value < messages.length);

function advance() {
  if (!canAdvance.value) return;
  count.value += 1;
}

function openDoc1() {
  helpOpen.value = false;
  window.open("https://portswigger.net/web-security/prototype-pollution/client-side", "_blank", "noopener,noreferrer");
}

function openDoc2() {
  helpOpen.value = false;
  window.open("https://hello-ctf.com/hc-web/xss/", "_blank", "noopener,noreferrer");
}
function openDoc3() {
  helpOpen.value = false;
  window.open("https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Guides/CSP", "_blank", "noopener,noreferrer");
}

watch(visibleMessages, async () => {
  await nextTick();
  transcript.value?.scrollTo({
    top: transcript.value.scrollHeight,
    behavior: "smooth",
  });
});
</script>

<template>
  <main class="persona-app">
    <div class="halftone" aria-hidden="true" />
    <div class="background-splatter" aria-hidden="true" />

    <header class="app-header">
      <div class="logo-area">
        <div class="im-logo">
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
        </div>
      </div>
      <div class="participants">
        <div class="participant"><span /><img src="/mona.png" alt="Mona" /></div>
      </div>
    </header>

    <section ref="transcript" class="transcript">
      <div class="transcript-content">
        <article
          v-for="(message, index) in visibleMessages"
          :key="`${index}-${message.text}`"
          :class="['entry', { reply: message.sender === 'joker' }]"
        >
          <template v-if="message.sender === 'mona'">
            <MonaAvatar />
            <a
              v-if="message.action === 'ktv'"
              class="p5-action"
              href="/ktv/"
              target="_blank"
            ><i />{{ message.text }}<b>▶</b></a>
            <a
              v-else-if="message.action === 'phish'"
              class="p5-action"
              href="/report"
              target="_blank"
            ><i />{{ message.text }}<b>✉</b></a>
            <MessageBubble v-else :text="message.text" />
          </template>
          <MessageBubble v-else :text="message.text" reply />
          <div
            v-if="index < visibleMessages.length - 1"
            :class="[
              'connecting-line',
              message.sender === 'joker' ? 'from-right' : 'from-left',
              visibleMessages[index + 1]?.sender === 'joker'
                ? 'to-right'
                : 'to-left',
            ]"
            aria-hidden="true"
          />
        </article>
      </div>
    </section>

    <div class="help-area">
      <Transition name="menu">
        <div v-if="helpOpen" class="p5-choice">
          <button @click="openDoc1">客户端原型链污染</button>
          <button @click="openDoc2">XSS 跨站脚本</button>
          <button @click="openDoc3">内容安全策略（CSP）</button>
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
