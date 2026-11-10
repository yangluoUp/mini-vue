/**
 * ref：把一个原始值 / 对象包成 { value } 的响应式容器
 * 对照源码：vue-next/packages/reactivity/src/ref.ts
 *
 * 为什么需要它：Proxy 只能代理对象，1 / 'abc' 这种原始值包不了，
 * 而组件里到处是原始值（计数、开关、输入框文本），所以需要一层容器来承载 get/set。
 */
import { trackDep, triggerDepEffects } from './effect.js'

export function ref(raw) {
  let value = raw
  const dep = new Set()

  return {
    get value() {
      // TODO(任务 C-3)：读取时要做依赖收集（trackDep(dep)）
      return value
    },
    set value(next) {
      // TODO(任务 C-3)：值真的变化时通知依赖（triggerDepEffects(dep)）。
      // 提示：用 Object.is 判断，避免相同值重复触发；NaN 用 Object.is 也能正确比较。
      value = next
    },
  }
}
