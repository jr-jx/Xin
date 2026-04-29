<script setup lang="ts">
import { useContentLoader } from '~/composables/useContentLoader'
import { useSearchStore } from '~/stores/search'

defineOptions({ name: 'SearchModal' })

const searchStore = useSearchStore()
const { publishedPosts } = useContentLoader()

// 热门标签：从已发布文章中聚合出现次数最多的前 6 个
const hotKeywords = computed<string[]>(() => {
	const counter = new Map<string, number>()
	publishedPosts.value.forEach((post) => {
		post.tags?.forEach((tag) => {
			if (!tag)
				return
			counter.set(tag, (counter.get(tag) || 0) + 1)
		})
	})
	return [...counter.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6)
		.map(([tag]) => tag)
})

function pickKeyword(tag: string) {
	searchStore.searchQuery = tag
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape')
		searchStore.closeSearch()
}

function handleOverlayClick(event: MouseEvent) {
	if (event.target === event.currentTarget)
		searchStore.closeSearch()
}

function highlightText(text: string, query: string) {
	if (!query.trim())
		return text
	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
	return text.replace(regex, '<mark>$1</mark>')
}

onMounted(() => {
	document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
<ClientOnly>
	<Teleport to="body">
		<Transition name="search-modal">
			<div
				v-if="searchStore.isSearchOpen"
				class="search-overlay"
				@click="handleOverlayClick"
			>
				<div class="search-modal" role="dialog" aria-modal="true">
					<!-- 头部 -->
					<div class="search-head">
						<h2 class="search-title">
							搜索
						</h2>
						<button
							class="close-btn"
							title="关闭"
							@click="searchStore.closeSearch"
						>
							<Icon name="ph:x-bold" />
						</button>
					</div>

					<!-- 输入框 -->
					<div class="search-input-wrap">
						<input
							id="search-input"
							v-model="searchStore.searchQuery"
							type="text"
							class="search-input"
							placeholder="输入关键词搜索"
							autocomplete="off"
						>
						<button
							v-if="searchStore.hasQuery"
							class="clear-btn"
							title="清除"
							@click="searchStore.clearSearch"
						>
							<Icon name="ph:x-bold" />
						</button>
					</div>

					<!-- 热门关键词 -->
					<div
						v-if="!searchStore.hasQuery && hotKeywords.length"
						class="hot-keywords"
					>
						<button
							v-for="tag in hotKeywords"
							:key="tag"
							class="hot-keyword"
							@click="pickKeyword(tag)"
						>
							{{ tag }}
						</button>
					</div>

					<!-- 加载 -->
					<div v-if="searchStore.isSearching" class="search-state">
						<div class="spinner" />
					</div>

					<!-- 结果 -->
					<div
						v-else-if="searchStore.hasResults"
						class="search-results"
					>
						<div class="results-meta">
							找到 <strong>{{ searchStore.searchResults.length }}</strong> 条结果
						</div>
						<NuxtLink
							v-for="result in searchStore.searchResults"
							:key="result.path"
							:to="result.path"
							class="result-item"
							@click="searchStore.closeSearch"
						>
							<h3
								class="result-title"
								v-html="highlightText(result.title || '未命名文章', searchStore.searchQuery)"
							/>
							<p
								v-if="result.excerpt || result.description"
								class="result-excerpt"
								v-html="highlightText(result.excerpt || result.description || '', searchStore.searchQuery)"
							/>
							<time v-if="result.date" class="result-date">
								{{ new Date(result.date).toLocaleDateString('zh-CN') }}
							</time>
						</NuxtLink>
					</div>

					<!-- 无结果 -->
					<div
						v-else-if="searchStore.hasQuery"
						class="search-state search-empty"
					>
						未找到相关内容
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</ClientOnly>
</template>

<style lang="scss" scoped>
.search-overlay {
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	overflow-y: auto;
	inset: 0;
	padding: 1rem;
	background: rgb(0 0 0 / 55%);
	backdrop-filter: blur(6px);
	z-index: var(--z-modal, 1050);
}

.search-modal {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: 100%;
	max-width: 560px;
	max-height: calc(100vh - 4rem);
	padding: 1.25rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-xl);
	box-shadow: var(--shadow-xl);
	background: var(--card-bg);
}

.search-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.search-title {
	margin: 0;
	font-size: var(--text-lg);
	font-weight: 600;
	color: var(--font-color);
}

.close-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	border: none;
	border-radius: var(--radius-sm);
	background: none;
	color: var(--font-color-2);
	transition: background-color 0.2s ease, color 0.2s ease;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
		color: var(--font-color);
	}
}

.search-input-wrap {
	display: flex;
	align-items: center;
	position: relative;
}

.search-input {
	width: 100%;
	height: 44px;
	padding: 0 2.5rem 0 0.875rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-lg);
	background: var(--c-bg-1, var(--card-bg));
	font-size: var(--text-sm);
	color: var(--font-color);
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&:focus {
		border-color: var(--main-color);
		box-shadow: 0 0 0 3px var(--main-color-bg);
		outline: none;
	}

	&::placeholder {
		color: var(--font-color-3);
	}
}

.clear-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	right: 0.5rem;
	width: 1.5rem;
	height: 1.5rem;
	border: none;
	border-radius: var(--radius-sm);
	background: none;
	color: var(--font-color-3);
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
		color: var(--font-color);
	}
}

.hot-keywords {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.hot-keyword {
	padding: 0.25rem 0.625rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-pill);
	background: transparent;
	font-size: 0.8rem;
	color: var(--font-color-2);
	transition: border-color 0.2s ease, color 0.2s ease, background-color 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.search-state {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 80px;
	font-size: var(--text-sm);
	color: var(--font-color-2);
}

.search-empty {
	color: var(--font-color-3);
}

.spinner {
	width: 24px;
	height: 24px;
	border: 2px solid var(--border-color);
	border-top-color: var(--main-color);
	border-radius: var(--radius-full);
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.search-results {
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	max-height: 50vh;
	margin: 0 -0.25rem;
	padding: 0 0.25rem;
}

.results-meta {
	padding: 0.25rem 0.25rem 0.5rem;
	font-size: var(--text-xs);
	color: var(--font-color-3);

	strong {
		font-weight: 600;
		color: var(--main-color);
	}
}

.result-item {
	display: block;
	padding: 0.625rem 0.75rem;
	border-radius: var(--radius-lg);
	text-decoration: none;
	color: inherit;
	transition: background-color 0.15s ease;

	& + & {
		margin-top: 0.125rem;
	}

	&:hover {
		background: var(--c-bg-2);
	}
}

.result-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0 0 0.25rem;
	font-size: var(--text-sm);
	font-weight: 600;
	-webkit-line-clamp: 1;
	line-height: 1.4;
	color: var(--font-color);
	-webkit-box-orient: vertical;

	:deep(mark) {
		padding: 0.05em 0.2em;
		border-radius: var(--radius-sm);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.result-excerpt {
	display: -webkit-box;
	overflow: hidden;
	margin: 0 0 0.25rem;
	font-size: var(--text-xs);
	-webkit-line-clamp: 1;
	line-height: 1.5;
	color: var(--font-color-2);

	:deep(mark) {
		padding: 0.05em 0.2em;
		border-radius: var(--radius-sm);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.result-date {
	font-size: var(--text-xs);
	color: var(--font-color-3);
}

// ========== 过渡 ==========
.search-modal-enter-active,
.search-modal-leave-active {
	transition: opacity 0.25s ease;

	.search-modal {
		transition: transform 0.25s ease, opacity 0.25s ease;
	}
}

.search-modal-enter-from,
.search-modal-leave-to {
	opacity: 0;

	.search-modal {
		opacity: 0;
		transform: translateY(8px);
	}
}

// ========== 响应式 ==========
@media (max-width: 480px) {
	.search-modal {
		padding: 1rem;
	}

	.search-input {
		height: 40px;
	}
}
</style>
