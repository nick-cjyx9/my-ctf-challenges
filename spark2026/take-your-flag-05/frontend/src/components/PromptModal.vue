<template>
  <div class="p5-modal-layer" @click.self="emit('cancel')">
    <div class="p5-modal" role="dialog" aria-modal="true">
      <div class="modal-echo" aria-hidden="true"></div>
      <div class="modal-shadow" aria-hidden="true"></div>

      <div class="modal-body">
        <div class="modal-kicker">MAIL ORDER / CONFIRM</div>

        <div class="modal-head">
          <span class="head-tag">{{ isSell ? '出售确认' : '购买确认' }}</span>
          <span class="head-name">{{ product.name }}</span>
        </div>

        <div class="calc">
          <div class="calc-row">
            <span class="calc-label">单价</span>
            <span class="calc-value">{{ product.price.toLocaleString() }} 日元</span>
          </div>

          <div class="calc-row">
            <span class="calc-label">{{ isSell ? '出售数量' : '购买数量' }}</span>
            <div class="counter">
              <button class="counter-btn" :disabled="count <= 1" @click="change(-1)">−</button>
              <span class="counter-value">{{ count }}</span>
              <button class="counter-btn" :disabled="count >= maxCount" @click="change(1)">＋</button>
            </div>
          </div>

          <div class="calc-row calc-total">
            <span class="calc-label">合计金额</span>
            <span class="calc-value total">{{ total.toLocaleString() }} 日元</span>
          </div>
        </div>

        <div class="wallet-note" :class="{ bad: !canConfirm }">
          <template v-if="isSell">
            出售后余额 <b>{{ (wallet + total).toLocaleString() }}</b> 日元
          </template>
          <template v-else-if="affordable">
            支付后剩余 <b>{{ (wallet - total).toLocaleString() }}</b> 日元
          </template>
          <template v-else>
            持有金额不足，还差 <b>{{ (total - wallet).toLocaleString() }}</b> 日元
          </template>
        </div>

        <div class="modal-actions">
          <button class="act act-cancel" @click="emit('cancel')">
            <span class="act-key">B</span>
            <span class="act-text">取消</span>
          </button>
          <button class="act act-confirm" :disabled="!canConfirm" @click="confirm">
            <span class="act-key">A</span>
            <span class="act-text">{{ isSell ? '决定出售' : '决定购买' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Product } from '../api'

// 与后端 maxOrderCount 保持一致。
const MAX_ORDER_COUNT = 1000

const props = defineProps<{
  product: Product
  wallet: number
  mode: 'buy' | 'sell'
}>()

const emit = defineEmits<{
  (e: 'confirm', count: number): void
  (e: 'cancel'): void
}>()

const count = ref(1)
const isSell = computed(() => props.mode === 'sell')
const maxCount = computed(() => (isSell.value ? Math.max(1, props.product.owned) : MAX_ORDER_COUNT))
const total = computed(() => props.product.price * count.value)
const affordable = computed(() => props.wallet >= total.value)
const canConfirm = computed(() => (isSell.value ? true : affordable.value))

watch(
  () => props.product.goods,
  () => {
    count.value = 1
  }
)

const change = (delta: number) => {
  const next = count.value + delta
  if (next >= 1 && next <= maxCount.value) count.value = next
}

const confirm = () => {
  if (canConfirm.value) emit('confirm', count.value)
}

// A = 确认，B = 取消。弹窗打开期间由自己接管按键，避免和列表快捷键打架。
const onKey = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  if (key === 'a' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    confirm()
  } else if (key === 'b' || e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault()
    emit('cancel')
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped lang="scss">
.p5-modal-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(3px);
  animation: layerIn 0.14s ease-out both;
}

.p5-modal {
  position: relative;
  width: 500px;
  max-width: 92vw;
  animation: modalIn 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;

  .modal-echo {
    position: absolute;
    inset: 0;
    background: var(--p5-red);
    transform: translate(-10px, 10px) rotate(-2.5deg);
    clip-path: polygon(1% 4%, 100% 0, 97% 100%, 2% 96%);
  }

  .modal-shadow {
    position: absolute;
    inset: 0;
    background: var(--p5-yellow);
    transform: translate(10px, -8px) rotate(1.5deg);
    clip-path: polygon(0 2%, 99% 0, 100% 98%, 1% 100%);
  }

  .modal-body {
    position: relative;
    z-index: 5;
    background: var(--p5-white);
    color: var(--p5-black);
    border: 4px solid var(--p5-black);
    padding: 22px 28px 24px;
    clip-path: polygon(0.6% 3%, 99.6% 0, 100% 97%, 1% 100%);
  }

  .modal-kicker {
    font-family: var(--font-latin);
    font-size: 13px;
    letter-spacing: 3px;
    color: var(--p5-gray);
    margin-bottom: 8px;
  }

  .modal-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 4px solid var(--p5-black);
    margin-bottom: 16px;

    .head-tag {
      background: var(--p5-black);
      color: var(--p5-yellow);
      font-family: var(--font-cjk);
      font-weight: 900;
      font-size: 15px;
      letter-spacing: 1px;
      padding: 4px 10px;
      transform: rotate(-2deg);
    }

    .head-name {
      font-family: var(--font-title);
      font-weight: 900;
      font-size: 30px;
      letter-spacing: 1px;
    }
  }

  .calc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: rgba(0, 0, 0, 0.06);
    border: 3px solid var(--p5-black);
  }

  .calc-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .calc-label {
    font-family: var(--font-cjk);
    font-weight: 900;
    font-size: 19px;
    color: #3a3a3a;
  }

  .calc-value {
    font-family: var(--font-cjk);
    font-weight: 900;
    font-size: 20px;
    font-variant-numeric: tabular-nums;
  }

  .calc-total {
    border-top: 3px dashed rgba(0, 0, 0, 0.28);
    padding-top: 10px;
    margin-top: 2px;

    .calc-label {
      color: var(--p5-black);
    }

    .total {
      font-family: var(--font-num);
      font-size: 30px;
      color: var(--p5-red);
    }
  }

  .counter {
    display: flex;
    align-items: center;
    gap: 14px;

    .counter-btn {
      width: 34px;
      height: 34px;
      border: 3px solid var(--p5-black);
      background: var(--p5-white);
      color: var(--p5-black);
      font-size: 20px;
      font-weight: 900;
      line-height: 1;
      cursor: pointer;
      transition: transform 0.1s ease, background 0.1s ease;

      &:hover:not(:disabled) {
        background: var(--p5-yellow);
        transform: translateY(-2px);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .counter-value {
      min-width: 42px;
      text-align: center;
      font-family: var(--font-num);
      font-size: 28px;
    }
  }

  .wallet-note {
    margin: 14px 0 18px;
    text-align: right;
    font-family: var(--font-cjk);
    font-weight: 900;
    font-size: 16px;

    b {
      font-family: var(--font-num);
      font-size: 20px;
    }

    &.bad {
      color: var(--p5-red);
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 14px;
  }

  .act {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 9px 18px 9px 12px;
    border: 3px solid var(--p5-black);
    font-family: var(--font-cjk);
    font-weight: 900;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.1s ease, box-shadow 0.1s ease, background 0.1s ease;

    .act-key {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2.5px solid currentColor;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-latin);
      font-size: 13px;
    }

    &.act-cancel {
      background: var(--p5-white);
      color: var(--p5-black);
      box-shadow: 4px 4px 0 var(--p5-black);

      &:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0 var(--p5-black);
      }
    }

    &.act-confirm {
      background: var(--p5-black);
      color: var(--p5-white);
      box-shadow: 4px 4px 0 var(--p5-red);

      &:hover:not(:disabled) {
        background: var(--p5-yellow);
        color: var(--p5-black);
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0 var(--p5-red);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
}

@keyframes layerIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.86) rotate(-3deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
</style>
