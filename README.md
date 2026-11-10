# mini-vue · 响应式系统

> 对应学习计划：**阶段一 · 第 1 周（响应式系统）**
> 对应简历原话：「熟悉 Vue 2/3 响应式原理、虚拟 DOM diff 与编译优化」
> 产物定位：能跑、能讲、能被追问 —— 不是抄一遍源码。

## 现在是什么状态

骨架已经搭好，**13 / 18 条测试失败**。这不是坏了，这就是你的任务清单。

```bash
cd D:\workplace\web\frontend-deep-dive\mini-vue
node --test-reporter=spec test/all.mjs
```

不需要 `npm install`：零依赖，只用 Node 内置的 `node:test` + `node:assert`。

## 怎么跑

**先确认你在哪**：所有命令都在 `mini-vue` 目录下执行。

```bash
cd D:\workplace\web\frontend-deep-dive\mini-vue
```

| 命令 | 作用 |
| --- | --- |
| `node --test-reporter=spec test/all.mjs` | 跑全部（日常用这个） |
| `node --test-reporter=spec test/01-basic.test.mjs` | 任务 A：track / trigger |
| `node --test-reporter=spec test/02-nested.test.mjs` | 任务 B：嵌套 effect + 依赖清理 |
| `node --test-reporter=spec test/03-computed-ref.test.mjs` | 任务 C：computed / ref / scheduler |
| `node --test-reporter=spec test/04-advanced.test.mjs` | 任务 D：防递归 + 链式响应（加分） |
| `node experiments/lesson1.mjs` | 观察实验（不用做题就能跑） |

`--test-reporter=spec` 是为了输出 `✔ / ✖` 的清晰列表。不加也行，但 Node 22 默认输出 TAP 格式
（`# pass 5`），失败时还会打一大段堆栈，看着像崩了。

不需要 `npm install`：零依赖，只用 Node 内置的 `node:test` + `node:assert`。
Node 18.17+ / 20 / 22 / 24 都能跑，已在 v22.23.1 上验证。

## 路径规则（这里最容易踩）

`node` 后面跟的路径，**是相对你当前所在目录**的：

| 你当前在哪 | 正确命令 |
| --- | --- |
| `...\mini-vue`（推荐，先进来） | `node experiments/lesson1.mjs` |
| `D:\workplace\web` | `node frontend-deep-dive/mini-vue/experiments/lesson1.mjs` |

千万别在**已经进了 mini-vue** 之后还带 `frontend-deep-dive/mini-vue/` 前缀 ——
那会变成 `mini-vue/frontend-deep-dive/mini-vue/...`，报 `Cannot find module`。


## 看到一片 ✖ 别慌

`fail 13` / `exit code 1` **是起点，不是错误**。13 条失败就是这一周要消灭的任务清单：
做完 A 少 5 条 → 做完 B 再少 3 条 → 做完 C 再少 4 条 → 做完 D 清零。

## 观察实验（不用做题也能跑）

```bash
node experiments/lesson1.mjs
```

用参考实现演示三件事：解构为什么丢响应式、computed 的懒与缓存、遍历 dep 时增删会导致什么。


## 目录

```
mini-vue/
├─ src/reactivity/
│  ├─ effect.js      ★ 任务 A + B 都在这（track / trigger / run / cleanup）
│  ├─ reactive.js      已写好，看两个钩子的位置（get→track，set→trigger）
│  ├─ computed.js    ★ 任务 C-1 / C-2（dirty + scheduler）
│  ├─ ref.js         ★ 任务 C-3（原始值的 get / set）
│  └─ index.js         统一出口，测试只从这里 import
├─ test/               验收测试（不要改，它们是规格）
└─ solution/           参考实现 —— 做完再看
```

## 任务清单

| 任务 | 内容 | 对应测试 | 建议用时 |
| --- | --- | --- | --- |
| A | `track` / `trigger` 的依赖表结构 | A2 A4 A5 A6 A7 | 1 天 |
| B | `run` 的现场恢复 + `cleanupEffect` 分支清理 | B1 B2 B3 | 1 天 |
| C | `computed` 懒 + 缓存 + scheduler；`ref` | C1~C6 | 1 天 |
| D | 防自触发递归、computed 链式响应（加分） | D1 D2 | 半天 |

## 验收标准（三条都过才算完）

1. `node --test-reporter=spec test/all.mjs` → **18 pass / 0 fail**
2. 能不看代码在白板上画出依赖表结构：`WeakMap<target, Map<key, Set<effect>>>`，并说清 `effect.deps` 为什么也要反向存一份
3. 3 分钟口述能覆盖：为什么要 `effectStack`、为什么要 `cleanupEffect`、`computed` 的 `dirty` 解决什么

## 学习规则

- 卡住 **20 分钟**再看 `solution/`，看完关掉重写一遍，不许复制粘贴
- 对照参考实现时，重点找「我没想到的那一点」，把它记进自己的笔记
- 测试文件是规格，改测试等于改题，别干

## 已知的简化（面试时要能主动说出来）

参考实现不是完整 Vue，省略了这些，**主动说明比被问出来好**：

1. `effect()` 直接返回 effect 实例，Vue 返回 runner 函数
2. 没实现 `effectScope`（批量 stop 的容器）
3. 没实现 `shallowReactive` / `readonly` / `markRaw`
4. `trigger` 没做批次合并（Vue 有 `startBatch` / `endBatch`，避免同一轮里重复执行）
5. 数组只做了「新增索引触发 length」，没做 Vue 里 `length` 缩短时批量触发下标 dep 的逻辑
