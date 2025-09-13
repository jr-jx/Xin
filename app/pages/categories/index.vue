<script setup lang="ts">
import type { Article } from '~/types/article'
import { useContentLoader } from '~/composables/useContentLoader'
import { useContentStore } from '~/stores/content'

const contentStore = useContentStore()
const { posts } = storeToRefs(contentStore)

// 加载文章数据
useContentLoader()

// 获取所有分类
const allCategories = computed(() => {
	const map = new Map<string, number>()
	posts.value.forEach((p: Article) => {
		const key = (p.categories && p.categories[0]) || '未分类'
		map.set(key, (map.get(key) || 0) + 1)
	})
	return Array.from(map.entries()).map(([name, count]) => ({
		name,
		count,
		slug: name === '未分类' ? 'uncategorized' : name,
		tip: `查看 ${name} 分类的文章`,
	}))
})

// 页面标题
useSeoMeta({
	title: '全部分类',
	description: '浏览所有文章分类',
})
</script>

<template>
<div class="categories-page">
	<!-- 页面标题 -->
	<div class="page-header" data-aos="fade-up">
		<h1 class="page-title">
			全部分类
		</h1>
	</div>

	<!-- 分类标签列表 -->
	<div class="categories-container">
		<div class="categories-list">
			<NuxtLink
				v-for="(category, index) in allCategories"
				:key="category.slug"
				:to="`/categories/${category.slug}`"
				class="category-tag"
				data-aos="fade-up"
				:data-aos-delay="50 * index"
			>
				<span class="category-name">
					<Icon name="material-symbols:category" />
					{{ category.name }}
				</span>
				<span class="category-count">{{ category.count }}</span>
			</NuxtLink>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.categories-page {
	min-height: 100vh;
	margin-top: 0.5rem;
	padding: 0 0.5rem;
}

.page-header {
	padding: 2rem 1rem;
	text-align: center;
}

.page-title {
	margin: 0;
	font-size: 2rem;
	font-weight: 700;
	color: var(--font-color);
}

.categories-container {
	max-width: 800px;
	margin: 0 auto;
}

.categories-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5rem;
}

.category-tag {
	display: inline-flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	min-width: 120px;
	padding: 0.75rem 1.25rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	text-decoration: none;
	color: inherit;
	transition: all 0.3s ease;

	&:hover {
		border-color: var(--main-color);
		box-shadow: var(--shadow-md);
		background-color: var(--main-color-bg);

		.category-name {
			color: var(--main-color);
		}

		.category-count {
			background-color: var(--main-color);
			color: var(--white);
		}
	}
}

.category-name {
	font-size: 1rem;
	font-weight: 600;
	color: var(--font-color);
	transition: color 0.3s ease;
}

.category-count {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 1.5rem;
	min-width: 1.5rem;
	padding: 0 0.5rem;
	border-radius: 50%;
	background-color: var(--c-bg-2);
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--font-color-2);
	transition: all 0.3s ease;
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}

@media (max-width: 768px) {
	.categories-page {
		padding: 0 0.25rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 1.5rem;
	}

	.categories-list {
		gap: 0.75rem;
	}

	.category-tag {
		min-width: 100px;
		padding: 0.5rem 1rem;
	}

	.category-name {
		font-size: 0.875rem;
	}
}
</style>
