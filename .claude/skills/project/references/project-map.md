# Xin Project Map

`@everfu/xin` 是 Nuxt 4 个人博客，站点名为「伍拾柒」。项目使用 Vue 3、TypeScript、`@nuxt/content`、Pinia、Nitro、SCSS、Nuxt Icon/Image、Twikoo、Atom/OPML feed 和 Netlify 部署。

## 入口文件

- `blog.config.ts`：站点身份、作者信息、导航菜单、社交链接、页脚、Twikoo、feed、license、备案信息。
- `nuxt.config.ts`：Nuxt 模块、全局 CSS、SCSS 注入、route rules、icon bundle、runtime config、Nitro 配置。
- `content.config.ts`：`@nuxt/content` collection 和文章 schema。
- `app/app.config.ts`：Nuxt app config。
- `package.json`：项目脚本、依赖声明、lint-staged、git hooks。
- `pnpm-workspace.yaml`：workspace、catalog 版本、patched dependencies、peer dependency 规则。
- `netlify.toml`：Netlify 构建和部署设置。

## 关键目录

- `app/components/`：自动导入组件。
- `app/components/partial/`：自动导入，组件名前缀为 `U`。
- `app/pages/`：文件路由页面。
- `app/layouts/default.vue`：默认布局。
- `app/composables/`：组合式函数。
- `app/stores/`：Pinia store。
- `app/utils/`：通用工具。
- `app/types/`：项目类型定义。
- `app/plugins/`：Nuxt 插件。
- `app/assets/css/`：全局 SCSS、CSS 变量、文章样式、动画、复用样式。
- `content/posts/`：Markdown 文章。
- `server/api/`：Nitro API。
- `server/routes/`：Nitro server routes，例如 Atom 和 OPML。
- `public/`：静态资源。
- `patches/`：pnpm patch 文件，升级被 patch 的包前必须检查。

## 常见修改位置

- 新文章：`content/posts/*.md`。
- 文章字段规则：`content.config.ts`。
- 文章列表、详情、归档、分类、标签页面：`app/pages/` 与 `app/components/post/`。
- 全站视觉样式：`app/assets/css/*.scss`。
- 布局框架：`app/layouts/default.vue` 和 `app/components/layouts/`。
- 导航、站点文案、社交信息：`blog.config.ts`。
- Feed 和 OPML：`server/routes/atom.xml.get.ts`、`server/routes/efu.opml.get.ts`。
- 搜索接口：`server/api/search/posts.get.ts`。
- Nuxt 模块、route rules、runtime config：`nuxt.config.ts`。
- 依赖升级：`pnpm-workspace.yaml` 的 catalog，必要时检查 `patches/`。

## 自动导入与样式约定

- 本地组件、composables、stores、utils 通常遵循 Nuxt 自动导入，不要为这些项目本地符号添加多余 import。
- `app/components/partial/` 使用 `U` 前缀，移动或新增组件时要保持调用名一致。
- SCSS 通过 `nuxt.config.ts` 注入 `@use "@/assets/css/_variable.scss" as *;`，组件样式可以直接使用其中变量和 mixin。
- 生产构建会丢弃 `console` 和 `debugger`，不要依赖它们实现业务行为。

## 快照脚本

需要快速核对项目脚本、catalog、Nuxt 模块、路由和关键文件存在性时，运行：

```bash
node .claude/skills/project/scripts/project_snapshot.mjs
```
