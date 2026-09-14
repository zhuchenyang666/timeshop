import assert from 'node:assert/strict'
import test from 'node:test'
import { CATALOG, getPlanDialogue, PLAN_CUSTOMERS, PLAN_PRODUCTS, settleSale } from '../src/game.js'

const customer = { wants: 'cola' }
const cola = { id: 'cola', name: '可口可乐', price: 1, suggested: 1, stock: 1 }

test('B 模式只在点击顾客需要的有货商品时成交一件', () => {
  assert.equal(settleSale(cola, customer).units, 1)
  assert.equal(settleSale({ ...cola, price: 2 }, customer).revenue, 2)
  assert.equal(settleSale({ ...cola, id: 'tea' }, customer), null)
  assert.equal(settleSale({ ...cola, stock: 0 }, customer), null)
  assert.equal(settleSale(null, customer), null)
  assert.ok(CATALOG.length > 12)
  assert.ok(CATALOG.every((item) => Number.isInteger(item.cost) && Number.isInteger(item.suggested)))
  assert.ok(PLAN_PRODUCTS.every((item) => Number.isInteger(item.price)))
})

test('点击白布鞋后老板回应，顾客接话', () => {
  assert.deepEqual(getPlanDialogue(PLAN_PRODUCTS[0], PLAN_CUSTOMERS[0]), {
    owner: '本店没有运动鞋，只有白布鞋。',
    customer: '哎，那我去别家看看。',
  })
})
