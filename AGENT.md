# AGENT.md

本文件给在该仓库中工作的 AI Agent 使用。目标是让改动贴合现有 Nuxt 博客项目，避免引入不一致的工具链、风格或目录结构。

## 项目概览

`@everfu/xin` 是一个基于 Nuxt 4、Vue 3 和 TypeScript 的个人博客系统，站点名为「伍拾柒」。内容由 `@nuxt/content` 驱动，文章位于 `content/posts/`，评论使用内置评论系统，并提供 Atom 与 OPML 输出。项目部署目标为 EdgeOne Pages。

## 技术栈

- 框架：Nuxt 4、Vue 3、TypeScript
- 内容：`@nuxt/content`、Markdown、Shiki、`nuxt-content-twoslash`、KaTeX、remark/rehype 插件
- 状态管理：Pinia
- UI 与资源：`@nuxt/icon`、`@nuxt/image`、`@vueuse/motion`、`vue-tippy`
- 样式：SCSS、CSS 变量、`@nuxtjs/color-mode`
- 工具：ESLint、Stylelint、simple-git-hooks、lint-staged
- 包管理器：pnpm 10.15.0，依赖版本通过 `pnpm-workspace.yaml` 的 catalog 管理

## 常用命令

使用 `pnpm`，不要改用 npm、yarn 或 bun。

```bash
pnpm dev        # 启动开发服务器，默认 http://localhost:3000
pnpm build      # 生产构建
pnpm generate   # 静态生成
pnpm preview    # 预览生产构建
pnpm lint:fix   # ESLint + Stylelint 自动修复
```

`pnpm install` 会触发 `postinstall`，执行 `nuxt prepare && simple-git-hooks`。

## 目录结构

- `app/`：Nuxt 应用源码
	- `components/`：自动导入组件
	- `components/partial/`：自动导入并使用 `U` 前缀
	- `composables/`、`stores/`、`utils/`、`types/`、`plugins/`：按职责组织业务代码
	- `pages/`：页面路由
	- `layouts/default.vue`：默认布局
	- `assets/css/`：全局样式与变量
- `content/posts/`：Markdown 文章
- `server/`：Nitro 服务端路由与 API
	- `api/search/`：搜索接口
	- `routes/atom.xml.get.ts`、`routes/efu.opml.get.ts`：订阅与 OPML 输出
- `public/`：静态资源
- `patches/`：pnpm patch 文件
- 根配置：`nuxt.config.ts`、`blog.config.ts`、`content.config.ts`、`eslint.config.mjs`、`stylelint.config.mjs`、`tsconfig.json`

## 关键配置入口

- `blog.config.ts`：站点信息、个人资料、导航、社交链接、页脚、内置评论系统、Feed、备案、许可证。
- `nuxt.config.ts`：Nuxt 模块、全局 CSS、SCSS 自动注入、路由规则、图标集合、运行时公开配置。
- `content.config.ts`：`@nuxt/content` collection schema。
- `app/app.config.ts`：Nuxt app config。

## 代码风格

- 缩进使用 tab，遵循 `.editorconfig`。
- 不要格式化无关文件，不要做与任务无关的重构。
- Vue、TypeScript、SCSS 代码应符合现有 ESLint 与 Stylelint 规则。
- 组件、composables、stores、utils 依赖 Nuxt 自动导入；不要为这些本地自动导入项添加不必要的手动 import。
- SCSS 中可直接使用 `_variable.scss` 里的变量和 mixin，因为 `nuxt.config.ts` 已通过 Vite `additionalData` 自动注入。
- 生产构建会通过 Terser 移除 `console` 和 `debugger`，不要依赖它们实现业务逻辑。

## 内容约定

新增文章放在 `content/posts/*.md`。常用 frontmatter：

```yaml
---
title: 文章标题
description: 文章描述
date: 2025-01-01
categories: [技术, 前端]
tags: [Vue, Nuxt, JavaScript]
draft: false
image: /path/to/image.webp
---
```

文章排序、归档和 Feed 通常依赖 `date`。如果修改站点身份、导航、社交链接、页脚或 Feed 行为，优先修改 `blog.config.ts`。

## 依赖与补丁

- `package.json` 中大量依赖版本写作 `catalog:*`，升级版本时应修改 `pnpm-workspace.yaml`，不是直接替换 `package.json` 中的 catalog 引用。
- `patches/` 中包含对 `@nuxtjs/mdc`、`@vue/shared`、`vue-tippy` 的补丁。升级相关包时必须检查补丁是否仍然适用。

## 验证建议

- 修改 Vue、TS 或 SCSS 后，优先运行 `pnpm lint:fix`。
- 修改构建配置、内容 schema、服务端路由或全局样式后，运行 `pnpm build` 或至少 `pnpm dev` 做本地验证。
- 修改 Feed、OPML 或静态生成相关逻辑后，运行 `pnpm generate` 更合适。

## 协作注意事项

- 工作区可能存在用户未提交改动。只修改任务相关文件，不要回退、覆盖或整理无关改动。
- 生成代码时沿用当前目录组织与命名方式。
- 修改 UI 时保持博客现有视觉语言，避免引入不必要的组件库或大范围样式重写。
- 修改公开链接、站点元信息、评论服务、备案信息前，确认它们是否应同步到 `blog.config.ts`、`nuxt.config.ts` 或内容文件。

## 修改日志

- 2026-05-05：收紧 EdgeOne Pages KV 绑定检测，生产缺失 `XIN_COMMENTS_KV`/`XIN_FRIENDS_KV` 时不再静默回退本地 storage；新增管理员 KV 健康检查接口，支持只读状态与写入探测，并将 `/api/friends` 改为由 `XIN_FRIENDS_KV` 自行缓存，KV 缺失时朋友圈列表与点赞读取降级为无缓存/空计数，避免公开页面 500；验证：待运行。
- 2026-05-05：拆分 EdgeOne Pages KV 绑定，`server/utils/edgeKv.ts` 支持 `XIN_COMMENTS_KV` 与 `XIN_FRIENDS_KV` 两个 bucket，朋友圈点赞与 `/api/friends` 聚合缓存改用独立的 `XIN_FRIENDS_KV`，`.env.example` 同步新增绑定说明；验证：`pnpm build`。
- 2026-05-05：新增 `edgeone.json`，声明 EdgeOne Pages 构建命令、输出目录、Node 版本、响应头和 Cloud Functions 原生依赖配置，便于 Nuxt SSR 产物部署；验证：`jq . edgeone.json`、`git diff --check`、`pnpm build`。
- 2026-05-05：内嵌 `tencent-edgeone-skill` 到 `.codex/skills/tencent-edgeone/`，补充 EdgeOne API、加速、安全与可观测参考文档，便于仓库内处理 EdgeOne Pages/KV/Function 相关任务；验证：`node .codex/skills/project/scripts/skill_doctor.mjs`。
- 2026-05-05：将评论与朋友圈点赞存储迁移到 EdgeOne Pages KV，新增 `server/utils/edgeKv.ts` 作为 `XIN_COMMENTS_KV` 绑定适配层，本地使用 `.data/edgeone-kv` 模拟；移除 Netlify Blobs 依赖和 `netlify.toml`，评论/点赞限流改用 KV；验证：`pnpm build`。
- 2026-05-04：精简依赖，移除 `radash`、`parse-domain`、`aplayer`、`@nuxt/scripts`、`nuxt-content-twoslash`（含补丁）、`plain-shiki`、`zod-to-json-schema`，`app/utils/async.ts` 与 `app/utils/link.ts` 改为本地实现 throttle/debounce/域名解析，`@iconify/json` 拆成按需的 `@iconify-json/*` 子包并同步 `nuxt.config.ts` 的 icon `serverBundle.collections`，新增 vite `manualChunks`（shiki/katex/tippy/motion），nitro 开启 `minify` 与 gzip+brotli 压缩，新增 `@shikijs/transformers`，`netlify.toml` 追加 `NODE_OPTIONS=--max-old-space-size=4096`；验证：未运行。
- 2026-05-03：升级 catalog 依赖（`nuxt` 4.4.4、`zod` 4.4.2、`@iconify/json` 2.2.469、`@vueuse/motion` 3.0.3、`@nuxt/scripts` 1.0.6、`@vueuse/core` 14.3.0、`isomorphic-dompurify` 3.12.0），新增 `nuxt-content-twoslash@0.4.0` 补丁，`nuxt.config.ts` 的 vite `optimizeDeps.include` 显式预构建常用依赖，并微调 `app/pages/about/index.vue` 中 `.personality-image` 定位至底部对齐；验证：未运行。
- 2026-05-02：清理 `server/utils/comments.ts` 中未使用的 `getClientIp`、`hashIp`、`encodeLink` 及相关导入，评论接口改用 `rateLimit` 侧的 IP 处理；验证：未运行。
- 2026-05-02：扩展 `netlify.toml`，显式声明 pnpm 构建命令与 Node 22、pnpm 10.15.0 版本，并补充 `/_nuxt`、`/assets` 长缓存、`atom.xml`/`efu.opml` XML 头与全站安全响应头；验证：未运行。
- 2026-05-02：用内置评论系统替换 Twikoo，新增 `server/api/comments/` 接口、`server/utils/{adminAuth,comments,mailer,rateLimit,spam}.ts`、`app/components/post/comment/` UI 与 `useComments` composable，`nuxt.config.ts` 增加 `comments`/`comments-meta` Nitro storage 与 SMTP/管理员 runtimeConfig，`blog.config.ts` 用 `comment` 配置替换 `twikoo`，`.env.example` 同步新增 `NUXT_COMMENT_*` 与 SMTP 变量，依赖 `@netlify/blobs` 改走 pnpm catalog；验证：未运行。
- 2026-05-02：新增朋友圈聚合页 `/friends` 与点赞接口（`server/api/friends.get.ts`、`likes.{get,post}.ts`），使用 Nitro storage（Netlify Blobs / 本地 fs）保存点赞并以 `NUXT_IP_HASH_SALT` 哈希 IP 去重，新增 `@netlify/blobs` 依赖与 `FriendItem` 等类型；验证：未运行。
- 2026-05-01：将站点图标统一迁移到 Phosphor (`ph:`) 命名空间，并优化顶栏菜单胶囊与下拉桥接动画、文字色变量；验证：未运行。
- 2026-05-01：新增 `commit-changelog` skill，仅在用户明确要求 AI 提交当前项目或当前改动时，同步维护 `AGENT.md` 与 `CLAUDE.md` 修改日志；验证：`node -e` 格式检查通过。
- 2026-05-01：提交项目级 Codex skills，包括通用项目、依赖维护和 AI 提交日志流程；验证：`node .codex/skills/project/scripts/skill_doctor.mjs`，`node -e`。
