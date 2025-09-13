<script setup lang="ts">
import type { Article } from '~/types/article'
import { useContentLoader } from '~/composables/useContentLoader'
import { useContentStore } from '~/stores/content'

const route = useRoute()
const contentStore = useContentStore()
const { posts } = storeToRefs(contentStore)

// 加载文章数据
useContentLoader()

// 获取分页参数
const currentPage = computed(() => {
	const slug = route.params.slug?.[0]
	if (slug === 'page' && route.params.slug?.[1]) {
		return Number.parseInt(route.params.slug[1]) || 1
	}
	return 1
})

// 分页设置
const pageSize = 20

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

// 分页后的文章数据
const paginatedPostsByYear = computed(() => {
	const allPosts = postsByYear.value.flatMap(yearGroup =>
		yearGroup.posts.map(post => ({ ...post, year: yearGroup.year })),
	)

	const start = (currentPage.value - 1) * pageSize
	const end = start + pageSize
	const pagePosts = allPosts.slice(start, end)

	// 重新按年份分组
	const pageYearMap = new Map<number, (Article & { year: number })[]>()
	pagePosts.forEach((post) => {
		const year = post.year
		if (!pageYearMap.has(year)) {
			pageYearMap.set(year, [])
		}
		pageYearMap.get(year)!.push(post)
	})

	return Array.from(pageYearMap.entries())
		.sort(([a], [b]) => b - a)
		.map(([year, posts]) => ({ year, posts }))
})

// 总页数
const totalPages = computed(() => {
	const totalPosts = postsByYear.value.reduce((sum, yearGroup) => sum + yearGroup.posts.length, 0)
	return Math.max(1, Math.ceil(totalPosts / pageSize))
})

// 分页导航
const pageNumbers = computed<(number | string)[]>(() => {
	const total = totalPages.value
	const current = currentPage.value
	const pages: (number | string)[] = []

	if (total <= 7) {
		for (let i = 1; i <= total; i++) pages.push(i)
		return pages
	}

	pages.push(1)
	if (current > 3)
		pages.push('...')

	const start = Math.max(2, current - 1)
	const end = Math.min(total - 1, current + 1)
	for (let i = start; i <= end; i++) pages.push(i)

	if (current < total - 2)
		pages.push('...')
	pages.push(total)

	return pages
})

// 页面标题
useSeoMeta({
	title: currentPage.value === 1 ? '文章归档' : `文章归档 - 第 ${currentPage.value} 页`,
	description: '按时间顺序浏览所有文章',
})
</script>

<template>
<div class="archives-page">
	<!-- 页面标题 -->
	<div class="page-header" data-aos="fade-up">
		<h1 class="page-title">
			文章归档
		</h1>
		<span class="total-count">{{ posts.length }} 篇</span>
		<div v-if="currentPage > 1" class="page-indicator">
			第 {{ currentPage }} 页，共 {{ totalPages }} 页
		</div>
	</div>

	<!-- 主要内容区域 -->
	<div class="content-layout">
		<!-- 归档内容 -->
		<div class="archives-section">
			<!-- 年份文章列表 -->
			<div class="archives-container">
				<div
					v-for="(yearGroup, index) in paginatedPostsByYear"
					:key="yearGroup.year"
					class="year-group"
					data-aos="fade-up"
					:data-aos-delay="50 * index"
				>
					<!-- 年份标题 -->
					<div class="year-header">
						<h2 class="year-title">
							{{ yearGroup.year }}
						</h2>
						<div class="year-info">
							<span class="year-age">{{ new Date().getFullYear() - yearGroup.year }}岁</span>
							<span class="year-stats">
								{{ Math.round(yearGroup.posts.reduce((sum, post) => {
									const text = post.body?.text || post.description || ''
									return sum + text.length
								}, 0) / 10000 * 10) / 10 }}万字{{ yearGroup.posts.length }}篇
							</span>
						</div>
					</div>

					<!-- 该年份的文章列表 -->
					<div class="year-posts">
						<div
							v-for="post in yearGroup.posts"
							:key="post.path"
							class="post-item"
						>
							<div
								class="post-card"
								data-aos="fade-up"
								:data-aos-delay="50 * index"
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
								<div class="post-content">
									<!-- 文章标题 - 点击跳转到文章 -->
									<NuxtLink :to="post.path" class="post-title-link">
										<h3 class="post-title">
											{{ post.title || '未命名文章' }}
										</h3>
									</NuxtLink>

									<!-- 标签区域 -->
									<div class="post-tags">
										<!-- 分类标签 - 点击跳转到分类页 -->
										<NuxtLink
											v-if="post.categories && post.categories[0]"
											:to="`/categories/${post.categories[0]}`"
											class="post-category"
										>
											{{ post.categories[0] }}
										</NuxtLink>

										<!-- 标签 - 点击跳转到标签页 -->
										<NuxtLink
											v-if="post.tags && post.tags.length > 0"
											:to="`/tags/${post.tags[0]}`"
											class="post-tag"
										>
											#{{ post.tags[0] }}
										</NuxtLink>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 分页导航 -->
			<div v-if="totalPages > 1" class="pagination-section" data-aos="fade-up">
				<div class="pagination">
					<!-- 上一页 -->
					<NuxtLink
						v-if="currentPage > 1"
						:to="currentPage === 2 ? '/archives' : `/archives/page/${currentPage - 1}`"
						class="pagination-button pagination-prev"
					>
						<Icon name="i-carbon-chevron-left" class="pagination-icon" />
						上一页
					</NuxtLink>

					<!-- 页码 -->
					<template v-for="p in pageNumbers" :key="`p-${p}`">
						<span v-if="typeof p === 'string'" class="pagination-ellipsis">{{ p }}</span>
						<NuxtLink
							v-else
							:to="p === 1 ? '/archives' : `/archives/page/${p}`"
							class="pagination-number" :class="[
								currentPage === p ? 'pagination-number-active' : 'pagination-number-default',
							]"
						>
							{{ p }}
						</NuxtLink>
					</template>

					<!-- 下一页 -->
					<NuxtLink
						v-if="currentPage < totalPages"
						:to="`/archives/page/${currentPage + 1}`"
						class="pagination-button pagination-next"
					>
						下一页
						<Icon name="i-carbon-chevron-right" class="pagination-icon" />
					</NuxtLink>
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
	margin-bottom: 2rem;
	padding: 2rem 1rem;
	text-align: center;
}

.page-title {
	margin: 0 0 0.5rem;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--font-color);
}

.page-description {
	margin: 0 0 0.5rem;
	font-size: 1.125rem;
	color: var(--font-color-2);
}

.page-indicator {
	font-size: 1rem;
	font-weight: 500;
	color: var(--main-color);
}

.stats-section {
	margin-bottom: 3rem;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
	gap: 1rem;
	max-width: 600px;
	margin: 0 auto;
}

.stat-item {
	padding: 1.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	text-align: center;
	transition: all 0.3s ease;

	&:hover {
		border-color: var(--main-color);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
}

.stat-number {
	margin-bottom: 0.5rem;
	font-size: 2rem;
	font-weight: 700;
	color: var(--main-color);
}

.stat-label {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--font-color-2);
}

.archives-container {
	max-width: 800px;
	margin: 0 auto;
	margin-bottom: 3rem;
}

.year-group {
	margin-bottom: 3rem;
}

.year-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	margin-bottom: 1.5rem;
	padding-bottom: 0.75rem;
	border-bottom: 2px solid var(--main-color);
}

.year-title {
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
	color: var(--font-color);
}

.year-count {
	padding: 0.25rem 0.75rem;
	border-radius: var(--radius);
	background-color: var(--main-color);
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--white);
}

.year-posts {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.post-item {
	border: none;
	border-radius: 0;
	background-color: transparent;
	transition: all 0.2s ease;

	&:hover {
		.post-title {
			color: var(--main-color);
		}

		.post-image {
			border-color: var(--main-color);
			transform: scale(1.05);
		}
	}
}

.post-card {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 1rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
}

.post-image-link {
	display: block;
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	width: 80px;
	height: 80px;
	border: var(--border);
	border-radius: var(--radius-sm);
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

.post-content {
	flex: 1;
	min-width: 0;
}

.post-title-link {
	text-decoration: none;
	color: inherit;
}

.post-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0 0 0.75rem;
	font-size: 1rem;
	font-weight: 500;
	-webkit-line-clamp: 2;
	line-height: 1.4;
	color: var(--font-color);
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

.post-category,
.post-tag {
	padding: 0.125rem 0.5rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-sm);
	background-color: var(--c-bg-2);
	font-size: 0.75rem;
	font-weight: 500;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}

.post-date {
	font-weight: 500;
	color: var(--font-color-2);
}

// 分页样式
.pagination-section {
	margin-top: 3rem;
}

.pagination {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
}

.pagination-button {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.75rem 1rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: transparent;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}

.pagination-icon {
	width: 1rem;
	height: 1rem;
}

.pagination-number {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: transparent;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		color: var(--main-color);
	}
}

.pagination-number-active {
	border-color: var(--main-color);
	background-color: var(--main-color);
	color: var(--white);
}

.pagination-ellipsis {
	padding: 0 0.5rem;
	font-size: 0.875rem;
	color: var(--font-color-2);
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

	.stats-grid {
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.stat-item {
		padding: 1rem;
	}

	.stat-number {
		font-size: 1.5rem;
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
		padding: 0.75rem 1rem;
	}

	.post-image-link {
		width: 100%;
		height: 100px;
	}

	.post-image {
		width: 100%;
		height: 100%;
	}

	.post-title {
		font-size: 1rem;
	}

	.post-meta {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.pagination {
		gap: 0.25rem;
	}

	.pagination-button {
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
	}
}
</style>
