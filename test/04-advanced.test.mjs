/**
 * 任务 D：两个「不加防护就炸」的场景（加分题，做完 A/B/C 再来）
 * 运行：npm run test:d
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive, effect, computed } from '../src/reactivity/index.js'

test('D1 effect 里修改自己依赖的数据，不会无限递归', () => {
  const s = reactive({ n: 0 })
  let runs = 0

  effect(() => {
    runs++
    s.n++
  })

  assert.equal(runs, 1, '自触发应被拦截（否则这里会栈溢出）')
  assert.equal(s.n, 1)
})

test('D2 computed 可以被 effect 依赖（链式响应）', () => {
  const s = reactive({ n: 1 })
  const double = computed(() => s.n * 2)
  const seen = []

  effect(() => {
    seen.push(double.value)
  })

  assert.deepEqual(seen, [2])

  s.n = 2
  assert.deepEqual(seen, [2, 4], 'computed 被读进 effect 后，源数据变化要能传导过去')
})
