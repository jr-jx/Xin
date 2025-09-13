<script setup lang="ts">
import type { Article } from '~/types/article'
import { useContentLoader } from '~/composables/useContentLoader'
import { useContentStore } from '~/stores/content'

const contentStore = useContentStore()
const { posts } = storeToRefs(contentStore)

// 加载文章数据
useContentLoader()

// 获取所有标签
const allTags = computed(() => {
	const map = new Map<string, number>()
	posts.value.forEach((p: Article) => {
		if (p.tags && Array.isArray(p.tags)) {
			p.tags.forEach((tag) => {
				map.set(tag, (map.get(tag) || 0) + 1)
			})
		}
	})
	return Array.from(map.entries())
		.map(([name, count]) => ({
			name,
			count,
			slug: name,
			tip: `查看包含 ${name} 标签的文章`,
		}))
		.sort((a, b) => b.count - a.count) // 按文章数量排序
})

// 页面标题
useSeoMeta({
	title: '全部标签',
	description: '浏览所有文章标签',
})
</script>

<template>
<div class="tags-page">
	<!-- 页面标题 -->
	<div class="page-header" data-aos="fade-up">
		<h1 class="page-title">
			全部标签
		</h1>
	</div>

	<!-- 标签列表 -->
	<div class="tags-container">
		<div class="tags-list">
			<NuxtLink
				v-for="(tag, index) in allTags"
				:key="tag.slug"
				:to="`/tags/${tag.slug}`"
				class="tag-tag"
				data-aos="fade-up"
				:data-aos-delay="50 * index"
			>
				<span class="tag-name">
					<Icon name="material-symbols:tag" />
					{{ tag.name }}
				</span>
				<span class="tag-count">{{ tag.count }}</span>
			</NuxtLink>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.tags-page {
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

.tags-container {
	max-width: 800px;
	margin: 0 auto;
}

.tags-list {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5rem;
}

.tag-tag {
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

		.tag-name {
			color: var(--main-color);
		}

		.tag-count {
			background-color: var(--main-color);
			color: var(--white);
		}
	}
}

.tag-name {
	font-size: 1rem;
	font-weight: 600;
	color: var(--font-color);
	transition: color 0.3s ease;
}

.tag-count {
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

@media (max-width: 768px) {
	.tags-page {
		padding: 0 0.25rem;
	}

	.page-header {
		margin-bottom: 1.5rem;
		padding: 1.5rem 1rem;
	}

	.page-title {
		font-size: 1.5rem;
	}

	.tags-list {
		gap: 0.75rem;
	}

	.tag-tag {
		min-width: 100px;
		padding: 0.5rem 1rem;
	}

	.tag-name {
		font-size: 0.875rem;
	}
}
</style>
