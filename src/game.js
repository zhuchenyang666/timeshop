export const ROUND_SECONDS = 30

export const PLAN_PRODUCTS = [
    {id: 'cloth-shoes', name: '白布鞋', icon: '👟', price: 2},
    {id: 'thermos', name: '老式暖水瓶', icon: '🫖', price: 2},
    {id: 'shirt', name: '衬衫', icon: '👔', price: 3},
    {id: 'enamel-mug', name: '搪瓷杯', icon: '☕', price: 1},
    {id: 'soap', name: '肥皂', icon: '🧼', price: 1},
    {id: 'biscuits', name: '饼干', icon: '🍪', price: 1},
    {id: 'notebook', name: '笔记本', icon: '📒', price: 1},
    {id: 'flashlight', name: '手电筒', icon: '🔦', price: 4},
    {id: 'towel', name: '毛巾', icon: '🧣', price: 2},
    {id: 'enamel-basin', name: '搪瓷盆', icon: '🥣', price: 2},
    {id: 'umbrella', name: '旧雨伞', icon: '☂️', price: 5},
    {id: 'needle-kit', name: '针线包', icon: '🧵', price: 1},
]

export const PLAN_CUSTOMERS = [
    {
        name: '小李',
        icon: '🧑',
        request: '老板，有没有运动鞋？',
        choice: 'cloth-shoes',
        reply: '运动鞋没有，白布鞋结实耐穿，2 元一双。',
        leave: '也行，先买一双应急。',
    },
    {
        name: '王阿姨',
        icon: '👩',
        request: '有没有便宜点的布？',
        choice: 'shirt',
        reply: '布料没有，只有普通衬衫，3 元一件。',
        leave: '成衣也能穿，那我买一件。',
    },
    {
        name: '赵叔叔',
        icon: '👨',
        request: '有新式保温杯吗？',
        choice: 'thermos',
        reply: '新式保温杯没有，老式暖水瓶能保温，2 元。',
        leave: '样子老点也行，家里正缺一个。',
    },
    {
        name: '小明',
        icon: '👦',
        request: '我想买彩色书包。',
        choice: 'notebook',
        reply: '书包没有，笔记本还有，1 元一本。',
        leave: '那我先买本子吧。',
    },
]

export const CATALOG = [
    {id: 'sneakers', name: '运动鞋', icon: '👟', cost: 18, suggested: 30},
    {id: 'flares', name: '喇叭裤', icon: '👖', cost: 12, suggested: 22},
    {id: 'radio', name: '录音机', icon: '📻', cost: 45, suggested: 68},
    {id: 'noodles', name: '方便面', icon: '🍜', cost: 1, suggested: 2},
    {id: 'cola', name: '可口可乐', icon: '🥤', cost: 1, suggested: 2},
    {id: 'dress', name: '花裙子', icon: '👗', cost: 15, suggested: 28},
    {id: 'watch', name: '电子表', icon: '⌚', cost: 10, suggested: 18},
    {id: 'shampoo', name: '洗发水', icon: '🧴', cost: 3, suggested: 6},
    {id: 'thermos', name: '老式暖水瓶', icon: '🫖', cost: 2, suggested: 3},
    {id: 'mug', name: '搪瓷杯', icon: '☕', cost: 1, suggested: 2},
    {id: 'biscuits', name: '饼干', icon: '🍪', cost: 1, suggested: 2},
    {id: 'soap', name: '肥皂', icon: '🧼', cost: 1, suggested: 2},
    {id: 'flashlight', name: '手电筒', icon: '🔦', cost: 4, suggested: 8},
    {id: 'umbrella', name: '雨伞', icon: '☂️', cost: 5, suggested: 10},
    {id: 'toy-car', name: '玩具汽车', icon: '🚗', cost: 6, suggested: 12},
    {id: 'notebook', name: '笔记本', icon: '📒', cost: 1, suggested: 2},
    {id: 'kerosene-lamp', name: '煤油灯', icon: '🪔', cost: 3, suggested: 6, vintage: true},
    {id: 'abacus', name: '老式算盘', icon: '🧮', cost: 5, suggested: 10, vintage: true},
    {id: 'windup-clock', name: '发条闹钟', icon: '⏰', cost: 8, suggested: 15, vintage: true},
    {id: 'enamel-basin', name: '搪瓷脸盆', icon: '🥣', cost: 2, suggested: 4, vintage: true},
]

export function pickMarketProduct(random = Math.random) {
    const totalWeight = CATALOG.reduce((total, product) => total + (product.vintage ? 1 : 4), 0)
    let position = Math.min(Math.max(random(), 0), 0.999999) * totalWeight
    for (const product of CATALOG) {
        position -= product.vintage ? 1 : 4
        if (position < 0) return product
    }
    return CATALOG[CATALOG.length - 1]
}

export const MARKET_CUSTOMERS = [
    {name: '小张', icon: '🧑', wants: 'sneakers', request: '老板，有运动鞋吗？'},
    {name: '小红', icon: '👧', wants: 'flares', request: '喇叭裤真好看，给我来一条！'},
    {name: '陈叔叔', icon: '👨', wants: 'radio', request: '这个录音机多少钱？'},
    {name: '小明', icon: '👦', wants: 'cola', request: '有冰凉的可口可乐吗？'},
    {name: '刘阿姨', icon: '👩', wants: 'dress', request: '我想试试新款花裙子。'},
    {name: '小刚', icon: '🧒', wants: 'watch', request: '有会响的电子表吗？'},
    {name: '赵大姐', icon: '👩', wants: 'shampoo', request: '洗发水给我拿一瓶。'},
    {name: '旅客', icon: '🧔', wants: 'noodles', request: '赶车来不及了，有方便面吗？'},
]

export function getPlanDialogue(product, customer) {
    const isWanted = product.id === customer.choice
    return isWanted
        ? {owner: customer.reply, customer: customer.leave, sold: true, revenue: product.price}
        : {owner: '这里只有' + product.name + '。', customer: '这不是我想要的商品。', sold: false, revenue: 0}
}

export function settleSale(shelfItem, customer) {
    if (!shelfItem || shelfItem.id !== customer.wants || shelfItem.stock < 1) return null
    return {
        units: 1,
        revenue: shelfItem.suggested,
        happiness: 2,
        message: '好的，' + shelfItem.name + '卖给您一件。',
    }
}
