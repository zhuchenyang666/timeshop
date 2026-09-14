<script setup>
import {computed, onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import {
  CATALOG,
  MARKET_CUSTOMERS,
  PLAN_CUSTOMERS,
  PLAN_PRODUCTS,
  ROUND_SECONDS,
  getPlanDialogue,
  pickMarketProduct,
  settleSale,
} from './game.js'

const MARKET_ROUND_SECONDS = 60
const MIN_INITIAL_STOCK = 6
const MAX_RESTOCKS = 6
const RESTOCK_TIME_COST = 10
const PLAN_CUSTOMER_SWITCHES = [22, 14, 7]
const phase = ref('intro')
const timeLeft = ref(ROUND_SECONDS)
const planCustomerIndex = ref(0)
const message = ref('')
const customerFollowUp = ref('')
const planServed = ref([])
const shelves = ref(Array(12).fill(null))
const currentCustomer = ref(MARKET_CUSTOMERS[0])
const marketStage = ref('stocking')
const warehouseOpen = ref(false)
const missingProduct = ref(null)
const marketNotice = ref(null)
const vintageStockRequest = ref(null)
const restockCount = ref(0)
const customerServed = ref(false)
const isOnline = ref(navigator.onLine)
const plan = reactive({revenue: 0, sold: 0})
const market = reactive({revenue: 0, happiness: 0, customers: 0, sold: 0})
let timer
let nextCustomerTimer

const planCustomer = computed(() => PLAN_CUSTOMERS[planCustomerIndex.value])
const stars = computed(() => Math.max(1, Math.round((market.happiness / Math.max(1, market.customers * 2)) * 5)))
const marketComment = computed(() => stars.value >= 4
    ? '商品丰富，顾客盈门！'
    : '留意顾客需求和商品搭配，生意会更好。')
const restockBlockedReason = computed(() => {
  if (restockCount.value >= MAX_RESTOCKS) return `本局最多补货 ${MAX_RESTOCKS} 次，补货机会已经用完。`
  if (timeLeft.value < RESTOCK_TIME_COST) return '剩余时间不足 10 秒，来不及回仓库补货。'
  return ''
})

function clearGameTimers() {
  clearInterval(timer)
  clearTimeout(nextCustomerTimer)
}

function startRound(nextPhase) {
  clearGameTimers()
  phase.value = nextPhase
  timeLeft.value = nextPhase === 'market' ? MARKET_ROUND_SECONDS : ROUND_SECONDS
  message.value = ''
  customerFollowUp.value = ''
  missingProduct.value = null
  marketNotice.value = null
  vintageStockRequest.value = null
  if (nextPhase === 'plan') {
    planCustomerIndex.value = 0
    planServed.value = []
    Object.assign(plan, {revenue: 0, sold: 0})
  }
  if (nextPhase === 'market') {
    shelves.value = Array(12).fill(null)
    Object.assign(market, {revenue: 0, happiness: 0, customers: 0, sold: 0})
    marketStage.value = 'stocking'
    warehouseOpen.value = true
    restockCount.value = 0
    customerServed.value = false
    currentCustomer.value = {name: '顾客', icon: '🧑', request: '营业前先准备好要卖的商品吧。'}
    message.value = '最多上架 12 种商品，货架商品只有“有货”和“缺货”两种状态。'
  }
  if (nextPhase === 'plan') timer = setInterval(tick, 1000)
}

function tick() {
  timeLeft.value -= 1
  if (phase.value === 'plan' && PLAN_CUSTOMER_SWITCHES.includes(timeLeft.value)) {
    planCustomerIndex.value = Math.min(planCustomerIndex.value + 1, PLAN_CUSTOMERS.length - 1)
    message.value = ''
    customerFollowUp.value = ''
  }
  if (timeLeft.value <= 0) {
    clearGameTimers()
    phase.value = phase.value === 'plan' ? 'plan-result' : 'market-result'
  }
}

function answerPlanCustomer(product) {
  if (planServed.value.includes(planCustomerIndex.value)) return
  const dialogue = getPlanDialogue(product, planCustomer.value)
  message.value = dialogue.owner
  customerFollowUp.value = dialogue.customer
  if (dialogue.sold) {
    plan.revenue += dialogue.revenue
    plan.sold += 1
    planServed.value = [...planServed.value, planCustomerIndex.value]
  }
}

function placeProduct(productId, slot = shelves.value.findIndex((item) => item === null), confirmed = false) {
  if (!['stocking', 'restocking'].includes(marketStage.value)) return
  const product = CATALOG.find((item) => item.id === productId)
  if (!product) return
  const existing = shelves.value.find((item) => item?.id === productId)
  if (!existing && (slot < 0 || shelves.value[slot])) {
    message.value = '货架已满，先删除一件商品。'
    return
  }
  if (product.vintage && !confirmed) {
    vintageStockRequest.value = {product, slot}
    return
  }
  if (existing) {
    existing.stock = 1
    message.value = product.name + '已补货，现在有货。'
    return
  }
  shelves.value[slot] = {...product, stock: 1}
  message.value = product.name + '已上架，现在有货。'
}

function confirmVintageStock() {
  if (!vintageStockRequest.value) return
  const {product, slot} = vintageStockRequest.value
  vintageStockRequest.value = null
  placeProduct(product.id, slot, true)
}

function dropProduct(event, slot) {
  if (shelves.value[slot]) return
  placeProduct(event.dataTransfer.getData('application/x-time-shop-product'), slot)
}

function dragProduct(event, productId) {
  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData('application/x-time-shop-product', productId)
}

function removeProduct(slot) {
  if (!['stocking', 'restocking'].includes(marketStage.value)) return
  shelves.value[slot] = null
}

function confirmStocking() {
  const stockedCount = shelves.value.filter(Boolean).length
  if (marketStage.value === 'stocking' && stockedCount < MIN_INITIAL_STOCK) {
    marketNotice.value = {
      icon: '📦',
      title: '首次至少上架 6 件货物',
      text: `当前只上架了 ${stockedCount} 件，请再选择 ${MIN_INITIAL_STOCK - stockedCount} 件货物。`,
    }
    return
  }
  if (marketStage.value === 'restocking') {
    const item = shelves.value.find((entry) => entry?.id === currentCustomer.value.wants && entry.stock > 0)
    marketStage.value = 'selling'
    warehouseOpen.value = false
    customerServed.value = !item
    message.value = item
        ? '找到了，' + item.name + '已经补上，顾客还在等您。'
        : '还是没有顾客想要的货品，顾客失望离开，并建议老板下次记得进货。'
    timer = setInterval(tick, 1000)
    if (!item) scheduleNextCustomer()
    return
  }
  beginMarketSale()
}

function beginMarketSale() {
  marketStage.value = 'selling'
  warehouseOpen.value = false
  timeLeft.value = MARKET_ROUND_SECONDS
  nextMarketCustomer()
  if (marketStage.value === 'selling' && !missingProduct.value) timer = setInterval(tick, 1000)
}

function nextMarketCustomer() {
  const person = MARKET_CUSTOMERS[Math.floor(Math.random() * MARKET_CUSTOMERS.length)]
  const product = pickMarketProduct()
  const customer = {...person, wants: product.id, request: '老板，我想买' + product.name + '。'}
  currentCustomer.value = customer
  customerServed.value = false
  market.customers += 1
  const item = shelves.value.find((entry) => entry?.id === customer.wants)
  if (!item || item.stock < 1) {
    clearInterval(timer)
    missingProduct.value = product
    message.value = '本店暂时没有' + product.name + '。'
  } else {
    message.value = ''
  }
}

function goToWarehouse() {
  if (!missingProduct.value || restockBlockedReason.value) return
  const product = missingProduct.value
  missingProduct.value = null
  restockCount.value += 1
  timeLeft.value -= RESTOCK_TIME_COST
  marketStage.value = 'restocking'
  warehouseOpen.value = true
  message.value = '等我去查下仓库，看看能不能进到' + product.name + '。'
}

function skipRestock() {
  if (!missingProduct.value) return
  const product = missingProduct.value
  missingProduct.value = null
  customerServed.value = true
  message.value = '不好意思，' + product.name + '暂时没有，顾客失望离开了。'
  if (timeLeft.value > 0) timer = setInterval(tick, 1000)
  scheduleNextCustomer()
}

function scheduleNextCustomer() {
  clearTimeout(nextCustomerTimer)
  nextCustomerTimer = setTimeout(() => {
    if (phase.value === 'market' && marketStage.value === 'selling' && customerServed.value && timeLeft.value > 0 && !missingProduct.value) {
      nextMarketCustomer()
    }
  }, 1200)
}

function sellMarketProduct(item) {
  if (marketStage.value !== 'selling' || customerServed.value) return
  const result = settleSale(item, currentCustomer.value)
  if (!result) return
  item.stock -= 1
  market.revenue += result.revenue
  market.happiness += result.happiness
  market.sold += result.units
  message.value = result.message
  customerServed.value = true
  scheduleNextCustomer()
}

function restart() {
  clearGameTimers()
  warehouseOpen.value = false
  missingProduct.value = null
  marketNotice.value = null
  vintageStockRequest.value = null
  phase.value = 'intro'
}

function updateConnection() {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateConnection)
  window.addEventListener('offline', updateConnection)
})

onBeforeUnmount(() => {
  clearGameTimers()
  window.removeEventListener('online', updateConnection)
  window.removeEventListener('offline', updateConnection)
})
</script>

<template>
  <main class="app-shell" :class="{
    'landing-shell': phase === 'intro' || phase === 'mode-select',
    'market-shell': phase === 'market',
    'warehouse-open': phase === 'market' && marketStage !== 'selling' && warehouseOpen,
  }">
    <header v-if="phase !== 'intro' && phase !== 'mode-select'" class="topbar">
      <button v-if="phase === 'market'" class="home-button" @click="restart">← 返回首页</button>
      <div v-else class="topbar-brand"><span class="seal">时</span><strong>时光小卖部</strong></div>
      <div class="topbar-actions">
        <button v-if="phase === 'market'" class="warehouse-button" :class="{ active: warehouseOpen }"
                :disabled="marketStage === 'selling'" aria-controls="warehouse-drawer" :aria-expanded="warehouseOpen"
                @click="warehouseOpen = !warehouseOpen">
          {{ warehouseOpen ? '隐藏仓库货物' : '展开仓库货物' }}
        </button>
        <button v-else class="home-button" @click="restart">← 返回首页</button>
        <div class="offline-badge" :class="{ offline: !isOnline }" role="status" aria-live="polite">
          ● {{ isOnline ? '在线模式' : '离线模式' }}
        </div>
      </div>
    </header>

    <Transition name="warehouse-drawer">
      <aside v-if="phase === 'market' && marketStage !== 'selling' && warehouseOpen" id="warehouse-drawer"
             class="warehouse-drawer">
        <header>
          <div><h3>仓库货物</h3><small>货源不限，拖到空货架或点击上架</small></div>
          <button aria-label="隐藏仓库货物" @click="warehouseOpen = false">×</button>
        </header>
        <div class="catalog-list">
          <article v-for="product in CATALOG" :key="product.id" class="catalog-product" draggable="true"
                   @dragstart="dragProduct($event, product.id)">
            <span v-if="product.vintage" class="vintage-tag">陈旧</span>
            <span class="catalog-icon">{{ product.icon }}</span><strong>{{ product.name }}</strong>
            <small>售价 ¥{{ product.suggested }}</small>
            <button @click="placeProduct(product.id)">上架</button>
          </article>
        </div>
      </aside>
    </Transition>

    <Transition name="restock-dialog">
      <div v-if="phase === 'market' && missingProduct" class="restock-overlay">
        <section class="restock-modal" role="dialog" aria-modal="true" aria-labelledby="restock-title">
          <span class="restock-icon" aria-hidden="true">{{ missingProduct.icon }}</span>
          <p class="chapter">货架缺货</p>
          <h2 id="restock-title">{{ missingProduct.name }}不存在</h2>
          <p v-if="restockBlockedReason" class="restock-warning">{{ restockBlockedReason }}</p>
          <p v-else>顾客正在等待。回仓库补货将消耗 10 秒，本局还可补货 {{ MAX_RESTOCKS - restockCount }} 次。</p>
          <div class="restock-actions" :class="{ single: restockBlockedReason }">
            <button v-if="!restockBlockedReason" class="secondary" @click="skipRestock">暂不补货</button>
            <button v-if="!restockBlockedReason" class="primary" @click="goToWarehouse">回仓库补货</button>
            <button v-else class="primary" @click="skipRestock">知道了，继续营业</button>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="restock-dialog">
      <div v-if="phase === 'market' && marketNotice" class="restock-overlay notice-overlay">
        <section class="restock-modal" role="alertdialog" aria-modal="true" aria-labelledby="market-notice-title">
          <span class="restock-icon" aria-hidden="true">{{ marketNotice.icon }}</span>
          <p class="chapter">营业提醒</p>
          <h2 id="market-notice-title">{{ marketNotice.title }}</h2>
          <p>{{ marketNotice.text }}</p>
          <div class="restock-actions single">
            <button class="primary" @click="marketNotice = null">知道了</button>
          </div>
        </section>
      </div>
    </Transition>

    <Transition name="restock-dialog">
      <div v-if="phase === 'market' && vintageStockRequest" class="restock-overlay vintage-overlay">
        <section class="restock-modal" role="alertdialog" aria-modal="true" aria-labelledby="vintage-title">
          <span class="restock-icon" aria-hidden="true">{{ vintageStockRequest.product.icon }}</span>
          <p class="chapter">上架确认</p>
          <h2 id="vintage-title">{{ vintageStockRequest.product.name }}</h2>
          <p>所选商品比较陈旧，确定需要上架吗？</p>
          <div class="restock-actions">
            <button class="secondary" @click="vintageStockRequest = null">换一种商品</button>
            <button class="primary" @click="confirmVintageStock">确定上架</button>
          </div>
        </section>
      </div>
    </Transition>

    <section v-if="phase === 'intro' || phase === 'mode-select'" class="landing">
      <header class="landing-nav">
        <div><span class="seal">时</span><strong>时光小卖部</strong></div>
        <div class="landing-meta">
          <span class="offline-badge" :class="{ offline: !isOnline }" role="status" aria-live="polite">
            ● {{ isOnline ? '在线模式' : '离线模式' }}
          </span>
        </div>
      </header>
      <div class="landing-content">
        <div class="landing-copy">
          <p class="chapter">一九八〇年代 · 经营实验</p>
          <h2>一间小卖部<br><em>两种经营方式</em></h2>
          <p class="landing-lead">亲手经营一家小卖部，看看计划与市场会带来怎样不同的结果。</p>
          <div class="landing-task">
            <span class="task-badge">任务</span>
            <div><strong>你的任务</strong><span>亲手尝试两种营业方式，看看会有什么样的收入变化。</span></div>
          </div>
          <div class="landing-facts">
            <span><b>30/60</b> 秒一局</span><span><b>2</b> 种模式</span>
          </div>
          <button class="primary start-business" @click="phase = 'mode-select'">领取营业执照 · 开始营业 <span>→</span>
          </button>
        </div>
        <div class="shop-poster" aria-hidden="true">
          <div class="sun"></div>
          <div class="poster-sign"><small>国营 · 自选</small><strong>时光小卖部</strong></div>
          <div class="shop-window">
            <img src="/product-shoe.svg" alt="白布鞋">
            <img src="/product-shirt.svg" alt="衬衫">
            <img src="/product-goods.svg" alt="日用百货">
          </div>
          <div class="poster-slogan">货真价实 · 顾客至上</div>
        </div>
      </div>
      <footer class="landing-footer"><strong>时光小卖部</strong><span>·</span><span>经济经营体验</span></footer>

      <Transition name="mode-dialog">
        <div v-if="phase === 'mode-select'" class="mode-overlay">
          <section class="mode-picker" role="dialog" aria-modal="true" aria-labelledby="mode-title">
            <button class="mode-close" aria-label="返回首页" @click="phase = 'intro'">×</button>
            <p class="chapter">营业执照已领取</p>
            <h2 id="mode-title">请选择你的游戏模式</h2>
            <p class="mode-intro">选择要体验的经营制度，观察不同规则下的商品、需求与收益。</p>
            <div class="mode-options">
              <button class="mode-card plan-card" @click="startRound('plan')">
                <small>计划经济时期</small><strong>A 计划模式</strong><b>商品固定，价格统一</b>
                <span class="mode-rule">🔒 12 种固定旧商品 · 30 秒</span>
                <p>货架更满了，但商品偏旧，顾客常常只能将就选择。</p>
                <span class="mode-enter"><span>进入 A 计划模式</span><span>→</span></span>
              </button>
              <span class="versus" aria-hidden="true">VS</span>
              <button class="mode-card market-card" @click="startRound('market')">
                <small>市场经济时期</small><strong>B 市场模式</strong><b>自由进货，按售价出售</b>
                <span class="mode-rule">＋ 20 种商品可选择 · 60 秒</span>
                <p>观察顾客需求，选择合适商品，争取更好的营业收益。</p>
                <span class="mode-enter"><span>进入 B 市场模式</span><span>→</span></span>
              </button>
            </div>
            <p class="mode-tip">● 选择后将直接进入对应模式</p>
          </section>
        </div>
      </Transition>
    </section>

    <template v-else-if="phase === 'plan'">
      <section class="game-heading">
        <div><span class="mode-tag">A 店 · 计划模式</span>
          <h2>国营向阳小卖部</h2></div>
        <div class="score"><b>¥{{ plan.revenue }}</b><span>⏱ {{ timeLeft }} 秒</span></div>
      </section>
      <section class="dialogue-stage" aria-label="顾客与老板的对话">
        <div class="speaker customer-speaker">
          <span class="customer-icon" aria-hidden="true">{{ planCustomer.icon }}</span>
          <strong>{{ planCustomer.name }}</strong>
          <p class="speech customer-speech">“{{ planCustomer.request }}”</p>
          <p class="speech customer-speech follow-up" :class="{ placeholder: !customerFollowUp }">“{{
              customerFollowUp
            }}”</p>
        </div>
        <div class="speaker owner-speaker">
          <p :key="message" class="speech owner-speech" :class="{ placeholder: !message }">“{{ message }}”</p>
          <span class="owner-icon" aria-hidden="true">🧑‍💼</span>
          <strong>老板</strong>
        </div>
      </section>
      <section class="shelf-grid plan-shelves">
        <button v-for="product in PLAN_PRODUCTS" :key="product.id" class="shelf-item"
                @click="answerPlanCustomer(product)">
          <span class="lock">🔒</span><span class="product-icon"
                                           :class="{ 'white-cloth-shoe': product.id === 'cloth-shoes' }">{{
            product.icon
          }}</span>
          <strong>{{ product.name }}</strong><span>{{ product.price }} 元</span>
        </button>
      </section>
      <p class="message" aria-live="polite">{{ message ? '老板已经回应顾客。' : '点击货架上的商品，让老板回应顾客。' }}</p>
    </template>

    <section v-else-if="phase === 'plan-result'" class="panel result">
      <p class="chapter">A 店结算</p>
      <h2>今日营业额：{{ plan.revenue }} 元</h2>
      <div class="stars">{{ plan.revenue > 0 ? '⭐⭐☆☆☆' : '⭐☆☆☆☆' }}</div>
      <p>卖出 {{ plan.sold }} 件商品。商品种类虽然增加了，但很多旧货仍不完全符合顾客期待。</p>
      <button class="primary" @click="restart">回到首页</button>
    </section>

    <template v-else-if="phase === 'market'">
      <section class="game-heading">
        <div><span class="mode-tag">B 店 · 市场模式</span>
          <h2>新时代自选商店</h2></div>
        <div class="score"><b>¥{{
            market.revenue
          }}</b><span>{{
            marketStage === 'selling' ? `⏱ ${timeLeft} 秒` : marketStage === 'restocking' ? `⏸ ${timeLeft} 秒` : '营业前备货'
          }}</span></div>
      </section>
      <section v-if="marketStage === 'selling'" class="dialogue-stage market-dialogue" aria-label="顾客与老板的对话">
        <div class="speaker customer-speaker">
          <span class="customer-icon" aria-hidden="true">{{ currentCustomer.icon }}</span>
          <strong>{{ currentCustomer.name }}</strong>
          <p class="speech customer-speech">“{{ currentCustomer.request }}”</p>
        </div>
        <div class="speaker owner-speaker">
          <p :key="message" class="speech owner-speech" :class="{ placeholder: !message }">“{{ message }}”</p>
          <span class="owner-icon" aria-hidden="true">🧑‍💼</span>
          <strong>老板</strong>
        </div>
      </section>
      <section v-else class="warehouse-intro">
        <span aria-hidden="true">📦</span>
        <div>
          <h3>{{ marketStage === 'restocking' ? '老板去仓库补货' : '营业前货物准备' }}</h3>
          <p v-if="marketStage === 'restocking'"><strong>老板：</strong>“等我去查下仓库进货。”
            顾客正在等待“{{ currentCustomer.request }}”，倒计时已暂停。</p>
          <p v-else>移动到空货架上松开鼠标。</p>
        </div>
      </section>
      <div class="market-controls">
        <span>已上架 {{ shelves.filter(Boolean).length }} / 12 种商品</span>
        <span v-if="marketStage !== 'selling'">{{ message }}<template v-if="marketStage === 'restocking'">（补货 {{ restockCount }} / {{ MAX_RESTOCKS }} 次）</template></span>
        <button v-if="marketStage !== 'selling'" class="primary" @click="confirmStocking">
          {{ marketStage === 'restocking' ? '补货完成 · 返回售卖' : '准备完成 · 开始售卖' }}
        </button>
        <span v-else>当前顾客结束后才会接待下一位，请点击正确商品完成售卖。</span>
      </div>

      <section class="shelf-grid market-shelves" aria-label="货架">
        <div v-for="(item, index) in shelves" :key="index" class="shelf-slot"
             :class="{ 'sold-out': item && item.stock === 0 }"
             @dragover.prevent @drop.prevent="dropProduct($event, index)">
          <template v-if="item">
            <button v-if="marketStage !== 'selling'" class="remove" :aria-label="'下架' + item.name"
                    @click="removeProduct(index)">×
            </button>
            <button class="stock-product" :disabled="marketStage !== 'selling' || item.stock === 0"
                    @click="sellMarketProduct(item)">
              <span class="product-icon">{{ item.icon }}</span><strong>{{ item.name }}</strong>
              <small>{{ item.stock > 0 ? (item.vintage ? '陈旧 · 有货' : '有货') : '缺货' }}</small>
            </button>
            <span class="shelf-price">售价 ¥{{ item.suggested }}</span>
          </template>
          <span v-else class="empty">+ 空货架</span>
        </div>
      </section>

    </template>

    <section v-else class="panel result">
      <p class="chapter">B 店结算</p>
      <h2>今日营业额：{{ market.revenue }} 元</h2>
      <div class="stars">{{ '⭐'.repeat(stars) }}{{ '☆'.repeat(5 - stars) }}</div>
      <p>成交 {{ market.sold }} 件商品 · 接待 {{ market.customers }} 位顾客</p>
      <p>{{ marketComment }}</p>
      <div class="comparison"><span>A 店<br><b>0 元 · 1 星</b></span><span>B 店<br><b>{{ market.revenue }} 元 · {{
          stars
        }} 星</b></span></div>
      <button class="primary" @click="restart">再玩一次</button>
    </section>
  </main>
</template>
