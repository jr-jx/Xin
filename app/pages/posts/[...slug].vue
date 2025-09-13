<script setup lang="ts">
import blogConfig from '~~/blog.config'
import { useContentLoader } from '~/composables/useContentLoader'

const route = useRoute()

// 加载所有文章数据（用于统计信息）
useContentLoader()

// 获取文章数据
const { data: post, refresh } = await useAsyncData(`post-${route.path}`, () => {
	return queryCollection('post').path(route.path).first()
})

// 监听路由变化，强制刷新数据
watch(() => route.path, () => {
	refresh()
})

useSeoMeta({
	title: post.value?.title,
	description: post.value?.description,
})

// 格式化日期
function formatDate(dateString?: string) {
	if (!dateString)
		return ''
	const date = new Date(dateString)
	return date.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	})
}

// 复制分享链接
const copied = ref(false)
function copyShare() {
	const share = `【${blogConfig.site.title}】${post.value?.title}\n\n${post.value?.description}\n\n${blogConfig.site.url}${route.path}`
	navigator.clipboard.writeText(share)
	copied.value = true
	setTimeout(() => {
		copied.value = false
	}, 1000)
}
</script>

<template>
<div class="post-page">
	<div
		v-if="post"
		:key="route.path"
		class="post-container"
	>
		<div class="content-layout">
			<!-- 文章主体 -->
			<div id="main-content" class="post-main" data-aos="fade-up">
				<article class="post-article">
					<!-- 文章头部 -->
					<header class="post-header">
						<!-- 背景图片遮罩 -->
						<div
							v-if="(post as any).cover || (post as any).image"
							class="post-header-bg"
							:style="{
								backgroundImage: `url(${(post as any).cover || (post as any).image})`,
							}"
						>
							<div class="post-header-overlay" />
						</div>

						<!-- 文章头部内容 -->
						<div class="post-header-content">
							<!-- 分类标签 -->
							<div v-if="post.categories && post.categories.length" class="post-categories">
								<span
									v-for="category in post.categories"
									:key="category"
									class="post-category"
								>
									{{ category }}
								</span>

								<div class="post-share" @click="copyShare">
									<Icon v-if="!copied" name="i-carbon-share" />
									<Icon v-else name="i-carbon-checkmark" />
									<span>文字分享</span>
								</div>
							</div>

							<!-- 文章标题 -->
							<h1 class="post-title">
								{{ post.title || '未命名文章' }}
							</h1>

							<!-- 文章元信息 -->
							<div class="post-info">
								<!-- 发布时间 -->
								<div v-if="post.date" class="post-info-item">
									<Icon name="i-carbon-calendar" class="post-info-icon" />
									<time>{{ formatDate(post.date) }}</time>
								</div>

								<!-- 更新时间 -->
								<div v-if="(post as any).updated && (post as any).updated !== post.date" class="post-info-item">
									<Icon name="i-carbon-time" class="post-info-icon" />
									<span>更新于 {{ formatDate((post as any).updated) }}</span>
								</div>

								<!-- 阅读时间 -->
								<div class="post-info-item">
									<Icon name="i-carbon-time" class="post-info-icon" />
									<span>{{ post.readingTime?.minutes }} 分钟</span>
								</div>

								<!-- 字数统计 -->
								<div class="post-info-item">
									<Icon name="i-ri-text" class="post-info-icon" />
									<span>{{ post.readingTime?.words }} 字</span>
								</div>
							</div>
						</div>
					</header>

					<!-- 文章内容 -->
					<ContentRenderer :value="post" class="post-content" :class="getPostTypeClassName(post.type, { prefix: 'md' })" />

					<!-- 文章底部 -->
					<footer class="post-footer">
						<div class="post-license">
							<div class="post-license-header">
								许可协议
							</div>
							<div class="post-license-content">
								本文采用
								<a :href="blogConfig.license.url" target="_blank" rel="noopener noreferrer">
									<Icon :name="blogConfig.license.icon" />
									{{ blogConfig.license.name }}
								</a>
								协议，转载请注明出处。
							</div>
						</div>
						<PostSurround />
						<PostComment />
					</footer>
				</article>
			</div>

			<!-- 侧边栏 -->
			<AppSidebar data-aos="fade-up" />
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
/* 通用玻璃卡片样式 */
%glass-card {
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.15rem 0.35rem;
	border: 1px solid rgb(255 255 255 / 20%);
	border-radius: var(--radius);
	background: rgb(255 255 255 / 10%);
	backdrop-filter: blur(10px);
	color: rgb(255 255 255 / 90%);
	transition: all 0.2s ease;

	&:hover {
		border-color: rgb(255 255 255 / 30%);
		background: rgb(255 255 255 / 20%);
	}
}

%glass-card-subtle {
	padding: 0.15rem 0.35rem;
	border: 1px solid rgb(255 255 255 / 15%);
	border-radius: var(--radius);
	background: rgb(255 255 255 / 8%);
	backdrop-filter: blur(5px);
	transition: all 0.2s ease;

	&:hover {
		border-color: rgb(255 255 255 / 25%);
		background: rgb(255 255 255 / 12%);
	}
}

.post-page {
	min-height: 100vh;
	margin-top: 0.5rem;
}

.post-container {
	max-width: 1250px;
	margin: 0 auto;
}

/* 与首页一致的内容布局 */
.content-layout {
	display: grid;
	grid-template-columns: 3fr 1fr;
	gap: 0.5rem;
	padding: 0 0.5rem;

	@media screen and (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}

.post-main {
	overflow-x: hidden; /* 隐藏横向滚动条 */
	min-width: 0; /* 防止子元素撑开容器 */
	scroll-margin: var(--space-12);

	@media (min-width: 1024px) {
		grid-column: 1;
	}
}

.post-article {
	overflow: hidden;
	min-width: 0; /* 防止子元素撑开容器 */
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
}

/* 确保代码块不会撑开容器 */
.post-content {
	overflow-x: auto;
	min-width: 0;

	/* 代码块容器样式 */
	:deep(.z-codeblock) {
		overflow-x: auto;
		max-width: 100%;

		pre {
			overflow-x: auto;
			max-width: 100%;
			white-space: pre;
			word-wrap: break-word;

			&.wrap {
				white-space: pre-wrap;
				word-break: break-all;
			}
		}
	}
}

.post-header {
	display: flex;
	align-items: flex-end;
	position: relative;
	overflow: hidden;
	min-height: 120px;
	margin-bottom: 0;
	border-radius: var(--radius) var(--radius) 0 0;
	transition: all 0.3s ease;

	@media (min-width: 1024px) {
		min-height: 160px;
	}

	&:hover {
		.post-share {
			display: flex;
		}
	}
}

.post-header-bg {
	position: absolute;
	inset: 0;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
	z-index: 1;
}

.post-header-overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(135deg, rgb(0 0 0 / 40%) 0%, rgb(0 0 0 / 20%) 50%, rgb(0 0 0 / 60%) 100%);
	z-index: 2;
}

.post-header-content {
	position: relative;
	width: 100%;
	padding: 1rem 1.5rem;
	color: white;
	z-index: 3;

	@media (min-width: 1024px) {
		padding: 1.5rem 1.5rem 2rem;
	}
}

.post-categories {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-bottom: 1rem;
}

.post-share {
	@extend %glass-card;

	display: none;
	font-size: 0.875rem;
	cursor: pointer;
}

.post-category {
	@extend %glass-card;

	font-size: 0.875rem;
	font-weight: 500;
}

.post-tag {
	@extend %glass-card;

	padding: 0.25rem 0.625rem;
	border-color: var(--c-border);
	background: transparent;
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--font-color-2);

	&:hover {
		border-color: var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.post-title {
	margin-bottom: 1.25rem;
	font-size: 1.75rem;
	font-weight: 700;
	letter-spacing: -0.025em;
	line-height: 1.2;
	text-shadow: 0 1px 3px rgb(0 0 0 / 40%);
	color: white;

	@media (min-width: 1024px) {
		font-size: 2.125rem;
	}

	@media (min-width: 1280px) {
		font-size: 2.5rem;
	}

	@media (max-width: 768px) {
		margin-bottom: 1rem;
		font-size: 1.375rem;
	}
}

.post-info {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: rgb(255 255 255 / 85%);
}

.post-info-item {
	@extend %glass-card-subtle;

	display: flex;
	align-items: center;
}

.post-info-icon {
	opacity: 0.9;
	width: 1rem;
	height: 1rem;
	margin-right: 0.375rem;
	color: rgb(255 255 255 / 90%);
}

.post-footer {
	padding: 1rem;
	border-top: 1px solid var(--c-border);
	background-color: transparent;

	@media (min-width: 1024px) {
		padding: 1.5rem;
	}

	.post-license {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1.5rem;
		border: var(--border);
		border-radius: var(--radius);
		background-color: var(--c-bg-2);
	}

	.post-license-header {
		font-size: 1rem;
		font-weight: 700;
		color: var(--font-color);
	}

	.post-license-content {
		font-size: 0.875rem;
		color: var(--font-color-2);
	}
}

.share-section {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.share-label {
	font-size: 0.875rem;
	color: var(--font-color-2);
}

.share-button {
	@extend %glass-card;

	padding: 0.5rem 0.75rem;
	border-color: var(--c-border);
	background: transparent;
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--font-color-2);
	cursor: pointer;

	&:hover {
		border-color: var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.share-icon {
	width: 1rem;
	height: 1rem;
	margin-right: 0.25rem;
}

/* 自定义滚动条 */
::-webkit-scrollbar {
	width: 6px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	border-radius: 3px;
	background: rgb(156 163 175 / 50%);

	&:hover {
		background: rgb(156 163 175 / 70%);
	}
}

/* 代码块优化 */
.prose pre {
	border-radius: var(--radius);
}

.prose code {
	font-size: 0.875rem;
}

/* 表格优化 */
.prose table {
	overflow: hidden;
	border-radius: var(--radius);
}

/* 引用块优化 */
.prose blockquote {
	margin: 1.5rem 0;
}

/* 响应式设计优化 */
@media (max-width: 768px) {
	.post-header {
		min-height: 180px;
	}

	.post-header-content {
		padding: 1.25rem 1rem 1.5rem;
	}

	.post-categories {
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.post-category {
		padding: 0.25rem 0.625rem;
		font-size: 0.8rem;
	}

	.post-info {
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.post-info-item {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	.post-share {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}

	/* 移动端通用样式调整 */
	.glass-card,
	.glass-card-subtle {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
}
</style>
