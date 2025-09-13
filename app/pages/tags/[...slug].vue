<script setup lang="ts">
import { useContentLoader } from '~/composables/useContentLoader'

const route = useRoute()

// 获取标签 slug
const tagSlug = computed(() => route.params.slug?.[0] || '')

// 使用内容加载器
const { getPostsByTag, postsPending } = useContentLoader()

// 获取当前标签的文章
const tagPosts = computed(() => getPostsByTag(tagSlug.value))

// 获取标签名称
const tagName = computed(() => tagSlug.value || '所有标签')

// SEO 设置
useSeoMeta({
	title: `${tagName.value}`,
	description: `浏览包含 ${tagName.value} 标签的所有文章`,
})
</script>

<template>
<div class="tag-page">
	<!-- 文章列表 -->
	<div class="content-layout">
		<div class="posts-section">
			<!-- 标签导航栏 -->
			<CategoriesBar :active-category="tagSlug" type="tag" />

			<!-- 文章列表 -->
			<div v-if="postsPending" class="loading-state" data-aos="fade-up">
				<div class="loading-spinner" />
				<p>正在加载文章...</p>
			</div>

			<PostList
				v-else
				:posts="tagPosts"
				:loading="false"
			/>
		</div>

		<!-- 侧边栏 -->
		<AppSidebar data-aos="fade-up" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.tag-page {
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
