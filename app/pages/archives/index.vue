<script setup lang="ts">
import type { Article } from '~/types/article'
import { useContentLoader } from '~/composables/useContentLoader'
import { useContentStore } from '~/stores/content'

const contentStore = useContentStore()
const { posts } = storeToRefs(contentStore)

// 加载文章数据
useContentLoader()

// 按年份分组文章
const postsByYear = computed(() => {
	const yearMap = new Map<number, Article[]>()

	posts.value.forEach((post) => {
		const year = post.date ? new Date(post.date).getFullYear() : new Date().getFullYear()
		if (!yearMap.has(year)) {
			yearMap.set(year, [])
		}
		yearMap.get(year)!.push(post)
	})

	// 按年份降序排序
	return Array.from(yearMap.entries())
		.sort(([a], [b]) => b - a)
		.map(([year, posts]) => ({
			year,
			posts: posts.sort((a, b) => {
				const dateA = a.date ? new Date(a.date).getTime() : 0
				const dateB = b.date ? new Date(b.date).getTime() : 0
				return dateB - dateA
			}),
		}))
})

// 页面标题
useSeoMeta({
	title: '文章归档',
	description: '按时间顺序浏览所有文章',
})
</script>

<template>
<div class="archives-page">
	<!-- 主要内容区域 -->
	<div class="content-layout">
		<!-- 归档内容 -->
		<div class="archives-section">
			<div class="page-header" data-aos="fade-up">
				<h1 class="page-title">
					文章
					<sup class="total-count">{{ posts.length }}</sup>
				</h1>
			</div>
			<!-- 年份文章列表 -->
			<div class="archives-container">
				<div
					v-for="(yearGroup, index) in postsByYear"
					:key="yearGroup.year"
					class="year-group"
					data-aos="fade-up"
					:data-aos-delay="50 * index"
				>
					<!-- 年份标题 -->
					<div class="year-header">
						<span class="year-title">{{ yearGroup.year }}</span>
					</div>

					<!-- 该年份的文章列表 -->
					<div class="year-posts">
						<div
							v-for="(post, indexi) in yearGroup.posts"
							:key="post.path"
							class="post-item"
						>
							<div
								class="post-card"
								data-aos="fade-up"
								:data-aos-delay="50 * indexi"
							>
								<!-- 文章图片 - 点击跳转到文章 -->
								<NuxtLink :to="post.path" class="post-image-link">
									<div class="post-image">
										<NuxtImg
											v-if="post.image"
											:src="post.image"
											:alt="post.title || '文章封面'"
											class="image"
											loading="lazy"
										/>
										<div v-else class="image-placeholder">
											<Icon name="i-carbon-document" class="placeholder-icon" />
										</div>
									</div>
								</NuxtLink>

								<!-- 文章信息 -->
								<div class="archives-content">
									<!-- 文章标题 - 点击跳转到文章 -->
									<NuxtLink :to="post.path" class="post-title-link">
										<span class="post-title">{{ post.title || '未命名文章' }}</span>
									</NuxtLink>

									<!-- 标签区域 -->
									<div class="post-tags">
										<!-- 标签 - 点击跳转到标签页 -->
										<NuxtLink
											v-if="post.tags && post.tags.length > 0"
											:to="`/tags/${post.tags[0]}`"
											class="post-tag"
										>
											<Icon name="material-symbols:tag" />
											{{ post.tags[0] }}
										</NuxtLink>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- 侧边栏 -->
		<AppSidebar data-aos="fade-up" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.archives-page {
	min-height: 100vh;
	margin-top: 0.5rem;
	padding: 0 0.5rem;
}

.page-header {
	display: flex;
	align-items: center;
	position: relative;
	margin-bottom: 1rem;
}

.page-title {
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
	color: var(--font-color);
}

.total-count {
	font-size: 1rem;
	font-weight: 400;
	line-height: 1;
	vertical-align: text-top;
	color: var(--font-color-3);
}

.page-description {
	margin: 0;
	font-size: 1.125rem;
	color: var(--font-color-2);
}

/* 两栏布局 */
.content-layout {
	display: grid;
	grid-template-columns: 3fr 1fr;
	gap: 0.5rem;

	@media screen and (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}

.archives-section {
	grid-column: span 1;
	padding: 1.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
}

.archives-container {
	max-width: none;
	margin: 0;
}

.year-group {
	margin-bottom: 2.5rem;

	&:last-child {
		margin-bottom: 0;
	}
}

.year-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.year-title {
	font-size: 1rem;
	color: var(--font-color-2);
}

.year-posts {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.post-item {
	border: none;
	border-radius: 0;
	background-color: transparent;
	transition: all 0.2s ease;
}

.post-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	transition: all 0.2s ease;
}

.post-image-link {
	display: block;
	text-decoration: none;
	color: inherit;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.02);
	}
}

.post-image {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	width: 151px;
	height: 80px;
	border: var(--border);
	border-radius: var(--radius-lg);
	background-color: var(--card-bg);
	transition: all 0.2s ease;

	.image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.image-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		color: var(--font-color-3);
	}

	.placeholder-icon {
		font-size: 2rem;
	}
}

.archives-content {
	flex: 1;
	min-width: 0;
}

.post-title-link {
	display: inline-flex;
	text-decoration: none;
	color: var(--font-color);
	transition: color 0.2s ease;

	&:hover {
		color: var(--main-color);
	}
}

.post-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0 0 0.75rem;
	font-size: 1rem;
	font-weight: 500;
	-webkit-line-clamp: 2;
	line-height: 1.4;
	color: inherit;
	transition: color 0.2s ease;
	-webkit-box-orient: vertical;
}

.post-tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.75rem;
	font-size: 0.875rem;
	color: var(--font-color-2);
}

.post-tag {
	font-size: 0.75rem;
	font-weight: 500;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		color: var(--main-color);
	}
}

.post-arrow {
	color: var(--font-color-3);
	transition: all 0.3s ease;

	.post-item:hover & {
		color: var(--main-color);
	}
}

@media (max-width: 768px) {
	.archives-page {
		padding: 0 0.25rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 2rem;
	}

	.year-header {
		margin-bottom: 1rem;
	}

	.year-title {
		font-size: 1.5rem;
	}

	.post-card {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.75rem;
	}

	.post-image-link {
		width: 100%;
	}

	.post-image {
		width: 100%;
		height: 150px;
	}

	.post-title {
		font-size: 1rem;
	}

	.post-tags {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}
}
</style>
