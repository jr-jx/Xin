---
name: project
description: Use this skill for general Xin / @everfu/xin / 伍拾柒 repository work. Trigger on Chinese or English requests about 项目维护、博客内容、文章、Markdown、content/posts、Nuxt、Nuxt 4、Vue、TypeScript、Pinia、Nitro、server routes、页面、组件、布局、样式、SCSS、SEO、Feed、Atom、OPML、Twikoo、搜索、分类、标签、归档、配置、lint、build、generate、Netlify、部署、排障, or verification. For dependency update, outdated package, pnpm catalog, lockfile, patch, or package upgrade tasks, use dependency-update.
---

# Project

这是 Xin / 伍拾柒 Nuxt 博客的通用项目入口 skill。保持入口精简：先判断任务类型，再只加载需要的 reference 或切到专项 skill。

## 命名规范

- 项目内 skill 不额外增加 `xin-` 前缀。
- 使用简短、语义明确的英文 hyphen-case：`project`、`dependency-update`、`commit-changelog`。
- 目录名、frontmatter `name`、agent prompt 中的 `$skill-name` 必须一致。
- 通用入口：`project`。
- 依赖升级：`dependency-update`。
- AI 提交日志：`commit-changelog`。
- 正文说明和 references 可以使用中文；frontmatter `name` 保持英文小写和连字符，避免触发器兼容问题。

## 分流规则

- 依赖更新、过期检查、`pnpm-workspace.yaml` catalog、`pnpm-lock.yaml`、patch、peer dependency、包升级排障：使用 `dependency-update`。
- 用户明确要求 AI 提交、帮忙提交当前项目或执行 `git commit`：使用 `commit-changelog`。
- 内容、页面、组件、布局、样式、服务端路由、配置、部署、验证等普通项目任务：继续使用本 skill。

## 快速上下文

- 技术栈：Nuxt 4、Vue 3、TypeScript、`@nuxt/content`、Pinia、Nitro、SCSS、Nuxt Icon/Image、Twikoo、Atom/OPML、Netlify。
- 包管理器：只使用 `pnpm`。
- 缩进：遵循 `.editorconfig`，使用 tabs。
- 工作树：保留用户已有改动，不回退无关文件。

需要快速获取项目快照时运行：

```bash
node .codex/skills/project/scripts/project_snapshot.mjs
```

## 任务导航

- 内容、Markdown、frontmatter、分类、标签、日期、封面、Feed、SEO：读 `references/content-guide.md`。
- 页面、组件、布局、composables、stores、SCSS、Nitro routes、配置、部署：读 `references/task-workflows.md`。
- 项目目录、关键配置、常见修改位置、路由概览：读 `references/project-map.md`。
- 选择验证命令：读 `references/validation-matrix.md` 或运行 `scripts/verification_picker.mjs`。

## 工具脚本

这些脚本只读项目文件，不依赖第三方包。

```bash
node .codex/skills/project/scripts/project_snapshot.mjs
node .codex/skills/project/scripts/verification_picker.mjs app/components/Foo.vue
node .codex/skills/project/scripts/skill_doctor.mjs
```

## 基本流程

1. 先读相关文件或运行项目快照，确认当前结构。
2. 按任务类型加载对应 reference 或专项 skill。
3. 按现有 Nuxt/Vue/content 模式做最小改动。
4. 不随意修改 `package.json` scripts、依赖策略或部署流程。
5. 完成后选择最窄但有效的验证命令。
