# Cloudflare 实施说明

2026-10-21。本轮只迁移本地代码，没有发布网站或创建云端资源。

## 运行架构

前端仍使用 Next.js App Router；页面不需要请求时 SSR，因此用静态导出生成 HTML。开发时 Next 服务在 3007 端口并将三个生成 API 路由代理到 8787；完整预览和未来生产由 Cloudflare Worker + Static Assets 同时提供页面和 API。不引入 Next.js Workers 运行时适配器。

Worker `worker/index.ts` 导出 `GenerationState` 类。`wrangler.jsonc` 声明 GENERATION_STATE binding 和 v1 SQLite migration。所有请求通过稳定名称 `generation-ledger-v1` 取得同一 Durable Object；这是当前低流量初版保证个人额度和全站预算同一事务的选择。

## 配额和缓存

Durable Object 的 SQLite `entries` 表存储值与毫秒级过期时间。预留在 `transactionSync` 中执行：

1. 读个人日次数、全站当日像素数、个人冷却。
2. 拒绝冷却期、次数超限或预算超限；拒绝不写入任何扣款。
3. 同时写入次数 +1、像素累加、30 秒冷却。

UTC 日期作为计数 key 的一部分，午夜逻辑重置。冷却独立于日期，不因跨日失效。定时 alarm 清理过期记录；缓存读取也检查过期时间，清理延迟不会延长额度或结果有效期。

状态查询先检查缓存，再取短租约。签名 token 和 IP 哈希身份验证仍在 Worker 执行。缓存只存图片链接、seed 和状态，不存完整图片或 prompt。所有 API 响应 no-store。失败不自动返还已预留额度，以防未知上游结果重复计费。

## 本地和生产隔离

`.dev.vars` 被 Git 忽略，存本地 FAL_KEY、APP_SECRET 和开关。初始化脚本只在文件缺失时创建随机密钥，不覆盖用户配置。

LOCAL_DEV 只有在显式开启并且请求 URL 是 loopback 时才使用固定测试身份。生产请求使用 Cloudflare 注入的 CF-Connecting-IP，不再要求用户选择 TRUSTED_IP_HEADER。正式配置 LOCAL_DEV=false，GENERATION_ENABLED=false，必须主动配置和启用后才调用供应商。

测试入口 `tests/worker-fixture.ts` 允许修改时钟，用于验证跨日和缓存失效；正式入口不引用此文件。测试拦截所有外部网络，供应商结果为模拟数据。

## 页面结构

核心 11 页：首页、ComfyUI、API 教程、guide 索引及四篇指南、compare 索引及两篇对比。另有隐私、条款、404。`/free/` 在开发服务器和 Worker 都跳转首页。每个内容页有独立 title、description、canonical 和一个 H1；嵌套页保留父级链接。

原附件中的 KD、搜索量、社群引语和竞争判断未作为已核验事实使用。登录、广告、支付和外部账号配置仍在后续范围。

## 核实参考

- https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
- https://developers.cloudflare.com/workers/static-assets/
- 项目安装版本的 `node_modules/next/dist/docs/01-app/02-guides/static-exports.md`
- https://fal.ai/models/fal-ai/moss-image/api
- https://fal.ai/models/fal-ai/moss-image
- https://github.com/OpenMOSS/MOSS-Image

## 未来上线验收

配置 Cloudflare 账户授权、生产 secrets、域名和预算后，才能部署。上线前需验证真实文本和布局出图、下载、NSFW 和供应商失败响应，并核对费用；同时补齐运营主体、联系信息、日志保留说明和供应商数据处理条款。D1、R2 和付费积分系统不属于本轮迁移。
