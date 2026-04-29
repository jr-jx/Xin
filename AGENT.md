# agent.md

本文件给在该仓库中工作的 AI Agent 使用。目标是让改动贴合现有 Nuxt 博客项目，避免引入不一致的工具链、风格或目录结构。

## 项目概览

`@everfu/xin` 是一个基于 Nuxt 4、Vue 3 和 TypeScript 的个人博客系统，站点名为「伍拾柒」。内容由 `@nuxt/content` 驱动，文章位于 `content/posts/`，评论使用 Twikoo，并提供 Atom 与 OPML 输出。项目部署目标为 Netlify。

## 技术栈

- 框架：Nuxt 4、Vue 3、TypeScript
- 内容：`@nuxt/content`、Markdown、Shiki、`nuxt-content-twoslash`、KaTeX、remark/rehype 插件
- 状态管理：Pinia
- UI 与资源：`@nuxt/icon`、`@nuxt/image`、`nuxt-aos`、`vue-tippy`
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
- 根配置：`nuxt.config.ts`、`blog.config.ts`、`content.config.ts`、`eslint.config.mjs`、`stylelint.config.mjs`、`netlify.toml`、`tsconfig.json`

## 关键配置入口

- `blog.config.ts`：站点信息、个人资料、导航、社交链接、页脚、Twikoo、Feed、备案、许可证。
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
