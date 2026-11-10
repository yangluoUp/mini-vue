/**
 * 任务 C：computed 的懒 + 缓存 + scheduler，以及 ref
 * 运行：npm run test:c
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reactive, effect, computed, ref } from '../src/reactivity/index.js'

test('C1 computed 是懒的：不读就不算', () => {
  const s = reactive({ n: 1 })
  let calc = 0

  const double = computed(() => {
    calc++
    return s.n * 2
  })

  assert.equal(calc, 0, '创建 computed 时不该执行 getter')
  assert.equal(double.value, 2)
  assert.equal(calc, 1)
})

test('C2 computed 有缓存：依赖不变不重算', () => {
  const s = reactive({ n: 1 })
  let calc = 0
  const double = computed(() => {
    calc++
    return s.n * 2
  })

  assert.equal(double.value, 2)
  assert.equal(double.value, 2)
  assert.equal(double.value, 2)
  assert.equal(calc, 1, '多次读取应命中缓存')
})

test('C3 依赖变了但没人读，仍然不重算', () => {
  const s = reactive({ n: 1 })
  let calc = 0
  const double = computed(() => {
    calc++
    return s.n * 2
  })

  assert.equal(double.value, 2)
  s.n = 2
  assert.equal(calc, 1, '依赖变化只应该「标脏」，不该立刻重算')

  assert.equal(double.value, 4)
  assert.equal(calc, 2, '读取时才重算一次')
})

test('C4 scheduler 接管副作用的执行时机', () => {
  const s = reactive({ n: 1 })
  const log = []

  effect(
    () => {
      log.push('run:' + s.n)
    },
    { scheduler: () => log.push('sched') }
  )

  s.n = 2
  assert.deepEqual(log, ['run:1', 'sched'], 'scheduler 存在时不应直接重跑 fn')
})

test('C5 ref 包原始值也能响应', () => {
  const n = ref(0)
  let runs = 0

  effect(() => {
    runs++
    n.value
  })

  n.value++
  assert.equal(runs, 2)
  assert.equal(n.value, 1)
})

test('C6 ref 相同值赋值不重复触发', () => {
  const n = ref(1)
  let runs = 0

  effect(() => {
    runs++
    n.value
  })

  n.value = 1
  assert.equal(runs, 1, '值没变就不该触发')
})
