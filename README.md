# mossimage.run

独立 MOSS-Image 图片生成工作室。Next.js 静态页面 + Cloudflare Worker API + SQLite-backed Durable Object + fal.ai。已部署至 https://mossimage.run/。

## 本地运行

```sh
npm ci
node scripts/setup-local.mjs
npm run dev
```

- 前端：http://127.0.0.1:3007（Next.js 热更新）
- API：http://127.0.0.1:8787（Wrangler/workerd 本地模拟）
- 前端的配置、生成、账号、认证、结账和 Webhook 路由代理到本地 Worker；`/api/` 仍是教程页面。
- `npm run dev` 同时启动两项服务，退出时一起关闭。端口被占用时先停掉旧进程。
- 无需 Cloudflare 登录即可运行。Durable Objects 数据保存在 `.wrangler/`，重启保留。

默认不产生真实生成费用。页面、提示词和 JSON 编辑可用；概念卡片不是模型输出。

## 你需要提供什么

**只测试真实出图时，仅需 fal.ai 密钥 `FAL_KEY` 和可用的供应商账户额度。** 不需要 Upstash、Redis、D1 或 R2。测试账号与支付时，还需 Cloudflare Email Sending 和 Stripe 的测试环境配置，见 `docs/BILLING_IMPLEMENTATION.md`。

运行初始化脚本后，在忽略提交的 `.dev.vars` 填写：

```dotenv
FAL_KEY="你的 fal.ai 密钥"
GENERATION_ENABLED="true"
```

脚本会自动生成随机 `APP_SECRET`，不会覆盖已有文件或打印密钥。若手动复制示例，则必须自行生成至少 32 字符的高熵密钥。不要将密钥发送到聊天或提交 Git。

其余本地配置已给出：

```dotenv
APP_ORIGIN="http://127.0.0.1:3007"
LOCAL_DEV="true"
DAILY_PIXEL_LIMIT="20000000"
```

修改后重启服务。所有本地请求共用固定测试身份，不依赖可伪造的浏览器头。仅在显式 LOCAL_DEV=true 且请求 URL 为 loopback 时启用本地身份。生产只使用 Cloudflare 的 `CF-Connecting-IP`。

### 完整 Workers 运行时预览

```sh
npm run build
npm run preview
```

此模式由同一个 Worker 在 http://127.0.0.1:8787 提供 `out/` 的静态页面和 API。测试真实生成时，把 `.dev.vars` 的 `APP_ORIGIN` 改为 `http://127.0.0.1:8787`；回到热更新开发时改回 3007。不允许跨站发起生成。

## 验证命令

```sh
npm test
npm run typecheck
npm run build
npm run test:worker
```

`npm test` 已包括 Worker 集成测试；最后一项可单独运行。集成测试使用真实本地 workerd/SQLite Durable Objects，外部网络通过测试处理器拦截，fal.ai 队列响应为模拟数据，不消耗生成额度。测试夹具包含可控时钟，仅测试入口导出，不进入正式 Worker。

## 架构与成本控制

- Next.js 在构建时输出所有内容页 HTML、JS、sitemap 和 robots 到 `out/`。
- Worker 提供同源 API，保留 fal.ai 安全检查、尺寸白名单、请求大小校验、JSON 布局校验和签名任务 token。
- 单个命名 Durable Object `generation-ledger-v1` 管理所有个人次数、全站像素预算、冷却和结果缓存。
- 漏斗事件使用同源 `/api/analytics/` 写入同一个 Durable Object，不依赖第三方分析 SDK。只保存签名后的随机浏览器 ID、事件名和白名单维度，90 天后清理；管理员使用 `support@mossimage.run` 登录后可在 `/admin/analytics/` 查看汇总。
- SQLite `transactionSync` 在一个事务里预留个人次数和全站预算，避免并发超支。
- 默认每个 IP 哈希每天 3 次、间隔 30 秒、全站每日 20 MP；按 $0.05/MP 线性估算约 $1，实际账单可能不同。请同时使用供应商账户预算。
- 提交异常仍保留预留额度，因为供应商可能已经开始计费。切勿对不确定结果自动重试。
- 配额在 UTC 午夜逻辑失效；冷却跨午夜保留满 30 秒。结果缓存 1 小时；查询租约 15 秒，普通排队响应后保留 2 秒查询间隔。
- 过期数据由 alarm 约每分钟清理。Cloudflare 备份/恢复机制和基础设施日志有独立保留策略。
- 所有额度更新必须经过同一个命名对象。不要直接按用户分片，否则会破坏全站预算的原子性；大流量阶段需重新设计全局额度分配。
- DO 内部操作仅通过 binding 调用，公网路由不暴露 `/reserve`、`/poll` 或测试时钟。

## 生产部署状态

2026-10-21 已正式部署，Cloudflare Zone 为 Active。

- 访问地址：https://mossimage.run/
- Worker：`mossimage-run`
- Account ID：`23e53b75ddd6ee2d8b80031f6a1e45e0`
- Zone ID：`2c68f0fbbf66991dbf833585ac45f064`
- 部署版本：`5275f51d-ed2f-422c-b4ec-276eb23b8c13`
- 主域名和 www 均使用 Worker Custom Domain。www 以 308 跳转至 HTTPS 主域名并保留路径和查询参数。
- 已沿用本地 FAL_KEY 写入 Worker Secret，并为生产单独生成 APP_SECRET；密钥不写入源码。
- GENERATION_ENABLED=true，LOCAL_DEV=false，每日全站预算 20,000,000 像素，按当前模型标价估算约 $1/天，不含 Cloudflare 费用。
- workers.dev 和预览 URL 关闭。所有请求先经过 Worker，以确保 www 的静态页面也会跳转。
- 经用户确认，移除了 @、www 两条指向 185.53.179.149 的旧 A 记录并替换为 Worker 绑定；原通配符 A 记录保留。

上线验证：19 项测试、类型检查和生产构建通过；首页、指南页、配置 API、robots.txt、sitemap.xml 均为 200，配置 API 返回 enabled=true；www 带路径及参数的请求返回正确的 308。浏览器页面正常显示，控制台未发现错误。未追加线上付费出图请求。

验证记录：`artifacts/production-check.json`，页面截图：`artifacts/production-home.png`。

后续发布先执行 `npm test`、`npm run typecheck`、`npm run build`，再执行 `npx wrangler deploy`。仅准备时使用 `npx wrangler deploy --dry-run`，它不会验证云端权限、域名或证书。`.dev.vars` 只供本地使用，不随发布上传。当前 OAuth 可读 Zone、部署 Worker 和管理 Worker Secrets；DNS 记录管理需使用已登录的控制台。

## 当前边界

邮件验证码账号、积分账本、Stripe Checkout、Customer Portal、签名 Webhook、定价页和政策页已在本地实现。生产环境的 `AUTH_ENABLED` 仍为 `false`，因此线上现有免费生成流程保持不变；在 Resend 域名、支持邮箱、Stripe Live Price ID、Webhook Secret 和商户主体信息全部确认前不得开启收款。广告奖励和 GA/GSC/Bing 接入尚未实现。

图片由 fal.ai 托管，未建立永久作品库。任务离开页面后暂不恢复，浏览器最多轮询 7.5 分钟。已完成本地真实出图 3 张，文字、JSON 布局和前端下载通过；估算费用约 $0.16，尚未核对供应商账单。记录见 `artifacts/real-generation-test/ledger.json`。

字体通过 Google Fonts 获取。ComfyUI 链接指向官方 workflow，未在本地 GPU 执行；对比页为选型框架，没有捏造性能跑分。上线前仍需补真实样例和运营主体信息。

实现说明见 `docs/IMPLEMENTATION.md`，收款启用步骤见 `docs/BILLING_IMPLEMENTATION.md`，原始需求附件保留于 `docs/original-brief.txt`。
