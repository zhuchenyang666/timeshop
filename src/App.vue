<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  CATALOG,
  MARKET_CUSTOMERS,
  PLAN_CUSTOMERS,
  PLAN_PRODUCTS,
  ROUND_SECONDS,
  settleSale,
} from './game.js'

const phase = ref('intro')
const timeLeft = ref(ROUND_SECONDS)
const planCustomerIndex = ref(0)
const message = ref('')
const shelves = ref(Array(12).fill(null))
const currentCustomer = ref(MARKET_CUSTOMERS[0])
const customerIndex = ref(0)
const pwaState = ref(import.meta.env.DEV ? 'development' : navigator.onLine ? 'preparing' : 'offline')
const market = reactive({ revenue: 0, happiness: 0, customers: 0, sold: 0 })
let timer

const planCustomer = computed(() => PLAN_CUSTOMERS[planCustomerIndex.value])
const stars = computed(() => Math.max(1, Math.round((market.happiness / Math.max(1, market.customers * 2)) * 5)))
const marketComment = computed(() => stars.value >= 4
  ? '商品丰富，价格灵活，顾客盈门！'
  : '留意顾客需求和建议零售价，生意会更好。')

function startRound(nextPhase) {
  clearInterval(timer)
  phase.value = nextPhase
  timeLeft.value = ROUND_SECONDS
  message.value = ''
  if (nextPhase === 'plan') planCustomerIndex.value = 0
  if (nextPhase === 'market') {
    shelves.value = Array(12).fill(null)
    Object.assign(market, { revenue: 0, happiness: 0, customers: 0, sold: 0 })
    customerIndex.value = 0
    currentCustomer.value = MARKET_CUSTOMERS[0]
  }
  timer = setInterval(tick, 1000)
}

function tick() {
  timeLeft.value -= 1
  if (phase.value === 'plan' && timeLeft.value === 15) {
    planCustomerIndex.value = 1
    message.value = ''
  }
  if (phase.value === 'market' && timeLeft.value > 0 && timeLeft.value % 4 === 0) serveCustomer()
  if (timeLeft.value <= 0) {
    clearInterval(timer)
    phase.value = phase.value === 'plan' ? 'plan-result' : 'market-result'
  }
}

function answerPlanCustomer(product) {
  message.value = product.id === planCustomer.value.choice
    ? planCustomer.value.reply + ' ' + planCustomer.value.leave
    : product.name + '也不是顾客想要的商品。'
}

function placeProduct(productId, slot = shelves.value.findIndex((item) => item === null)) {
  const product = CATALOG.find((item) => item.id === productId)
  if (!product) return

  const existing = shelves.value.find((item) => item?.id === productId)
  if (existing) {
    existing.stock += 3
    message.value = product.name + '已补货3件。'
    return
  }
  if (slot < 0 || shelves.value[slot]) {
    message.value = '货架已满，先删除一件商品。'
    return
  }
  shelves.value[slot] = { ...product, price: product.suggested, stock: 3 }
  message.value = product.id === 'thermos'
    ? '暖水瓶已经过时了，可能没人买哦。'
    : product.name + '已上架，建议售价 ' + product.suggested + '元。'
}

function dropProduct(event, slot) {
  placeProduct(event.dataTransfer.getData('text/plain'), slot)
}

function removeProduct(slot) {
  shelves.value[slot] = null
}

function serveCustomer() {
  const customer = MARKET_CUSTOMERS[customerIndex.value % MARKET_CUSTOMERS.length]
  currentCustomer.value = customer
  customerIndex.value += 1
  market.customers += 1
  const item = shelves.value.find((entry) => entry?.id === customer.wants)
  const result = settleSale(item, customer)
  if (item) item.stock -= result.units
  market.revenue += result.revenue
  market.happiness += result.happiness
  market.sold += result.units
  message.value = result.message
}

function restart() {
  clearInterval(timer)
  phase.value = 'intro'
}

function updateConnection() {
  if (import.meta.env.DEV) return
  pwaState.value = navigator.onLine
    ? (navigator.serviceWorker?.controller ? 'ready' : 'preparing')
    : 'offline'
}

function markPwaReady() { pwaState.value = 'ready' }
function markPwaError() { pwaState.value = 'error' }

onMounted(() => {
  window.addEventListener('online', updateConnection)
  window.addEventListener('offline', updateConnection)
  window.addEventListener('pwa-ready', markPwaReady)
  window.addEventListener('pwa-error', markPwaError)
  navigator.serviceWorker?.ready.then(() => {
    pwaState.value = navigator.onLine ? 'ready' : 'offline'
  })
})

onBeforeUnmount(() => {
  clearInterval(timer)
  window.removeEventListener('online', updateConnection)
  window.removeEventListener('offline', updateConnection)
  window.removeEventListener('pwa-ready', markPwaReady)
  window.removeEventListener('pwa-error', markPwaError)
})
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">经济课堂互动游戏</p>
        <h1>时光小卖部</h1>
      </div>
      <div class="offline-badge" :class="pwaState">
        {{ pwaState === 'ready' ? '✓ 离线资源已准备' : pwaState === 'offline' ? '● 已离线，可正常游戏' : pwaState === 'error' ? '⚠ 缓存失败，请刷新' : pwaState === 'development' ? '开发模式 · 部署后启用离线' : '↓ 正在准备离线资源' }}
      </div>
    </header>

    <section v-if="phase === 'intro'" class="panel intro">
      <div class="store-illustration" aria-hidden="true">🏪</div>
      <p class="chapter">四人一组 · 经营实验</p>
      <h2>同样的 30 秒，两种不同的小卖部</h2>
      <p>先体验商品和价格固定的 A 店，再经营可以自由进货、定价的 B 店。</p>
      <button class="primary" @click="startRound('plan')">开始经营</button>
    </section>

    <template v-else-if="phase === 'plan'">
      <section class="game-heading">
        <div><span class="mode-tag">A 店 · 计划模式</span><h2>国营向阳小卖部</h2></div>
        <div class="timer">⏱ {{ timeLeft }} 秒</div>
      </section>
      <section class="customer-card">
        <span class="customer-icon">{{ planCustomer.icon }}</span>
        <div><strong>{{ planCustomer.name }}</strong><p>“{{ planCustomer.request }}”</p></div>
      </section>
      <section class="shelf-grid plan-shelves">
        <button v-for="product in PLAN_PRODUCTS" :key="product.id" class="shelf-item" @click="answerPlanCustomer(product)">
          <span class="lock">🔒</span><span class="product-icon">{{ product.icon }}</span>
          <strong>{{ product.name }}</strong><span>{{ product.price }} 元</span>
        </button>
      </section>
      <p class="message" aria-live="polite">{{ message || '点击货架上的商品回应顾客。' }}</p>
    </template>

    <section v-else-if="phase === 'plan-result'" class="panel result">
      <p class="chapter">A 店结算</p>
      <h2>今日营业额：0 元</h2>
      <div class="stars">⭐☆☆☆☆</div>
      <p>商品种类太少，无法满足顾客需求，库存积压。</p>
      <button class="primary" @click="startRound('market')">政策放开，进入 B 店</button>
    </section>

    <template v-else-if="phase === 'market'">
      <section class="game-heading">
        <div><span class="mode-tag">B 店 · 市场模式</span><h2>新时代自选商店</h2></div>
        <div class="score"><b>¥{{ market.revenue.toFixed(1) }}</b><span>⏱ {{ timeLeft }} 秒</span></div>
      </section>
      <section class="customer-card">
        <span class="customer-icon">{{ currentCustomer.icon }}</span>
        <div><strong>{{ currentCustomer.name }}</strong><p>“{{ currentCustomer.request }}”</p></div>
      </section>
      <p class="message" aria-live="polite">{{ message || '从下方选择商品上架，顾客每 4 秒进店一次。' }}</p>

      <section class="shelf-grid market-shelves" aria-label="货架">
        <div v-for="(item, index) in shelves" :key="index" class="shelf-slot" @dragover.prevent @drop.prevent="dropProduct($event, index)">
          <template v-if="item">
            <button class="remove" :aria-label="'下架' + item.name" @click="removeProduct(index)">×</button>
            <span class="product-icon">{{ item.icon }}</span><strong>{{ item.name }}</strong>
            <small>库存 {{ item.stock }}</small>
            <label>¥{{ Number(item.price).toFixed(1) }}<input v-model.number="item.price" type="range" :min="item.cost" :max="item.suggested * 1.6" step="0.5"></label>
            <small>建议 ¥{{ item.suggested }}</small>
          </template>
          <span v-else class="empty">+ 空货架</span>
        </div>
      </section>

      <section class="catalog">
        <div><h3>进货面板</h3><small>点击或拖入货架；再次点击可补货</small></div>
        <div class="catalog-list">
          <button v-for="product in CATALOG" :key="product.id" draggable="true" @dragstart="$event.dataTransfer.setData('text/plain', product.id)" @click="placeProduct(product.id)">
            <span>{{ product.icon }}</span><strong>{{ product.name }}</strong><small>建议 ¥{{ product.suggested }}</small>
          </button>
        </div>
      </section>
    </template>

    <section v-else class="panel result">
      <p class="chapter">B 店结算</p>
      <h2>今日营业额：{{ market.revenue.toFixed(1) }} 元</h2>
      <div class="stars">{{ '⭐'.repeat(stars) }}{{ '☆'.repeat(5 - stars) }}</div>
      <p>成交 {{ market.sold }} 件商品 · 接待 {{ market.customers }} 位顾客</p>
      <p>{{ marketComment }}</p>
      <div class="comparison"><span>A 店<br><b>0 元 · 1 星</b></span><span>B 店<br><b>{{ market.revenue.toFixed(1) }} 元 · {{ stars }} 星</b></span></div>
      <button class="primary" @click="restart">再玩一次</button>
    </section>
  </main>
</template>
