# Xin

一个基于 Nuxt 4 构建的现代化个人博客系统，支持内容管理、主题切换、响应式设计等功能。

## ✨ 特性

- 🚀 **Nuxt 4** - 现代化的前端框架
- 📝 **内容管理** - 基于 Markdown 的内容系统
- 🎨 **主题切换** - 支持明暗主题自动切换
- 📱 **响应式设计** - 完美适配各种设备
- 🔍 **SEO 优化** - 内置 SEO 和元数据管理
- 🎭 **动画效果** - 流畅的页面过渡和交互动画
- 📊 **统计分析** - 文章、标签、分类等数据统计
- 🏷️ **标签系统** - 完整的标签和分类管理
- 🎯 **性能优化** - 图片优化、代码分割等

## 🛠️ 技术栈

- **前端框架**: Nuxt 4
- **样式系统**: SCSS + CSS 变量
- **状态管理**: Pinia
- **图标系统**: Nuxt Icon
- **内容处理**: Nuxt Content
- **构建工具**: Vite
- **部署平台**: Netlify

## 📦 安装

确保你的环境满足以下要求：
- Node.js 18+
- npm/yarn/pnpm/bun

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd blog-v3
```

### 2. 安装依赖

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 3. 环境配置

复制并配置环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量。

## 🚀 开发

### 启动开发服务器

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

开发服务器将在 `http://localhost:3000` 启动。

### 构建生产版本

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

### 预览生产构建

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## ⚙️ 配置

### 博客配置

编辑 `blog.config.ts` 文件来自定义博客设置：

```typescript
const blogConfig = {
	site: {
		title: '你的博客标题',
		description: '博客描述',
		url: 'https://your-domain.com'
	},
	profile: {
		name: '你的名字',
		bio: '个人简介',
		avatar: '头像URL'
	},
	social: [
		{ label: 'GitHub', icon: 'mdi:github', url: 'https://github.com/username' }
	]
}
```

### 主题配置

在 `app/assets/css/color.scss` 中自定义颜色主题：

```scss
:root {
  --main-color: #425aef;
  --card-bg: #ffffff;
  --font-color: #1e293b;
}
```

## 📝 内容管理

### 创建文章

在 `content/posts/` 目录下创建 `.md` 文件：

```markdown
---
title: 文章标题
description: 文章描述
date: 2025-01-01
categories: [技术, 前端]
tags: [Vue, Nuxt, JavaScript]
---

文章内容...
```

### 文章格式

支持以下 frontmatter 字段：
- `title`: 文章标题
- `description`: 文章描述
- `date`: 发布日期
- `categories`: 分类数组
- `tags`: 标签数组
- `draft`: 是否为草稿
- `image`: 封面图片

## 🎨 自定义

### 添加新页面

在 `app/pages/` 目录下创建 Vue 组件：

```vue
<script setup lang="ts">
// 页面逻辑
</script>

<template>
<div>
	<h1>新页面</h1>
</div>
</template>
```

### 添加新组件

在 `app/components/` 目录下创建组件：

```vue
<script setup lang="ts">
// 组件逻辑
</script>

<template>
<div class="custom-component">
	<!-- 组件内容 -->
</div>
</template>
```

## 🚀 性能优化

- **图片优化**: 使用 Nuxt Image 自动优化
- **代码分割**: 自动路由级别的代码分割
- **缓存策略**: 静态资源长期缓存
- **预渲染**: 静态页面预渲染

## 🔧 开发工具

- **ESLint**: 代码质量检查
- **TypeScript**: 类型安全
- **SCSS**: 样式预处理
- **Hot Reload**: 开发时热重载

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

博客文章采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
