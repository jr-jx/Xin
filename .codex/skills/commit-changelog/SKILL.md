---
name: commit-changelog
description: Use this skill in the Xin / @everfu/xin / 伍拾柒 repository only when the user explicitly asks the AI agent to commit the current project, prepare a commit, create a commit, or submit current changes. It requires adding a concise modification log entry to AGENT.md and CLAUDE.md before the AI-created commit.
---

# Commit Changelog

这个 skill 只用于 AI agent 负责创建提交时，同步维护 AI 协作说明里的修改日志。

## 触发时机

- 用户明确要求 AI 提交当前项目或当前改动，例如“帮我提交当前项目”“提交当前改动”“commit 这些修改”。
- 用户明确要求 AI 准备提交内容、生成提交并执行 `git commit`，或在提交前整理本次变更日志。
- 依赖更新任务只有在用户同时要求 AI 提交时才触发；依赖验证仍遵循 `dependency-update`。

普通代码修改、内容更新、配置调整、依赖升级、最终回复、handoff 或只整理改动时，不触发本 skill，也不要新增 `AGENT.md` / `CLAUDE.md` 修改日志。

## 工作流程

1. 先完成用户要求的改动和验证，但在执行 `git commit` 前处理日志。
2. 用 `git status --short` 和必要的 `git diff --stat` 确认本次实际改动。
3. 在 `AGENT.md` 的 `## 修改日志` 下追加一条日期项。
4. 在 `CLAUDE.md` 的 `## Change Log` 下追加同一事实的英文日期项。
5. 日志保持简短，只记录对后续 AI agent 有用的信息：
   - 改了什么；
   - 为什么改；
   - 运行了哪些验证，或明确说明未运行验证。
6. 如果两个文件尚无日志区，在文末创建对应标题。

## 日志格式

`AGENT.md` 使用中文：

```markdown
- YYYY-MM-DD：一句话说明本次更新；验证：`command` 或未运行。
```

`CLAUDE.md` 使用英文：

```markdown
- YYYY-MM-DD: One concise sentence describing the update; verification: `command` or not run.
```

## 约束

- 不要把详细提交 diff、完整命令输出或长篇过程写入日志。
- 不要记录无关文件或用户未要求整理的历史改动。
- 如果工作区已有用户改动，只记录本次 agent 负责的变更。
