/**
 * 进程内聚合运行所有测试。
 * 为什么不直接用 `node --test test/`：那条命令会为每个测试文件 spawn 子进程，
 * 在受限环境（例如某些沙箱）里 spawn 管道会被拒绝（EPERM）。这里直接 import，
 * 全部在当前进程里跑，任何环境都可用。
 */
import './01-basic.test.mjs'
import './02-nested.test.mjs'
import './03-computed-ref.test.mjs'
import './04-advanced.test.mjs'
