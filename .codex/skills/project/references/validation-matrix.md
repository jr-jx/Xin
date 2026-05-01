# Xin Validation Matrix

按改动类型选择最窄但有意义的验证。多个类型同时变更时，选择覆盖面更大的命令。

## 推荐命令

- Vue、TypeScript、普通组件、composables、stores、utils：`pnpm lint:fix`
- SCSS、全局样式、SFC style：`pnpm lint:fix`
- Markdown 文章、frontmatter、内容分类标签：通常无需完整构建；涉及 schema、渲染、feed 时跑 `pnpm build`
- `content.config.ts`、内容 schema、Nuxt Content 查询行为：`pnpm build`
- `nuxt.config.ts`、`blog.config.ts`、`app/app.config.ts`：`pnpm build`
- `server/api/**`、`server/routes/**`：`pnpm build`
- Atom、OPML、route rules、prerender、静态输出、Netlify 生成问题：`pnpm generate`
- `package.json`、`pnpm-workspace.yaml`、`pnpm-lock.yaml`、`patches/**`：先确认依赖安装状态，再跑 `pnpm build`
- 交互和视觉行为需要人工查看时：`pnpm dev`

## 脚本辅助

传入已改文件路径，获取推荐验证命令：

```bash
node .codex/skills/project/scripts/verification_picker.mjs app/components/Foo.vue
```

不传参数时，脚本会读取 `git diff --name-only` 和 `git diff --name-only --cached`。

## 选择规则

- 只改文档、skill、注释类非业务文件时，不需要跑 Nuxt 构建；可以跑相关脚本或格式检查。
- 只改 Markdown 内容且 frontmatter 符合 schema 时，可以不跑 `pnpm build`，但 feed/SEO 相关内容改动建议跑 `pnpm build`。
- 只改 CSS/SCSS 或 Vue SFC，`pnpm lint:fix` 是默认最低验证。
- 只要改到 Nuxt/Nitro/content 配置，默认跑 `pnpm build`。
- 涉及 prerender、Atom、OPML、Netlify 静态输出，优先跑 `pnpm generate`，它覆盖静态生成风险。
