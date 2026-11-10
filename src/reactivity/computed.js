/**
 * computed：懒计算 + 缓存
 * 对照源码：vue-next/packages/reactivity/src/computed.ts
 *
 * 关键词只有两个：dirty（脏标记）和 scheduler（决定依赖变化时做什么）
 */
import { ReactiveEffect, trackDep, triggerDepEffects } from './effect.js'

export function computed(getter) {
  let value
  let dirty = true // 脏 = 缓存失效，下次读取需要重算
  const dep = new Set() // 谁在依赖这个 computed（effect 里读了 c.value）

  // computed 内部也是一个 effect：它会去读 getter 里用到的响应式数据。
  // 区别在于它挂了 scheduler —— 依赖变化时不直接重算，只是把标记弄脏。
  const runner = new ReactiveEffect(getter, () => {
    // -------------------------------------------------------------
    // TODO(任务 C-1)
    // 依赖变化时应该做什么？两件事：
    //   1) 把 dirty 置为 true（下一次 .value 才重算 —— 这就是「懒」）
    //   2) 通知依赖这个 computed 的那些 effect 重新执行（triggerDepEffects(dep)）
    // 注意：这里只是「标记」，不要在这里调用 runner.run()，否则就变成即时计算、失去缓存意义。
    // -------------------------------------------------------------
  })

  return {
    get value() {
      // -----------------------------------------------------------
      // TODO(任务 C-2)
      // 1) dirty 为 true 时：先把 dirty 置 false（注意顺序，getter 里可能又读到自身？先置再算），
      //    然后 value = runner.run() 重算
      // 2) 无论是否重算，都要 trackDep(dep)：把「当前正在读 c.value 的 effect」登记进来，
      //    否则 effect(() => c.value) 永远不会被通知（测试 D2）
      // 3) 返回 value
      // 现在这里直接抛错，做完任务 C 再删掉这行。
      // -----------------------------------------------------------
      throw new Error('computed 尚未实现（任务 C）')
    },
  }
}
