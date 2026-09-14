import assert from 'node:assert/strict'
import test from 'node:test'
import { CATALOG, getPlanDialogue, pickMarketProduct, PLAN_CUSTOMERS, PLAN_PRODUCTS, settleSale } from '../src/game.js'

const customer = { wants: 'cola' }
const cola = { id: 'cola', name: '可口可乐', suggested: 1, stock: 1 }

test('B 模式只在点击顾客需要的有货商品时成交一件', () => {
  assert.equal(settleSale(cola, customer).units, 1)
  assert.equal(settleSale({ ...cola, suggested: 2 }, customer).revenue, 2)
  assert.equal(settleSale({ ...cola, id: 'tea' }, customer), null)
  assert.equal(settleSale({ ...cola, stock: 0 }, customer), null)
  assert.equal(settleSale(null, customer), null)
  assert.ok(CATALOG.length > 12)
  assert.equal(PLAN_PRODUCTS.length, 12)
  assert.ok(CATALOG.every((item) => Number.isInteger(item.cost) && Number.isInteger(item.suggested)))
  assert.ok(PLAN_PRODUCTS.every((item) => Number.isInteger(item.price)))
})

test('点击白布鞋后老板回应，顾客接话', () => {
  assert.deepEqual(getPlanDialogue(PLAN_PRODUCTS[0], PLAN_CUSTOMERS[0]), {
    owner: '运动鞋没有，白布鞋结实耐穿，2 元一双。',
    customer: '也行，先买一双应急。',
    sold: true,
    revenue: 2,
  })
  assert.equal(getPlanDialogue(PLAN_PRODUCTS[1], PLAN_CUSTOMERS[0]).sold, false)
})

test('陈旧商品仍会被顾客选择，但需求概率较低', () => {
  const samples = Array.from({length: 10000}, (_, index) => pickMarketProduct(() => (index + 0.5) / 10000))
  const vintageShare = samples.filter((product) => product.vintage).length / samples.length
  assert.equal(CATALOG.filter((product) => product.vintage).length, 4)
  assert.ok(vintageShare > 0)
  assert.ok(vintageShare < 0.1)
})
