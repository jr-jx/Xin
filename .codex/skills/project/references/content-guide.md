# Xin Content Guide

文章放在 `content/posts/*.md`，由 `content.config.ts` 的 `post` collection 管理。新增或修改文章前，先核对 schema，尤其是必填字段和默认值。

## 常用 frontmatter

```yaml
---
title: 文章标题
description: 文章描述
date: 2026-01-01
updated: 2026-01-02
categories: [技术, 前端]
tags: [Vue, Nuxt, TypeScript]
type: tech
draft: false
featured: false
image: /path/to/image.webp
toc: true
comments: true
---
```

## 字段规则

- `title` 必填，作为文章标题和常见 SEO 来源。
- `date` 必填，通常影响文章排序、归档、feed。
- `tags` 必填，使用字符串数组。
- `categories` 默认来自 `blog.config.ts`，但新文章建议显式填写。
- `type` 可用值：`tech`、`story`、`life`、`review`、`tutorial`。
- `draft` 默认 `false`，草稿要明确写 `true`。
- `image` 是主要封面字段；`cover` 是兼容旧字段。
- `description`、`excerpt`、`keywords`、`meta` 会影响摘要和 SEO 表现。
- `toc` 和 `comments` 分别控制目录与评论。

## 分类、标签、日期

- 分类和标签要复用站内已有命名，避免同义词拆散归档。
- 日期写完整 `YYYY-MM-DD`，不要使用相对日期。
- 修改旧文章日期会影响归档、列表排序和 feed 顺序；除非用户明确要求，不要随意改。

## 封面和静态资源

- 站内静态资源通常放在 `public/` 并以根路径引用。
- 外链图片可能影响性能、稳定性和隐私；沿用现有文章做法。
- 改封面字段时同时检查列表页、详情页、分享卡片或 SEO 图片使用的是 `image` 还是兼容字段。

## Feed 与 SEO

- Atom feed 由 `server/routes/atom.xml.get.ts` 生成，常受 `title`、`description`、`date`、链接和站点配置影响。
- OPML 由 `server/routes/efu.opml.get.ts` 生成。
- 改文章元数据、站点地址、feed 配置或 server route 后，优先跑 `pnpm build`；涉及静态输出时跑 `pnpm generate`。

