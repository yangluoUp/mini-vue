/**
 * 参考实现（先自己做完 A/B/C 再打开）
 * 用法：把这份文件的实现抄进 src/reactivity/*.js，或直接对照你写的找差异。
 *
 * 与真实 Vue 的简化点（面试时要能说出来）：
 *  1) effect() 直接返回 ReactiveEffect 实例，Vue 返回的是 runner 函数（可手动调用执行）
 *  2) 没有实现 dep 的版本号 / 双向依赖，所以 computed 的 dirty 用标志位就够
 *  3) 没有 shallowReactive / readonly / 数组专有方法拦截（Vue 里 push 会触发两次以上）
 *  4) 没有 effectScope（批量 stop 的容器）
 */

let activeEffect = null
const effectStack = []
const targetMap = new WeakMap()

const isObject = (v) => v !== null && typeof v === 'object'
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
const isIntegerKey = (k) => typeof k === 'string' && /^\d+$/.test(k)

/* ---------------------------- effect ---------------------------- */

export class ReactiveEffect {
  constructor(fn, scheduler) {
    this.fn = fn
    this.scheduler = scheduler
    this.active = true
    this.deps = []
    this.running = false
  }

  run() {
    // 已 stop：不再参与依赖收集，但仍可以手动跑
    if (!this.active) return this.fn()
    // 防自触发递归
    if (this.running) return

    const prev = activeEffect
    try {
      this.running = true
      activeEffect = this
      effectStack.push(this)
      // 关键：执行前清空旧依赖，否则分支切换后旧属性仍然绑着这个 effect
      cleanupEffect(this)
      return this.fn()
    } finally {
      effectStack.pop()
      activeEffect = prev
      this.running = false
    }
  }

  stop() {
    if (this.active) {
      cleanupEffect(this)
      this.active = false
    }
  }
}

function cleanupEffect(e) {
  for (const dep of e.deps) dep.delete(e)
  e.deps.length = 0
}

export function effect(fn, options = {}) {
  const e = new ReactiveEffect(fn, options.scheduler)
  e.run()
  return e
}

/* ---------------------------- track / trigger ---------------------------- */

export function track(target, key) {
  if (!activeEffect) return

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

  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return

  const dep = depsMap.get(key)
  if (!dep) return

  // 复制一份：遍历过程中 cleanup / 重新 track 会改动这个 Set
  for (const e of [...dep]) {
    if (!e.active) continue
    if (e === activeEffect) continue
    if (e.scheduler) e.scheduler()
    else e.run()
  }
}

/* ---------------------------- reactive ---------------------------- */

const mutableHandlers = {
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    return isObject(res) ? reactive(res) : res
  },
  set(target, key, value, receiver) {
    const old = target[key]
    const isArrayIndex = Array.isArray(target) && isIntegerKey(key)
    const hadKey = isArrayIndex ? Number(key) < target.length : hasOwn(target, key)

    const ok = Reflect.set(target, key, value, receiver)
    if (!ok) return ok

    if (!hadKey) {
      trigger(target, key)
      // Vue 的 trigger 在 'add' 分支里对数组索引会额外跑 'length' 的 dep
      if (isArrayIndex) trigger(target, 'length')
    } else if (!Object.is(old, value)) {
      trigger(target, key)
    }
    return ok
  },
  deleteProperty(target, key) {
    const had = hasOwn(target, key)
    const ok = Reflect.deleteProperty(target, key)
    if (ok && had) trigger(target, key)
    return ok
  },
}

export function reactive(target) {
  if (!isObject(target)) return target
  return new Proxy(target, mutableHandlers)
}

/* ---------------------------- computed / ref ---------------------------- */

function trackDep(dep) {
  if (!activeEffect) return
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
  }
}

function triggerDepEffects(dep) {
  for (const e of [...dep]) {
    if (!e.active) continue
    if (e === activeEffect) continue
    if (e.scheduler) e.scheduler()
    else e.run()
  }
}

export function computed(getter) {
  let value
  let dirty = true
  const dep = new Set()

  const runner = new ReactiveEffect(getter, () => {
    if (!dirty) {
      dirty = true
      triggerDepEffects(dep)
    }
  })

  return {
    get value() {
      if (dirty) {
        dirty = false
        value = runner.run()
      }
      // 注意顺序：必须在 runner.run() 之后，此时 activeEffect 已经恢复成外层 effect
      trackDep(dep)
      return value
    },
  }
}

export function ref(raw) {
  let value = raw
  const dep = new Set()

  return {
    get value() {
      trackDep(dep)
      return value
    },
    set value(next) {
      if (Object.is(next, value)) return
      value = next
      triggerDepEffects(dep)
    },
  }
}
