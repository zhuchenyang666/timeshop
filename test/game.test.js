import assert from 'node:assert/strict'
import test from 'node:test'
import { CATALOG, getPlanDialogue, pickMarketProduct, pickPlanProducts, PLAN_CUSTOMERS, PLAN_POOL, settleSale } from '../src/game.js'

const customer = { wants: 'cola' }
const cola = { id: 'cola', name: '可口可乐', suggested: 1, stock: 1 }

test('B 模式只在点击顾客需要的有货商品时成交一件', () => {
  assert.equal(settleSale(cola, customer).units, 1)
  assert.equal(settleSale({ ...cola, suggested: 2 }, customer).revenue, 2)
  assert.equal(settleSale({ ...cola, id: 'tea' }, customer), null)
  assert.equal(settleSale({ ...cola, stock: 0 }, customer), null)
  assert.equal(settleSale(null, customer), null)
  assert.ok(CATALOG.length > 12)
  assert.ok(CATALOG.every((item) => Number.isInteger(item.cost) && Number.isInteger(item.suggested)))
})

test('A 模式货架从 14 种旧货池随机上架 12 种，价格均为整数', () => {
  assert.equal(PLAN_POOL.length, 14)
  assert.ok(PLAN_POOL.every((item) => Number.isInteger(item.price) && item.price > 0))
  for (let round = 0; round < 20; round += 1) {
    const shelf = pickPlanProducts()
    assert.equal(shelf.length, 12)
    assert.equal(new Set(shelf.map((item) => item.id)).size, 12)
  }
})

test('点击白布鞋后老板回应，顾客接话', () => {
  const clothShoes = PLAN_POOL.find((item) => item.id === 'cloth-shoes')
  assert.deepEqual(getPlanDialogue(clothShoes, PLAN_CUSTOMERS[0]), {
    owner: '运动鞋没有，白布鞋结实耐穿，4 元一双。',
    customer: '也行，先买一双应急。',
    sold: true,
    revenue: 4,
    matched: true,
  })
})

test('可接受的替代品降价成交，不相关的商品顾客拒绝购买', () => {
  const towel = PLAN_POOL.find((item) => item.id === 'towel')
  const substitute = getPlanDialogue(towel, PLAN_CUSTOMERS[1])
  assert.equal(substitute.sold, true)
  assert.equal(substitute.matched, false)
  assert.equal(substitute.revenue, 2)

  const thermos = PLAN_POOL.find((item) => item.id === 'thermos')
  const refuse = getPlanDialogue(thermos, PLAN_CUSTOMERS[0])
  assert.equal(refuse.sold, false)
  assert.equal(refuse.revenue, 0)
})

test('A 模式商品均来自 B 模式仓库，且定价比 B 建议零售价低 20%（向上取整）', () => {
  for (const planProduct of PLAN_POOL) {
    const source = CATALOG.find((item) => item.id === planProduct.id)
    assert.ok(source, planProduct.name + ' 应存在于 B 模式仓库')
    assert.equal(planProduct.price, Math.ceil(source.suggested * 0.8))
  }
})

test('陈旧商品仍会被顾客选择，但需求概率较低', () => {
  const samples = Array.from({length: 10000}, (_, index) => pickMarketProduct(() => (index + 0.5) / 10000))
  const vintageShare = samples.filter((product) => product.vintage).length / samples.length
  assert.equal(CATALOG.filter((product) => product.vintage).length, 4)
  assert.ok(vintageShare > 0)
  assert.ok(vintageShare < 0.1)
})
