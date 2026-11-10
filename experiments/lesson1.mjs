/**
 * 第 1 课 · 观察实验（不需要做完任务就能跑）
 *
 * 用的是参考实现，你只观察行为，不用看它内部怎么写。
 * 运行：node frontend-deep-dive/mini-vue/experiments/lesson1.mjs
 */
import { reactive, effect, computed } from '../solution/reactivity.mjs'

const line = (t) => console.log('\n' + '─'.repeat(8) + ' ' + t + ' ' + '─'.repeat(8))

/* ============ 实验 1：解构到底丢了什么 ============ */
line('实验 1：解构丢失 vs 三种修法')

const state = reactive({ n: 1 })

// ① 直接解构 —— 丢
let a2 = state.n
const { n } = state
let runsA = 0
effect(() => {
  runsA++
  n // 读的是普通变量，Proxy 根本没被访问
})
state.n = 2
console.log('① 直接解构：effect 跑', runsA, '次（期望 2 才算响应，实际 1 = 丢了）')

// ② 不解构 —— 正常
let runsB = 0
effect(() => {
  runsB++
  state.n
})
state.n = 3
console.log('② 不解构：    effect 跑', runsB, '次（1 → 2，正常）')

// ③ computed 修法
let runsC = 0
const nC = computed(() => state.n)
effect(() => {
  runsC++
  nC.value
})
state.n = 4
console.log('③ computed：  effect 跑', runsC, '次，值 =', nC.value)

// ④ toRefs 修法（手写 6 行，本质上就是"把属性访问包成 getter"）
function toRefs(obj) {
  const ret = {}
  for (const k of Object.keys(obj)) {
    ret[k] = { get value() { return obj[k] }, set value(v) { obj[k] = v } }
  }
  return ret
}
const refs = toRefs(state)
let runsD = 0
effect(() => {
  runsD++
  refs.n.value // 每次读都回到 obj['n']，所以能 track 到
})
state.n = 5
console.log('④ toRefs：    effect 跑', runsD, '次，值 =', refs.n.value)

// ⑤ 边界：解构出来的是对象，改它的属性还响应吗？
line('实验 1 补充：解构对象不等于丢响应')
const objState = reactive({ nested: { count: 0 } })
const { nested } = objState // nested 是 Proxy 返回的代理对象
let runsE = 0
effect(() => {
  runsE++
  nested.count
})
nested.count++
console.log('解构出 nested 再改 .count：effect 跑', runsE, '次（对象仍是代理，所以响应）')
objState.nested = { count: 100 } // 但整体替换属性，靠 nested 这个旧引用就感知不到
console.log('整体替换 objState.nested 之后，旧引用 nested.count =', nested.count, '（还是代理，但不指向新值）')

/* ============ 实验 2：computed 什么时候重算 ============ */
line('实验 2：computed 的懒与缓存')

const s2 = reactive({ x: 1 })
let calc = 0
const double = computed(() => {
  calc++
  return s2.x * 2
})

console.log('创建后 calc =', calc, '（0：没读就没算）')
console.log('读第一次 value =', double.value, '，calc =', calc)
console.log('读第二次 value =', double.value, '，calc =', calc, '（命中缓存）')

s2.x = 2
console.log('改数据后立刻看 calc =', calc, '（没变：只是标脏，还没人读）')
console.log('再读 value =', double.value, '，calc =', calc, '（这时才重算一次）')

s2.x = 3
s2.x = 4
s2.x = 5
console.log('连续改 3 次后再读 value =', double.value, '，calc =', calc, '（合并成 1 次计算）')

/* ============ 实验 3：遍历中修改 Set 会怎样 ============ */
line('实验 3：边遍历边删/加，dep 会怎样')

function walk(name, mutate) {
  const dep = new Set(['a', 'b', 'c', 'd'])
  const seen = []
  let guard = 0
  for (const item of dep) {
    if (++guard > 20) { seen.push('<死循环保护触发>'); break }
    seen.push(item)
    mutate(dep, item)
  }
  console.log(name, '→ 实际遍历到：', seen.join(', '), '| 结束后剩余：', [...dep].join(', '))
}

walk('删除【当前】元素', (d, it) => d.delete(it))
walk('删除【后面】元素', (d, it) => { if (it === 'b') d.delete('c') })
walk('遍历时【新增】元素', (d, it) => { if (it === 'a') d.add('e') })

console.log('\n结论：dep 在遍历过程中被 effect 的 cleanup/重新 track 修改时，')
console.log('      遍历结果不可预期 —— 所以 trigger 里要先 [...dep] 复制一份。')
