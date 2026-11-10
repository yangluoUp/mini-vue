/**
 * reactive：用 Proxy 把普通对象包成响应式对象
 * 对照源码：vue-next/packages/reactivity/src/reactive.ts + baseHandlers.ts
 *
 * 【这个文件已经写好了，不用改】—— 你要体会的是两个钩子的位置：
 *   读（get）→ track   写（set / deleteProperty）→ trigger
 */
import { track, trigger } from './effect.js'

const isObject = (v) => v !== null && typeof v === 'object'
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
// '0' / '12' 这类数组下标；'length'、'push' 都不算
const isIntegerKey = (k) => typeof k === 'string' && /^\d+$/.test(k)

const mutableHandlers = {
  /** 读：先取真实值，登记依赖，再决定要不要把结果也包成响应式 */
  get(target, key, receiver) {
    const res = Reflect.get(target, key, receiver)
    track(target, key)
    // 懒代理：只有被真正读到的嵌套对象才包 Proxy。
    // 对比 Vue 2 要在初始化时深度递归遍历所有属性 —— 这是性能差距的主要来源之一。
    return isObject(res) ? reactive(res) : res
  },

  /** 写：值真的变了才触发（避免同值赋值引起无意义重渲染） */
  set(target, key, value, receiver) {
    const old = target[key]
    const isArrayIndex = Array.isArray(target) && isIntegerKey(key)
    // 数组的「新增索引」要单独识别：写 arr[arr.length] 属于 add，不是 set
    const hadKey = isArrayIndex ? Number(key) < target.length : hasOwn(target, key)

    const ok = Reflect.set(target, key, value, receiver)
    if (!ok) return ok

    if (!hadKey) {
      trigger(target, key)
      // ★ 真实 Vue 的细节：数组新增索引会让 length 变大，
      //   所以 trigger 的 'add' 分支里会额外跑一遍 'length' 的 dep。
      //   没有这一行，effect(() => list.length) 在 push 之后不会重跑（测试 A7）。
      if (isArrayIndex) trigger(target, 'length')
    } else if (!Object.is(old, value)) {
      trigger(target, key)
    }
    return ok
  },

  /** 删：删掉了才触发 */
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
