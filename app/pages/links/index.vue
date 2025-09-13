<script setup lang="ts">
import { getArchIcon } from '~/utils/icon'
import links from './links'

// 定义链接类型
interface LinkItem {
	name: string
	url: string
	logo: string
	description: string
	framework?: string
	platform?: string
}

interface LinkCategory {
	name: string
	description: string
	links: LinkItem[]
}

// SEO 设置
useSeoMeta({
	title: `友情链接`,
	description: '我的朋友们和帮助过我的人',
})

// 直接使用新的数据结构
const linkCategories = computed((): LinkCategory[] => {
	return links as LinkCategory[]
})
</script>

<template>
<div class="links-page" data-aos="fade-up">
	<PageBanner
		title="友情链接"
		desc="我的朋友们和帮助过我的人"
		footer="友情链接"
		image="https://cdn.lightxi.com/cloudreve/uploads/2025/08/03/S9ethiQA_9298cf4b972a1ea927236a66a18e4e27.jpg"
	/>
	<div class="container">
		<!-- 链接分组 -->
		<div
			v-for="(category, categoryIndex) in linkCategories"
			:key="category.name"
			class="category-section"
			data-aos="fade-up"
			:data-aos-delay="100 * categoryIndex"
		>
			<!-- 分组标题和描述 -->
			<div class="category-header">
				<h2 class="category-title">
					{{ category.name }}
				</h2>
				<p class="category-description">
					{{ category.description }}
				</p>
			</div>

			<!-- 该分组的链接网格 -->
			<div class="links-grid">
				<a
					v-for="(link, linkIndex) in category.links"
					:key="link.name"
					:href="link.url"
					target="_blank"
					rel="noopener noreferrer"
					class="link-card"
					data-aos="fade-up"
					:data-aos-delay="100 * categoryIndex + 50 * linkIndex"
				>
					<div class="link-header">
						<div class="link-avatar">
							<img
								:src="link.logo"
								:alt="link.name"
								loading="lazy"
								@error="(event) => { (event.target as HTMLImageElement).src = '/favicon.ico' }"
							>
						</div>
						<div class="link-info">
							<div class="link-name">
								{{ link.name }}
							</div>
							<div class="link-meta">
								<span v-if="link.framework" class="meta-tag framework">
									<Icon v-tip="link.framework" :name="getArchIcon(link.framework as any)" />
								</span>
								<span v-if="link.platform" class="meta-tag platform">
									<Icon v-tip="link.platform" :name="getArchIcon(link.platform as any)" />
								</span>
							</div>
						</div>
					</div>
					<div class="link-content">
						<div class="link-description">
							{{ link.description }}
						</div>
					</div>
				</a>
			</div>
		</div>

		<!-- 空状态 -->
		<div v-if="linkCategories.length === 0" class="empty-state">
			<p>暂无友情链接</p>
		</div>

		<PostComment />
	</div>
</div>
</template>

<style lang="scss" scoped>
// 容器样式
.container {
	margin: 0 auto;
	padding: 1rem 0.5rem;
}

// 分组区域
.category-section {
	margin-bottom: 3rem;

	&:last-child {
		margin-bottom: 0;
	}
}

// 分组标题和描述容器
.category-header {
	position: relative;
	margin-bottom: 2rem;
	padding-bottom: 1rem;
	border-bottom: 2px solid var(--c-border);

	&::after {
		content: "";
		position: absolute;
		bottom: -2px;
		left: 0;
		width: 60px;
		height: 2px;
		background: var(--main-color);
		transition: width 0.3s ease;
	}

	.category-section:hover &::after {
		width: 120px;
	}

	@media (max-width: 768px) {
		margin-bottom: 1.5rem;
	}
}

// 分组标题
.category-title {
	margin: 0 0 0.5rem;
	font-size: 1.8rem;
	font-weight: 700;
	line-height: 1.2;
	color: var(--font-color);
	transition: color 0.3s ease;

	.category-section:hover & {
		color: var(--main-color);
	}

	@media (max-width: 768px) {
		font-size: 1.5rem;
	}

	@media (max-width: 480px) {
		font-size: 1.3rem;
	}
}

// 分组描述
.category-description {
	margin: 0;
	font-size: 1rem;
	font-style: italic;
	line-height: 1.5;
	color: var(--font-color-2);
	transition: color 0.3s ease;

	.category-section:hover & {
		color: var(--main-color);
	}

	@media (max-width: 768px) {
		font-size: 0.9rem;
	}

	@media (max-width: 480px) {
		font-size: 0.85rem;
	}
}

// 网格布局
.links-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	align-items: start;
	gap: 0.5rem;

	// 中等屏幕：2列布局
	@media (max-width: 1199px) and (min-width: 768px) {
		grid-template-columns: repeat(3, 1fr);
	}

	// 小屏幕：1列布局
	@media (max-width: 767px) {
		grid-template-columns: 1fr;
	}
}

// 链接卡片
.link-card {
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	height: 140px;
	padding: 1rem;
	border: 1px solid var(--c-border);
	border-radius: 12px;
	box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
	background: var(--card-bg);
	text-decoration: none;
	color: inherit;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	// 添加渐变背景
	&::before {
		content: "";
		position: absolute;
		opacity: 0;
		inset: 0;
		background:
			linear-gradient(
				135deg,
				rgb(var(--main-color-rgb, 59, 130, 246), 0.02) 0%,
				rgb(var(--main-color-rgb, 59, 130, 246), 0.05) 100%
			);
		transition: opacity 0.3s ease;
	}

	&:hover {
		border-color: var(--main-color);
		box-shadow: 0 8px 25px rgb(0 0 0 / 12%);

		&::before {
			opacity: 1;
		}

		.link-avatar {
			border-color: var(--main-color);
			transform: scale(1.1);
		}

		.link-name {
			color: var(--main-color);
		}
	}

	// 内容区域对齐
	.link-content {
		justify-content: space-between;
	}
}

// 链接头部
.link-header {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.75rem;
	position: relative;
	margin-bottom: 0.75rem;
	padding-bottom: 0.75rem;
	border-bottom: 1px solid var(--c-border);
	transition: border-color 0.3s ease;
	will-change: border-color;
	z-index: 1;
}

// 头像样式
.link-avatar {
	flex-shrink: 0;
	overflow: hidden;
	width: 40px;
	height: 40px;
	border: 2px solid var(--c-border);
	border-radius: 12px;
	box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, border-color;

	img {
		width: 100%;
		height: 100%;
		transition: transform 0.3s ease;
		object-fit: cover;
	}
}

// 链接信息
.link-info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.5rem;
	position: relative;
	min-width: 0;
	z-index: 1;
}

.link-name {
	overflow: hidden;
	font-size: 0.95rem;
	font-weight: 700;
	line-height: 1.2;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);
	transition: color 0.3s ease;
}

.link-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 0.375rem;
}

.meta-tag {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: 1px solid var(--c-border);
	border-radius: 8px;
	background: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 600;
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		background: var(--main-color-bg);
	}

	.icon {
		width: 0.7rem;
		height: 0.7rem;
		color: var(--main-color);
	}
}

// 链接内容
.link-content {
	display: flex;
	flex: 1;
	flex-direction: column;
	position: relative;
	overflow: hidden;
	z-index: 1;

	.link-description {
		display: -webkit-box;
		flex: 1;
		overflow: hidden;
		max-height: calc(1.4em * 2);
		font-size: 0.85rem;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		line-height: 1.4;
		text-overflow: ellipsis;
		color: var(--font-color-2);
		transition: color 0.3s ease;
		-webkit-box-orient: vertical;
	}
}

// 空状态
.empty-state {
	grid-column: 1 / -1;
	padding: 3rem;
	font-size: 1.1rem;
	text-align: center;
	color: var(--font-color-3);
}

// 响应式优化
@media (max-width: 1200px) {
	.links-grid {
		grid-template-columns: repeat(3, 1fr);
	}
}

@media (max-width: 900px) {
	.links-grid {
		grid-template-columns: repeat(2, 1fr);
	}
}

@media (max-width: 600px) {
	.links-grid {
		grid-template-columns: 1fr;
	}

	.link-card {
		height: 120px;
		padding: 0.875rem;
	}

	.link-avatar {
		width: 36px;
		height: 36px;
	}

	.link-name {
		font-size: 0.9rem;
	}

	.link-description {
		font-size: 0.8rem;
	}
}

@media (max-width: 480px) {
	.link-card {
		height: 110px;
		padding: 0.75rem;
	}

	.link-avatar {
		width: 32px;
		height: 32px;
	}

	.link-name {
		font-size: 0.85rem;
	}

	.link-description {
		max-height: calc(1.3em * 2);
		font-size: 0.75rem;
		line-height: 1.3;
	}

	.meta-tag {
		padding: 0.2rem 0.4rem;
		font-size: 0.65rem;
	}
}
</style>
