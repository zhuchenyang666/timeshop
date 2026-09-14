export const ROUND_SECONDS = 60

export const CATALOG = [
    {id: 'sneakers', name: '运动鞋', icon: '👟', cost: 18, suggested: 30},
    {id: 'flares', name: '喇叭裤', icon: '👖', cost: 12, suggested: 22},
    {id: 'radio', name: '录音机', icon: '📻', cost: 45, suggested: 68},
    {id: 'noodles', name: '方便面', icon: '🍜', cost: 1, suggested: 2},
    {id: 'cola', name: '可口可乐', icon: '🥤', cost: 1, suggested: 2},
    {id: 'dress', name: '花裙子', icon: '👗', cost: 15, suggested: 28},
    {id: 'watch', name: '电子表', icon: '⌚', cost: 10, suggested: 18},
    {id: 'shampoo', name: '洗发水', icon: '🧴', cost: 3, suggested: 6},
    {id: 'cloth-shoes', name: '白布鞋', icon: '👟', cost: 2, suggested: 5},
    {id: 'shirt', name: '衬衫', icon: '👔', cost: 4, suggested: 8},
    {id: 'towel', name: '毛巾', icon: '🧣', cost: 1, suggested: 4},
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

export const PLAN_PRICE_RATE = 0.8

function toPlanProduct(id) {
    const source = CATALOG.find((product) => product.id === id)
    return {
        id: source.id,
        name: source.name,
        icon: source.icon,
        price: Math.ceil(source.suggested * PLAN_PRICE_RATE),
    }
}

const PLAN_POOL_IDS = [
    'cloth-shoes', 'thermos', 'shirt', 'towel', 'enamel-basin', 'flashlight',
    'umbrella', 'windup-clock', 'mug', 'soap', 'biscuits', 'notebook',
    'kerosene-lamp', 'abacus',
]

export const PLAN_POOL = PLAN_POOL_IDS.map(toPlanProduct)

export function shuffle(list, random = Math.random) {
    const copy = [...list]
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
}

export function pickPlanProducts(random = Math.random) {
    return shuffle(PLAN_POOL, random).slice(0, 12)
}

export const PLAN_CUSTOMERS = [
    {
        name: '小李',
        icon: '🧑',
        want: '运动鞋',
        request: '老板，有没有运动鞋？',
        choice: 'cloth-shoes',
        accept: ['towel'],
        reply: '运动鞋没有，白布鞋结实耐穿，4 元一双。',
        leave: '也行，先买一双应急。',
    },
    {
        name: '王阿姨',
        icon: '👩',
        want: '便宜布料',
        request: '有没有便宜点的布？',
        choice: 'shirt',
        accept: ['towel'],
        reply: '布料没有，只有普通衬衫，7 元一件。',
        leave: '成衣也能穿，那我买一件。',
    },
    {
        name: '赵叔叔',
        icon: '👨',
        want: '新式保温杯',
        request: '有新式保温杯吗？',
        choice: 'thermos',
        accept: ['mug', 'enamel-basin'],
        reply: '新式保温杯没有，老式暖水瓶能保温，3 元。',
        leave: '样子老点也行，家里正缺一个。',
    },
    {
        name: '小明',
        icon: '👦',
        want: '彩色书包',
        request: '我想买彩色书包。',
        choice: 'notebook',
        accept: ['biscuits'],
        reply: '书包没有，笔记本还有，2 元一本。',
        leave: '那我先买本子吧。',
    },
    {
        name: '刘奶奶',
        icon: '👵',
        want: '洗发水',
        request: '有洗头发用的洗发水吗？',
        choice: 'soap',
        accept: ['towel'],
        reply: '洗发水没有，肥皂也能洗干净，2 元一块。',
        leave: '肥皂就肥皂吧，洗得干净就行。',
    },
    {
        name: '张阿姨',
        icon: '👩',
        want: '擦脸毛巾',
        request: '想买条擦脸的毛巾。',
        choice: 'towel',
        accept: ['soap'],
        reply: '毛巾有，4 元一条，吸水性好。',
        leave: '正好，来一条。',
    },
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
    if (product.id === customer.choice) {
        return {
            owner: customer.reply,
            customer: customer.leave,
            sold: true,
            revenue: product.price,
            matched: true,
        }
    }
    if ((customer.accept || []).includes(product.id)) {
        const revenue = Math.max(1, Math.ceil(product.price / 2))
        return {
            owner: '这里没有' + customer.want + '，' + product.name + '倒是有，' + revenue + ' 元拿走吧。',
            customer: '虽然不是最想要的，' + product.name + '也能凑合用，那就买一个吧。',
            sold: true,
            revenue: revenue,
            matched: false,
        }
    }
    return {
        owner: '不好意思，没有哈。',
        customer: '这不是我想要的东西，我去别家看看。',
        sold: false,
        revenue: 0,
        matched: false,
    }
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
