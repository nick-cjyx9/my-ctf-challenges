<template>
  <svg class="question" viewBox="0 0 51 68" aria-hidden="true">
    <path fill="#fff" d="m0 23.425 8.81-19.279L34 0l16.48 14.096-3.52 23.321-14.1 11.816-7.98 18.035-22.49-5.804 4.04-20.626 6.74-12.231Z"/>
    <path fill="#000" d="M9.64 17.931C10.04 14.373 15.86 7.255 25.24 7.255c12.18 0 19.54 7.774 19.54 15.444s-7.46 13.785-11.92 14.926c-4.46 1.14-6.65 3.006-7.23 7.152l-11.28-3.901c.63-3.373 3.36-8.02 5.79-9.773 4.35-3.13 10.99-2.243 10.99-8.433 0-1.6-1.98-4.991-5.42-4.991-4.71 0-5.95 4.904-6.12 5.93Z"/>
    <path fill="#000" d="m12.32 46.424 12.92 3.86-3.64 11.547-12.83-3.6Z"/>
  </svg>
</template>

<style scoped>
.question {
  position: absolute;
  z-index: 8;
  top: -16px;
  right: 12px;
  width: 24px;
  height: 31px;
  overflow: visible;
  transform-origin: center;
  animation: question-in 100ms 130ms cubic-bezier(.18,.89,.32,1.35) both;
}
@keyframes question-in {
  from { transform: scale(.4); }
  to { transform: scale(1); }
}
</style>
