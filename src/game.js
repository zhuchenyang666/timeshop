export const ROUND_SECONDS = 30

export const PLAN_PRODUCTS = [
  { id: 'cloth-shoes', name: '白布鞋', icon: '👟', price: 1.5 },
  { id: 'thermos', name: '老式暖水瓶', icon: '🫖', price: 2 },
  { id: 'shirt', name: '的确良衬衫', icon: '👔', price: 3 },
]

export const PLAN_CUSTOMERS = [
  {
    name: '小李',
    icon: '🧑',
    request: '老板，有没有运动鞋？',
    choice: 'cloth-shoes',
    reply: '本店没有运动鞋，只有白布鞋。',
    leave: '哎，那我去别家看看。',
  },
  {
    name: '王阿姨',
    icon: '👩',
    request: '有没有便宜点的布？',
    choice: 'shirt',
    reply: '本店不卖布料，只有成衣。',
    leave: '这里选择太少了。',
  },
]

export const CATALOG = [
  { id: 'sneakers', name: '运动鞋', icon: '👟', cost: 18, suggested: 30 },
  { id: 'flares', name: '喇叭裤', icon: '👖', cost: 12, suggested: 22 },
  { id: 'radio', name: '录音机', icon: '📻', cost: 45, suggested: 68 },
  { id: 'noodles', name: '方便面', icon: '🍜', cost: 0.4, suggested: 0.8 },
  { id: 'cola', name: '可口可乐', icon: '🥤', cost: 0.5, suggested: 1 },
  { id: 'dress', name: '花裙子', icon: '👗', cost: 15, suggested: 28 },
  { id: 'watch', name: '电子表', icon: '⌚', cost: 10, suggested: 18 },
  { id: 'shampoo', name: '洗发水', icon: '🧴', cost: 3, suggested: 6 },
  { id: 'thermos', name: '老式暖水瓶', icon: '🫖', cost: 2, suggested: 3 },
]

export const MARKET_CUSTOMERS = [
  { name: '小张', icon: '🧑', wants: 'sneakers', request: '老板，有运动鞋吗？' },
  { name: '小红', icon: '👧', wants: 'flares', request: '喇叭裤真好看，给我来一条！' },
  { name: '陈叔叔', icon: '👨', wants: 'radio', request: '这个录音机多少钱？' },
  { name: '小明', icon: '👦', wants: 'cola', request: '有冰凉的可口可乐吗？' },
  { name: '刘阿姨', icon: '👩', wants: 'dress', request: '我想试试新款花裙子。' },
  { name: '小刚', icon: '🧒', wants: 'watch', request: '有会响的电子表吗？' },
  { name: '赵大姐', icon: '👩', wants: 'shampoo', request: '洗发水给我拿一瓶。' },
  { name: '旅客', icon: '🧔', wants: 'noodles', request: '赶车来不及了，有方便面吗？' },
]

export function settleSale(shelfItem, customer) {
  if (!shelfItem || shelfItem.id !== customer.wants || shelfItem.stock < 1) {
    return { units: 0, revenue: 0, happiness: 0, message: '货架上没有想要的商品，顾客失望离开。' }
  }

  if (shelfItem.price > shelfItem.suggested * 1.2) {
    return { units: 0, revenue: 0, happiness: 0, message: '价格太高，顾客嫌贵转身走了。' }
  }

  const units = shelfItem.price <= shelfItem.suggested * 0.8 ? Math.min(2, shelfItem.stock) : 1
  return {
    units,
    revenue: units * shelfItem.price,
    happiness: 2,
    message: units === 2 ? '价格实惠，顾客一次买了两件！' : '价格合适，成交一单！',
  }
}
