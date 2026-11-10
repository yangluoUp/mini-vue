/**
 * 响应式系统的发动机：effect / track / trigger
 * 对照源码：vue-next/packages/reactivity/src/effect.ts
 *
 * 你要完成的任务 A / B 都在这个文件里，任务 C 在 computed.js / ref.js。
 * 每个 TODO 后面都写了测试编号，跑对应测试就知道有没有做对。
 */

/* ========================= 全局现场 ========================= */

// 当前正在执行的那个副作用。track 时要知道「是谁在读我」
let activeEffect = null

// 嵌套 effect 的现场恢复：外层 effect 执行到一半，内层 effect 跑完了要把 activeEffect 还原成外层
const effectStack = []

// 依赖表，结构：WeakMap<target, Map<key, Set<effect>>>
//   用 WeakMap 是为了 target 被回收时依赖表跟着回收，不造成内存泄漏
const targetMap = new WeakMap()

/* ========================= 副作用 ========================= */

export class ReactiveEffect {
  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler // 可选：用它接管「什么时候执行」，组件更新 / computed 都靠它
    this.active = true
    this.deps = [] // 我依赖了哪些 dep，cleanup / stop 时按这份清单去删
    this.running = false
  }

  run() {
    // ---------------------------------------------------------------
    // TODO(任务 B)：把这里补完（对应测试 B1 / B2 / D1）
    //
    // 现在这段是「能跑但不对」的版本：activeEffect 不会还原，旧依赖不会清理。
    // 补完需要做到三件事：
    //   1) 执行前先 cleanupEffect(this) —— 清掉上一轮留下的依赖。
    //      不清会出现什么？effect 里 `ok ? a : b`，ok 变 false 之后 a 变化仍然触发（测试 B2）
    //   2) 把 this 设为 activeEffect 并压栈；执行完（finally 里）出栈并把 activeEffect
    //      还原成外层 —— 不还原的话内层 effect 会把外层的依赖记到自己头上（测试 B1）
    //   3) 用 this.running 拦截「自己触发自己」—— effect 里修改自己依赖的数据会无限递归（测试 D1）
    //
    // 提示：用 try/finally，否则 fn 抛异常后 activeEffect 会一直挂着，后面的代码全算在那个 effect 头上。
    // 提示：this.active === false（已被 stop）时不要再登记依赖，直接执行 fn 即可。
    // ---------------------------------------------------------------
    activeEffect = this
    return this.fn()
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}

/** 创建并立即执行一次副作用；返回值可 .stop() */
export function effect(fn, options = {}) {
  const e = new ReactiveEffect(fn, options.scheduler)
  e.run()
  return e
}

/* ========================= 收集与触发 ========================= */

/**
 * 依赖收集：把「当前 activeEffect」登记到 target[key] 名下
 */
export function track(target, key) {
  // ---------------------------------------------------------------
  // TODO(任务 A-1)（对应测试 A2 / A4 / A5 / A6 / A7）
  //
  // 1) activeEffect 为空说明这次读取发生在 effect 外面，直接 return
  if (!activeEffect) return

  // 2) 按 target → key 逐层拿到（或创建）容器：
  //      targetMap: WeakMap<target, depsMap>
  //      depsMap:   Map<key, dep>
  //      dep:       Set<activeEffect>
  
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)
  if (!dep) {
    dep = new Set()
    depsMap.set(key, dep)
  }

  // 3) 把 activeEffect 加进 dep；如果 dep 里还没有它，
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep) // 还要 push 进 activeEffect.deps（cleanup 时靠它反查「我该从哪些 dep 里删掉」）
  }
  // 4) 重复读取同一个属性不要重复 push（否则 cleanup 会删多次、deps 数组也会膨胀）
  // ---------------------------------------------------------------
}

/**
 * 触发：把 target[key] 名下登记的 effect 全部执行
 */
export function trigger(target, key) {
  // ---------------------------------------------------------------
  // TODO(任务 A-2)（对应测试 A2 / C4）
  //
  // 1) 没登记过（没人在 effect 里读过这个 key）直接 return
  // 2) 取到 dep 后【复制一份】再遍历 —— 遍历过程中 effect 的 cleanup/重新 track 会改动这个 Set，
  //    直接遍历原 Set 会出现「漏跑」或死循环
  // 3) 跳过 e === activeEffect 的那一个（正在执行的 effect 不能被自己触发）
  // 4) 有 e.scheduler 就调 scheduler()（由它决定何时真正 run），否则直接 e.run()
  // ---------------------------------------------------------------
}

/** 把一个 effect 从它依赖过的所有 dep 里摘干净 */
function cleanupEffect(e) {
  // ---------------------------------------------------------------
  // TODO(任务 B 的配套)（对应测试 B2）
  // 遍历 e.deps，对每个 dep 执行 dep.delete(e)；最后把 e.deps 长度清零。
  // 不清空 deps 的话，下一轮 run 会把同样的 dep 再 push 一遍，越来越臃肿。
  // ---------------------------------------------------------------
}

/* ============ 给 computed.js / ref.js 用的底层能力（已实现，不用改） ============ */

/** 让 computed 在读取时把「当前 effect」收进自己的 dep，从而支持 effect(() => c.value) 链式响应 */
export function trackDep(dep) {
  if (!activeEffect) return
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

/** 让 computed / ref 在值变化时通知依赖自己的那些 effect */
export function triggerDepEffects(dep) {
  for (const e of [...dep]) {
    if (!e.active) continue
    if (e === activeEffect) continue
    if (e.scheduler) e.scheduler()
    else e.run()
  }
}
