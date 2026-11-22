<script setup lang="ts">
import QuestionMark from './QuestionMark.vue'

defineProps<{
  text: string
  reply?: boolean
}>()
</script>

<template>
  <div :class="['bubble', { reply }]">
    <template v-if="!reply">
      <svg class="incoming-stem" viewBox="0 0 36 45" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#fff" d="M0 25.8 19.5 7.8 20.8 13.5 32.4 5.7 30.6 29.2 11.7 32.4 10 25Z"/>
        <path fill="#000" d="m4.6 22.8 12.4-11 2.3 5.1 15.1-8.4-.4 15.1-19.6 2.8-1.6-6.8Z"/>
      </svg>
      <div class="outer incoming-outer" />
      <div class="inner incoming-inner" />
    </template>
    <template v-else>
      <div class="outer reply-outer" />
      <div class="inner reply-inner" />
      <svg class="reply-stem" viewBox="0 0 42 45" preserveAspectRatio="none" aria-hidden="true">
        <path fill="#000" d="m4.4 2.7 16.8 12.1 1.4-6.6 19.4 17.2-10.3.1-1.7 7.3-15.6-2.9Z"/>
        <path fill="#fff" d="m8.9 11.8 13.8 6.9 2.9-5.3L37.8 24l-8.2-2.4-1.6 6.2-14.6-4Z"/>
      </svg>
    </template>
    <span class="text">{{ text }}</span>
    <QuestionMark v-if="!reply && text.endsWith('?')" />
  </div>
</template>

<style scoped>
.bubble {
  position: relative;
  z-index: 2;
  min-width: 150px;
  max-width: 100%;
  color: #fff;
  filter: drop-shadow(5px 12px 4px rgb(0 0 0 / 28%));
  transform-origin: 34px 55%;
  animation: bubble-in 180ms cubic-bezier(.18,.89,.32,1.35) both;
}

.outer,
.inner {
  position: absolute;
  pointer-events: none;
}

.incoming-outer {
  inset: 0;
  background: #fff;
  clip-path: polygon(31.7px 3.1px, 100% 0, calc(100% - 23px) 100%, 15.6px calc(100% - 8px));
}

.incoming-inner {
  inset: 0;
  background: #000;
  clip-path: polygon(33px 7.7px, calc(100% - 13px) 3.7px, calc(100% - 25.7px) calc(100% - 4.6px), 20.4px calc(100% - 12px));
}

.incoming-stem {
  position: absolute;
  z-index: 2;
  left: 0;
  top: calc(50% - 22px);
  width: 36px;
  height: 45px;
  overflow: visible;
}

.text {
  position: relative;
  z-index: 4;
  display: block;
  padding: 20px 32px 20px 42px;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.24;
  text-align: left;
  text-wrap: pretty;
  opacity: 0;
  animation: text-in 130ms 100ms linear forwards;
}

.reply {
  color: #000;
  transform-origin: right center;
}

.reply-outer {
  inset: 0;
  background: #000;
  clip-path: polygon(0 0, calc(100% - 35px) 4px, calc(100% - 10.7px) calc(100% - 6.6px), 35.5px 100%);
}

.reply-inner {
  inset: 0;
  background: #fff;
  clip-path: polygon(12px 5px, calc(100% - 36px) 9.5px, calc(100% - 16.4px) calc(100% - 11.7px), 36.5px calc(100% - 3.5px));
}

.reply .text {
  padding: 20px 40px 20px 44px;
}

.reply-stem {
  position: absolute;
  z-index: 3;
  right: 0;
  bottom: 5px;
  width: 42px;
  height: 45px;
  overflow: visible;
}

@keyframes bubble-in {
  from { transform: scale(.3, .8); }
  to { transform: scale(1); }
}

@keyframes text-in {
  to { opacity: 1; }
}
</style>
