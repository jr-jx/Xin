# Xin Task Workflows

## 通用流程

1. 先查看相关文件和邻近实现，确认命名、SFC 结构、样式写法、数据来源。
2. 保持改动范围和用户目标一致，不顺手重构无关代码。
3. 使用 `pnpm`，不要切换包管理器。
4. 不回退用户已有改动。遇到同文件已有改动时，理解后在其基础上继续。
5. 完成后根据 `validation-matrix.md` 或 `verification_picker.mjs` 选择验证命令。

## 内容与文章

- 新文章放在 `content/posts/*.md`。
- 先检查 `content.config.ts` 的 schema，再写 frontmatter。
- 日期使用明确日期字符串，影响归档、排序和 feed。
- 改动标题、描述、封面、分类、标签、草稿状态时，同步考虑列表页、SEO、Atom feed。
- 草稿文章应显式设置 `draft: true`，发布文章设置 `draft: false` 或遵循现有默认。

## 页面与组件

- 页面路由位于 `app/pages/`，组件优先放在职责接近的目录，例如 `app/components/post/`、`app/components/layouts/`、`app/components/content/`。
- 保持 Vue SFC 风格与邻近文件一致，缩进使用 tabs。
- 优先使用 Nuxt 自动导入的组件、composables、stores 和 utils。
- `app/components/partial/` 自动导入前缀为 `U`，引用名要匹配该前缀。
- UI 改动要检查响应式状态、暗色模式、长文本、文章内容样式和已有 CSS 变量。

## 样式

- 全局样式放在 `app/assets/css/`，局部样式优先写在对应 SFC。
- 可以直接使用 `_variable.scss` 中的变量和 mixin；它由 `nuxt.config.ts` 全局注入。
- 修改文章渲染样式时重点查看 `app/assets/css/post.scss` 和 content 相关组件。
- 不新增无用设计系统或全局 CSS 抽象；先复用当前变量和类名模式。

## 服务端与 Nitro

- API 放在 `server/api/`，自定义路由放在 `server/routes/`。
- Atom 和 OPML 输出要保持 XML content type、prerender 规则和生成格式稳定。
- 修改 feed、OPML、搜索或 server route 后，优先跑 `pnpm build`；涉及静态输出时跑 `pnpm generate`。

## 配置

- 站点内容配置优先改 `blog.config.ts`。
- Nuxt 模块、global CSS、route rules、runtime config 改 `nuxt.config.ts`。
- 内容 collection 和 schema 改 `content.config.ts`。
- 部署相关改 `netlify.toml`。
- 配置改动通常影响构建，完成后优先跑 `pnpm build`。

## 依赖与 patch

依赖升级、过期检查、lockfile 刷新、catalog 版本调整优先使用 `dependency-update` skill。这里只保留项目级约定。

- 大多数依赖版本在 `package.json` 中使用 `catalog:*`，升级时通常改 `pnpm-workspace.yaml` 的 catalog。
- 不要直接把 catalog-managed dependency 改成固定版本，除非用户明确要求且理由充分。
- 升级 `@nuxtjs/mdc`、`@vue/shared`、`vue-tippy` 前必须检查 `patches/` 中对应 patch 是否仍适用。
- 依赖、lockfile、workspace、patch 变更后优先跑 `pnpm install` 或用户指定的安装命令，再跑 `pnpm build`。

## 部署与排障

- Netlify 相关问题先看 `netlify.toml`、`package.json` scripts、`nuxt.config.ts` route rules 和 Nitro 设置。
- 静态生成、feed、OPML、prerender 问题优先使用 `pnpm generate` 验证。
- 构建失败先保留错误原文，定位到具体文件后再改代码，避免猜测式大改。
