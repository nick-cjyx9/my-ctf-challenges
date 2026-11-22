<template>
  <div class="p5-shop-stage" @keydown="handleKeyDown" tabindex="0" ref="stageRef">
    <!-- Atmospheric Ambient Background (P5 signature deep crimson/black halftone + cafe ambient lights) -->
    <div class="shop-room-bg">
      <div class="bg-base-gradient"></div>
      <div class="bg-halftone-pattern"></div>
      <div class="bg-diagonal-slashes"></div>
      <div class="bg-city-silhouette">
        <div class="window-light wl-1"></div>
        <div class="window-light wl-2"></div>
        <div class="window-light wl-3"></div>
      </div>
      <div class="vignette-overlay"></div>
    </div>

    <!-- Main Viewport Scale Layer -->
    <div class="shop-viewport">
      <!-- TOP RIGHT: WALLET BADGE (持有金额 1,819,549日元) -->
      <div class="wallet-badge-wrap">
        <div class="wallet-shadow-red" aria-hidden="true"></div>
        <div class="wallet-shadow-black" aria-hidden="true"></div>
        <div class="wallet-inner">
          <span class="wallet-label">持有金额</span>
          <span class="wallet-value">{{ wallet.toLocaleString() }}</span>
          <span class="wallet-unit">日元</span>
        </div>
      </div>

      <!-- MAIN P5R SHOPPING FRAME -->
      <div class="main-shop-frame">
        <!-- Giant White Border Polygon Outer Frame (Authentic clean P5 outer border) -->
        <div class="frame-border-outer"></div>

        <!-- Inner Black Cutout Canvas -->
        <div class="frame-content-area">
          <!-- Inner cyber grid ambient glow -->
          <div class="inner-peek-bg">
            <div class="inner-cyber-grid"></div>
          </div>

          <!-- PRODUCT LIST CONTAINER -->
          <div class="product-list-container" ref="listContainerRef">
            <div
              v-for="(item, index) in products"
              :key="item.goods"
              :ref="el => setItemRef(el, index)"
              @click="selectItem(index)"
              @mouseenter="onHoverItem(index)"
            >
              <ProductListItem
                :product="item"
                :selected="selectedIndex === index"
              />
            </div>
          </div>
        </div>

        <!-- TOP LAYER (z-index: 40): LOGO (暗站 MAIL ORDER) -->
        <div class="logo-position">
          <DarknetLogo />
        </div>

        <!-- TOP LAYER (z-index: 40): DETAIL CARD & OWNED COUNT (追加技能 + 详情 + 持有数量) -->
        <div class="detail-position" v-if="currentProduct">
          <ProductDetailCard :product="currentProduct" @sell="handleSell" />
        </div>
      </div>

      <!-- BOTTOM RIGHT CONTROLLER BUTTON GUIDE (B 返回, R 出售, A 决定) -->
      <div class="controller-guide">
        <div class="guide-pill btn-back" @click="handleBack">
          <span class="btn-circle bg-b">B</span>
          <span class="guide-text">返回</span>
        </div>
        <div
          v-if="currentProduct?.sellable && currentProduct.owned > 0"
          class="guide-pill btn-sell"
          @click="handleSell"
        >
          <span class="btn-circle bg-r">R</span>
          <span class="guide-text">出售</span>
        </div>
        <div class="guide-pill btn-decide" @click="handleDecide">
          <span class="btn-circle bg-a">A</span>
          <span class="guide-text">决定</span>
        </div>
      </div>

      <!-- TOAST NOTIFICATION -->
      <transition name="toast-anim">
        <div v-if="toastMessage" class="p5-toast">
          <div class="toast-bg"></div>
          <div class="toast-content">
            <span class="toast-star">★</span>
            <span class="toast-text">{{ toastMessage }}</span>
          </div>
        </div>
      </transition>

      <!-- ORDER CONFIRMATION MODAL (buy / sell) -->
      <PromptModal
        v-if="modal"
        :product="modal.product"
        :wallet="wallet"
        :mode="modal.mode"
        @confirm="onConfirmOrder"
        @cancel="modal = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import {
  ApiError,
  fetchStatus,
  loadStore,
  submitOrder,
  type OrderAction,
  type Product
} from './api'
import DarknetLogo from './components/DarknetLogo.vue'
import ProductListItem from './components/ProductListItem.vue'
import ProductDetailCard from './components/ProductDetailCard.vue'
import PromptModal from './components/PromptModal.vue'

const stageRef = ref<HTMLElement | null>(null)
const listContainerRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | any)[]>([])

const setItemRef = (el: any, index: number) => {
  if (el) {
    itemRefs.value[index] = el
  }
}

// State —— 商品、钱包、库存全部来自后端
const wallet = ref(0)
const products = ref<Product[]>([])
const selectedIndex = ref(0)
const modal = ref<{ mode: OrderAction; product: Product } | null>(null)
const busy = ref(false)
const toastMessage = ref('')
let toastTimer: any = null

const currentProduct = computed(() => {
  return products.value[selectedIndex.value] || null
})

const selectItem = (index: number) => {
  if (selectedIndex.value !== index) {
    selectedIndex.value = index
  } else {
    handleDecide()
  }
}

const onHoverItem = (index: number) => {
  if (selectedIndex.value !== index) {
    selectedIndex.value = index
  }
}

const showToast = (msg: string, duration = 2500) => {
  toastMessage.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    if (toastMessage.value === msg) {
      toastMessage.value = ''
    }
  }, duration)
}

// 拉取目录 + 会话状态，合并成可渲染的商品列表。
const loadProducts = async () => {
  const store = await loadStore()
  wallet.value = store.wallet
  products.value = store.products
}

// 下单后只刷新钱包和库存。
const refreshStatus = async () => {
  const status = await fetchStatus()
  wallet.value = status.wallet
  for (const p of products.value) {
    p.owned = status.inventory[p.goods] ?? 0
  }
}

const openModal = (mode: OrderAction) => {
  const product = currentProduct.value
  if (!product) return
  if (mode === 'sell' && (!product.sellable || product.owned <= 0)) {
    showToast('这件商品无法出售')
    return
  }
  modal.value = { mode, product }
}

const handleDecide = () => openModal('buy')
const handleSell = () => openModal('sell')

const handleBack = () => {
  showToast('从暗网断开连接中...')
}

const onConfirmOrder = async (count: number) => {
  const current = modal.value
  if (!current || busy.value) return
  busy.value = true
  const { mode, product } = current
  try {
    const res = await submitOrder(mode, product.goods, count)
    if (mode === 'buy' && res.serial) {
      showToast(`秘宝到手：${res.serial}`, 20000)
    } else if (mode === 'buy') {
      showToast(`已购买『${product.name}』x${count}`)
    } else {
      showToast(`已出售『${product.name}』x${count}`)
    }
    modal.value = null
    await refreshStatus()
  } catch (e) {
    const err = e as ApiError
    const label = mode === 'buy' ? '购买' : '出售'
    showToast(`${label}失败（${err.status}）：${err.detail}`, 8000)
  } finally {
    busy.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  // 弹窗打开时由 PromptModal 接管 A/B，列表不抢键。
  if (modal.value) return

  const key = e.key.toLowerCase()
  if (key === 'w' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (selectedIndex.value > 0) {
      selectedIndex.value--
      scrollToActive()
    }
  } else if (key === 's' || e.key === 'ArrowDown') {
    e.preventDefault()
    if (selectedIndex.value < products.value.length - 1) {
      selectedIndex.value++
      scrollToActive()
    }
  } else if (key === 'a' || e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    handleDecide()
  } else if (key === 'r') {
    e.preventDefault()
    handleSell()
  } else if (key === 'b' || e.key === 'Escape' || e.key === 'Backspace') {
    e.preventDefault()
    handleBack()
  }
}

const scrollToActive = () => {
  nextTick(() => {
    const el = itemRefs.value[selectedIndex.value]
    if (el && listContainerRef.value) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}

onMounted(async () => {
  try {
    await loadProducts()
  } catch (e) {
    console.error('[order-api]', e)
    showToast('无法连接订单服务，请刷新重试', 6000)
  }
  if (stageRef.value) {
    stageRef.value.focus()
  }
})
</script>

<style scoped lang="scss">
.p5-shop-stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #0b0808;
  outline: none;
}

/* Atmospheric P5 Ambient Background */
.shop-room-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;

  .bg-base-gradient {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 75% 35%, #30080c 0%, #150508 50%, #060203 100%);
  }

  .bg-halftone-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.18;
    background-image: radial-gradient(#ff003c 1.5px, transparent 1.6px);
    background-size: 14px 14px;
  }

  .bg-diagonal-slashes {
    position: absolute;
    inset: -50px;
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 80px,
      rgba(255, 0, 60, 0.03) 80px,
      rgba(255, 0, 60, 0.03) 86px
    );
  }

  .bg-city-silhouette {
    position: absolute;
    top: 15%;
    right: 5%;
    width: 450px;
    height: 400px;
    background: #110708;
    border: 12px solid #200e10;
    box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 0, 60, 0.15);
    display: flex;
    flex-wrap: wrap;
    padding: 20px;
    gap: 15px;

    .window-light {
      width: 40px;
      height: 60px;
      background: #ffaa00;
      opacity: 0.3;
      filter: blur(2px);

      &.wl-2 {
        background: #00d4ff;
        height: 90px;
        opacity: 0.25;
      }
      &.wl-3 {
        background: #ff0055;
        height: 40px;
        opacity: 0.4;
      }
    }
  }

  .vignette-overlay {
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 180px rgba(0, 0, 0, 0.95);
  }
}

/* Main Viewport Container */
.shop-viewport {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  max-width: 1920px;
  max-height: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* TOP RIGHT: WALLET BADGE (持有金额) */
.wallet-badge-wrap {
  position: absolute;
  top: 42px;
  right: 50px;
  z-index: 30;
  transform: rotate(-5.5deg) skew(-7deg);

  .wallet-shadow-red {
    position: absolute;
    inset: -3px -8px;
    background: #ff003c;
    transform: translate(-8px, 8px);
    clip-path: polygon(15% 0, 100% 0, 85% 100%, 0 100%);
  }

  .wallet-shadow-black {
    position: absolute;
    inset: -2px -4px;
    background: #000000;
    transform: translate(4px, -3px);
    clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);
  }

  .wallet-inner {
    position: relative;
    z-index: 5;
    background: #000000;
    border: 4.5px solid #ffffff;
    color: #ffffff;
    padding: 10px 48px 10px 44px;
    clip-path: polygon(14% 0, 100% 0, 86% 100%, 0 100%);
    box-shadow: 6px 6px 0 rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: baseline;
    gap: 10px;

    .wallet-label {
      font-size: 29px;
      font-weight: 900;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      letter-spacing: 2px;
      color: #ffffff;
    }

    .wallet-value {
      font-size: 44px;
      font-weight: 900;
      font-family: var(--font-num), "Optima Nova", "Impact", sans-serif;
      letter-spacing: 1px;
      color: #ffffff;
    }

    .wallet-unit {
      font-size: 24px;
      font-weight: 900;
      font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
      color: #ffffff;
    }
  }
}

/* MAIN P5R SHOPPING FRAME */
.main-shop-frame {
  position: relative;
  width: 95vw;
  max-width: 1720px;
  height: 88vh;
  max-height: 940px;
  transform: rotate(-1.8deg);

  /* Outer White Polygon Frame (Clean continuous outer border without internal step cutoffs) */
  .frame-border-outer {
    position: absolute;
    inset: -14px -18px -14px -22px;
    background: #ffffff;
    clip-path: polygon(
      0% 4%, 
      92% 0%, 
      100% 86%, 
      88% 88%, 
      85% 100%, 
      16% 100%, 
      14% 94%, 
      0% 92%
    );
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.95);
  }

  /* Inner Black Canvas */
  .frame-content-area {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: #000000;
    clip-path: polygon(
      0.3% 4.3%, 
      91.6% 0.4%, 
      99.6% 85.6%, 
      87.8% 87.6%, 
      84.6% 99.6%, 
      16.2% 99.6%, 
      14.2% 93.8%, 
      0.3% 91.8%
    );
    overflow: hidden;
  }

  /* Inner cyber grid ambience */
  .inner-peek-bg {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.25;

    .inner-cyber-grid {
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at 50% 50%, #201015 0%, #080304 80%);
    }
  }

  /* PRODUCT LIST CONTAINER */
  .product-list-container {
    position: absolute;
    top: 290px;
    left: 45px;
    width: 720px;
    bottom: 30px;
    z-index: 20;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 14px;
    padding-top: 10px;
  }

  /* TOP LAYER (z-index: 40): ENLARGED LOGO (暗站 MAIL ORDER) */
  .logo-position {
    position: absolute;
    top: -20px;
    left: -10px;
    z-index: 40;
  }

  /* TOP LAYER (z-index: 40): DETAIL CARD (追加技能 + 详情 + 持有数量) */
  .detail-position {
    position: absolute;
    bottom: 50px;
    right: 70px;
    z-index: 40;
  }
}

/* CONTROLLER GUIDE (Bottom Right) */
.controller-guide {
  position: absolute;
  bottom: 24px;
  right: 45px;
  z-index: 30;
  display: flex;
  gap: 14px;
  user-select: none;

  .guide-pill {
    background: #000000;
    border: 2.5px solid #ffffff;
    color: #ffffff;
    padding: 6px 14px 6px 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 900;
    box-shadow: 3px 3px 0 #000;
    transform: rotate(-2deg);
    transition: transform 0.1s, background 0.1s;

    &:hover {
      background: #111;
      transform: rotate(-2deg) scale(1.06);
    }

    .btn-circle {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      font-weight: 900;
      font-family: "Optima Nova", "Impact", sans-serif;
      border: 1.5px solid #000;

      &.bg-b {
        background: #ffffff;
        color: #000000;
      }
      &.bg-a {
        background: #ffffff;
        color: #000000;
      }
      &.bg-r {
        background: #ff003c;
        color: #ffffff;
      }
    }
  }
}

/* TOAST NOTIFICATION */
.p5-toast {
  position: fixed;
  top: 120px;
  left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  z-index: 2000;
  pointer-events: none;

  .toast-bg {
    position: absolute;
    inset: -4px -8px;
    background: #ff003c;
    transform: skew(-5deg);
    clip-path: polygon(0 0, 100% 4%, 96% 100%, 0 96%);
  }

  .toast-content {
    position: relative;
    z-index: 2;
    background: #000000;
    color: #ffffff;
    border: 3px solid #dcff00;
    padding: 12px 28px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 900;
    font-family: var(--font-cjk), "Microsoft YaHei", sans-serif;
    letter-spacing: 1px;
    box-shadow: 4px 4px 0 #000;
    /* 拦截/解锁提示可能很长，允许换行 */
    max-width: min(80vw, 900px);
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.35;

    .toast-star {
      color: #dcff00;
      font-size: 24px;
      flex: none;
    }
  }
}

.toast-anim-enter-active,
.toast-anim-leave-active {
  transition: all 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.3);
}

.toast-anim-enter-from {
  opacity: 0;
  transform: translate(-50%, -30px) scale(0.8) rotate(-5deg);
}

.toast-anim-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px) scale(0.9);
}
</style>
