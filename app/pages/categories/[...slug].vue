<script setup lang="ts">
import { useContentLoader } from '../../composables/useContentLoader'

const route = useRoute()

// 获取分类 slug
const categorySlug = computed(() => route.params.slug?.[0] || '')

// 使用内容加载器
const { getPostsByCategory, postsPending, publishedPosts } = useContentLoader()

// 获取当前分类的文章
const categoryPosts = computed(() => {
	if (categorySlug.value === 'featured') {
		// 精选分类：返回所有已发布的文章
		return publishedPosts.value
	}
	return getPostsByCategory(categorySlug.value)
})

// 获取分类名称
const categoryName = computed(() => {
	if (categorySlug.value === 'featured')
		return '精选'
	return categorySlug.value || '所有分类'
})

// SEO 设置
useSeoMeta({
	title: `${categoryName.value}`,
	description: `浏览 ${categoryName.value} 分类下的所有文章`,
})
</script>

<template>
<div class="category-page">
	<!-- 文章列表 -->
	<div class="content-layout">
		<div class="posts-section">
			<!-- 分类导航栏 -->
			<CategoriesBar :active-category="categorySlug" />

			<!-- 文章列表 -->
			<div v-if="postsPending" class="loading-state" data-aos="fade-up">
				<div class="loading-spinner" />
				<p>正在加载文章...</p>
			</div>

			<PostList
				v-else
				:posts="categoryPosts"
				:loading="false"
			/>
		</div>

		<!-- 侧边栏 -->
		<AppSidebar data-aos="fade-up" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.category-page {
	min-height: 100vh;
	margin-top: 0.5rem;
	padding: 0 0.5rem;
}

.page-header {
	margin-bottom: 2rem;
	padding: 2rem 0;
	text-align: center;
}

.page-title {
	margin-bottom: 0.5rem;
	font-size: 2.5rem;
	font-weight: 700;
	color: var(--font-color);
}

.page-description {
	margin: 0;
	font-size: 1.125rem;
	color: var(--font-color-2);
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 0;
	color: var(--font-color-2);
}

.loading-spinner {
	width: 2rem;
	height: 2rem;
	margin-bottom: 1rem;
	border: 2px solid var(--c-border);
	border-top: 2px solid var(--main-color);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.posts-section {
	grid-column: span 1;
}

.content-layout {
	display: grid;
	grid-template-columns: 3fr 1fr;
	gap: 0.5rem;

	@media screen and (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}
</style>
