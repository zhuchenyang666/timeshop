import assert from 'node:assert/strict'
import test from 'node:test'
import { settleSale } from '../src/game.js'

const customer = { wants: 'cola' }
const cola = { id: 'cola', price: 1, suggested: 1, stock: 3 }

test('市场价格会改变成交结果', () => {
  assert.equal(settleSale(cola, customer).units, 1)
  assert.equal(settleSale({ ...cola, price: 2 }, customer).units, 0)
  assert.equal(settleSale({ ...cola, price: 0.5 }, customer).units, 2)
  assert.equal(settleSale(null, customer).revenue, 0)
})
