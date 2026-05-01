---
name: dependency-update
description: Use this skill for dependency maintenance in the Xin / @everfu/xin / 伍拾柒 Nuxt repository. Trigger on requests to update, upgrade, bump, audit, inspect, plan, or troubleshoot dependencies, pnpm catalog versions, pnpm-workspace.yaml, package.json catalog:* entries, pnpm-lock.yaml, patches, patchedDependencies, peerDependencyRules, Nuxt/Vue/TypeScript package upgrades, or npm/pnpm outdated reports.
---

# Xin Dependency Update

这个 skill 专门处理 Xin 项目的依赖维护。普通项目任务使用 `project`；用户明确要求 AI 提交依赖改动时再使用 `commit-changelog`。

## 快速规则

- 只使用 `pnpm`。
- 使用 `catalog:*` 的依赖，优先改 `pnpm-workspace.yaml`，不要直接把 `package.json` 改成固定版本。
- 不要在未检查 patch 的情况下删除 `patches/` 或 `patchedDependencies`。
- `pnpm-lock.yaml` 由 `pnpm install` / `pnpm update` 生成，不手写。
- 依赖变更后先刷新安装状态，再尽量运行 `pnpm build`。

## 快速检查

改依赖前先运行：

```bash
node .codex/skills/dependency-update/scripts/dependency_plan.mjs
```

检查指定包：

```bash
node .codex/skills/dependency-update/scripts/dependency_plan.mjs nuxt vue @nuxt/content
```

改版本或 lockfile 前读 `references/update-workflow.md`。判断关联包是否需要一起升级时读 `references/package-groups.md`。

## 工作流程

1. 用 `dependency_plan.mjs` 确认依赖归属。
2. 判断目标包是 catalog-managed、直接版本、patched，还是仅传递依赖。
3. 涉及 latest/current 版本时必须实时确认。优先用 `pnpm outdated`、`pnpm info <pkg> version`、`pnpm info <pkg> peerDependencies`。
4. 编辑最小 source of truth：
   - catalog-managed：改 `pnpm-workspace.yaml`。
   - 非 catalog 直接依赖：改 `package.json`。
   - patch 映射：只有路径或 patch 关系变化时才改 `pnpm-workspace.yaml`。
5. 用 `pnpm install` 或定向 `pnpm update <pkg>` 刷新 lockfile。
6. 验证优先 `pnpm build`；影响静态输出、Nitro、Feed、Netlify 时再跑 `pnpm generate`。

## 风险点

- Nuxt、Vue、Vue Router、TypeScript、Sass、Node types 要一起看兼容性，不要孤立升级。
- `@nuxt/content`、Markdown、Shiki、MDC、remark、rehype、zod 相关升级会影响内容渲染和 schema。
- lint/style 依赖升级后跑 `pnpm lint:fix`，检查配置格式是否变化。
- patched 包升级前后都要检查 patch：
  - `@nuxtjs/mdc`: `patches/@nuxtjs__mdc.patch`
  - `@vue/shared`: `patches/@vue__shared.patch`
  - `vue-tippy`: `patches/vue-tippy.patch`
