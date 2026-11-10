/**
 * 任务 A：track / trigger —— 让 effect 能「读到时记住，变化时重跑」
 * 运行：npm run test:a
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive, effect } from '../src/reactivity/index.js'

test('A1 effect 创建后立即执行一次', () => {
  const s = reactive({ n: 0 })
  let runs = 0
  effect(() => {
    runs++
    s.n
  })
  assert.equal(runs, 1)
})

test('A2 读过的属性变化会重跑', () => {
  const s = reactive({ n: 0 })
  let runs = 0
  effect(() => {
    runs++
    s.n
  })

  s.n++
  assert.equal(runs, 2)

  s.n = 10
  assert.equal(runs, 3)
})

test('A3 没读过的属性变化不触发', () => {
  const s = reactive({ n: 0, other: 0 })
  let runs = 0
  effect(() => {
    runs++
    s.n
  })

  s.other++
  assert.equal(runs, 1, 'other 没被读过，不该触发')
})

test('A4 同一个 effect 重复读同一属性只登记一次', () => {
  const s = reactive({ n: 0 })
  let runs = 0
  effect(() => {
    runs++
    s.n
    s.n
    s.n
  })

  s.n++
  assert.equal(runs, 2, '重复读取不应该让 effect 被登记 3 次')
})

test('A5 新增属性也能触发（defineProperty 做不到）', () => {
  const s = reactive({})
  let runs = 0
  effect(() => {
    runs++
    s.foo
  })

  s.foo = 1
  assert.equal(runs, 2, 'Vue 2 需要 $set，Proxy 不需要')
})

test('A6 嵌套对象读取后自动变成响应式（懒代理）', () => {
  const s = reactive({ nested: { count: 0 } })
  let runs = 0
  effect(() => {
    runs++
    s.nested.count
  })

  s.nested.count++
  assert.equal(runs, 2)
})

test('A7 数组 push 会触发依赖 length 的 effect', () => {
  const list = reactive([])
  let runs = 0
  effect(() => {
    runs++
    list.length
  })

  list.push(1)
  assert.ok(runs >= 2, `push 之后 effect 应至少再跑一次，实际 runs=${runs}`)
})
