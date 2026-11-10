/**
 * 任务 B：嵌套 effect 的现场恢复 + 分支切换的依赖清理
 * 运行：npm run test:b
 *
 * 这两条是这个模块最容易「自认为写对了」的地方，也是面试最常追问的地方。
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive, effect } from '../src/reactivity/index.js'

test('B1 嵌套 effect：内层依赖变化不牵连外层', () => {
  const s = reactive({ a: 1, b: 2 })
  let outerRuns = 0
  let innerRuns = 0

  effect(() => {
    outerRuns++
    effect(() => {
      innerRuns++
      s.b
    })
    s.a
  })

  assert.equal(outerRuns, 1)
  assert.equal(innerRuns, 1)

  s.b++
  assert.equal(innerRuns, 2, 'b 变化，内层应重跑')
  assert.equal(outerRuns, 1, 'b 不是外层读的，外层不该被牵连')
})

test('B2 分支切换：切走的分支必须被清理', () => {
  const s = reactive({ ok: true, a: 1, b: 2 })
  let runs = 0

  effect(() => {
    runs++
    s.ok ? s.a : s.b
  })

  s.a++
  assert.equal(runs, 2)

  s.ok = false
  assert.equal(runs, 3, 'ok 变化应重跑')

  s.a++
  assert.equal(runs, 3, '已经切到 b 分支，a 的变化不该再触发（说明旧依赖没清理）')

  s.b++
  assert.equal(runs, 4, 'b 是当前分支的依赖，应触发')
})

test('B3 stop 之后不再响应', () => {
  const s = reactive({ n: 0 })
  let runs = 0

  const e = effect(() => {
    runs++
    s.n
  })

  assert.equal(runs, 1)
  e.stop()

  s.n++
  assert.equal(runs, 1, 'stop 之后不该再执行')
})
