<script setup lang="ts">
import type { Article } from '~/types/article'
import { storeToRefs } from 'pinia'
import { useContentLoader } from '~/composables/useContentLoader'
import { useContentStore } from '~/stores/content'
import { useUiStore } from '~/stores/ui'

interface PostListProps {
	posts?: Article[]
	loading?: boolean
}

defineOptions({ name: 'PostList' })

const props = withDefaults(defineProps<PostListProps>(), {
	posts: undefined,
	loading: false,
})

const contentStore = useContentStore()
const { posts: storePosts } = storeToRefs(contentStore)
const { postsPending } = useContentLoader()

// 决定使用哪个数据源
const postsToUse = computed(() => props.posts || storePosts.value)

// 修复加载状态逻辑：如果外部明确设置了 loading=false，则不再显示加载状态
const isPending = computed(() => {
	// 如果外部明确设置了 loading=false，则不显示加载状态
	if (props.loading === false) {
		return false
	}
	// 如果外部设置了 loading=true，则显示加载状态
	if (props.loading === true) {
		return true
	}
	// 如果外部没有设置 loading，则使用内部的 postsPending 状态
	return postsPending.value
})

// 分页
const ui = useUiStore()
const pageSize = 10

watch(postsToUse, () => ui.setPage(1))

const totalPages = computed(() => Math.max(1, Math.ceil(postsToUse.value.length / pageSize)))

const paginatedPosts = computed(() => {
	const start = (ui.currentPage - 1) * pageSize
	return postsToUse.value.slice(start, start + pageSize)
})

const pageNumbers = computed<(number | string)[]>(() => {
	const total = totalPages.value
	const current = ui.currentPage
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
</script>

<template>
<!-- 文章网格 -->
<div
	class="posts-grid"
	:class="isPending ? 'posts-grid-loading' : 'posts-grid-loaded'"
>
	<!-- 骨架屏 -->
	<template v-if="isPending">
		<div v-for="i in 6" :key="`skeleton-${i}`" class="skeleton-card">
			<div class="skeleton-cover" />
			<div class="skeleton-content">
				<div class="skeleton-category" />
				<div class="skeleton-title" />
				<div class="skeleton-tags" />
				<div class="skeleton-date" />
			</div>
		</div>
	</template>

	<!-- 文章卡片 -->
	<template v-else>
		<div
			v-for="(post, index) in paginatedPosts"
			:key="post.path"
			data-aos="fade-up"
			:data-aos-delay="index * 50"
			class="post-card"
		>
			<ArticleCard :post="post" />
		</div>
	</template>

	<!-- 空状态 -->
	<div v-if="!isPending && paginatedPosts.length === 0" class="empty-state">
		<Icon name="i-carbon-document" class="empty-icon" />
		<p>暂无文章内容</p>
	</div>
</div>

<!-- 分页 -->
<div v-if="!isPending && totalPages > 1" class="pagination">
	<button
		:disabled="ui.currentPage === 1"
		class="pagination-button pagination-prev"
		@click="ui.setPage(Math.max(1, ui.currentPage - 1))"
	>
		<Icon name="i-carbon-chevron-left" class="pagination-icon" />
	</button>

	<template v-for="p in pageNumbers" :key="`p-${p}`">
		<span v-if="typeof p === 'string'" class="pagination-ellipsis">{{ p }}</span>
		<button
			v-else
			class="pagination-number" :class="[
				ui.currentPage === p ? 'pagination-number-active' : 'pagination-number-default',
			]"
			@click="ui.setPage(p)"
		>
			{{ p }}
		</button>
	</template>

	<button
		:disabled="ui.currentPage === totalPages"
		class="pagination-button pagination-next"
		@click="ui.setPage(Math.min(totalPages, ui.currentPage + 1))"
	>
		<Icon name="i-carbon-chevron-right" class="pagination-icon" />
	</button>
</div>
</template>

<style lang="scss" scoped>
.posts-grid {
	display: grid;
	gap: 0.5rem;
}

.posts-grid-loading {
	grid-template-columns: 1fr;
}

.posts-grid-loaded {
	grid-template-columns: 1fr;

	@media (min-width: 1024px) {
		grid-template-columns: repeat(2, 1fr);
	}
}

.skeleton-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	overflow: hidden;
	height: 18rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-cover {
	height: 9rem;
	background: linear-gradient(90deg, var(--c-bg-2) 25%, var(--card-bg) 50%, var(--c-bg-2) 75%);
	background-size: 200% 100%;
	animation: shimmer 1.5s infinite;
}

.skeleton-content {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	padding: 0.5rem;
}

.skeleton-category {
	width: 4rem;
	height: 1.5rem;
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
}

.skeleton-title {
	width: 100%;
	height: 1.25rem;
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
}

.skeleton-tags {
	display: flex;
	gap: 0.5rem;

	.skeleton-tag {
		width: 3rem;
		height: 1.25rem;
		border-radius: var(--radius);
		background-color: var(--c-bg-2);
	}
}

.skeleton-date {
	width: 5rem;
	height: 1rem;
	margin-top: auto;
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
}

.empty-state {
	display: flex;
	flex-direction: column;
	grid-column: 1 / -1;
	align-items: center;
	justify-content: center;
	padding: 3rem 0.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	color: var(--font-color-2);

	.empty-icon {
		opacity: 0.5;
		width: 3rem;
		height: 3rem;
		margin-bottom: 0.5rem;
	}

	p {
		margin: 0;
		font-size: 1rem;
	}
}

.pagination {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	margin-top: 2rem;
}
</style>
