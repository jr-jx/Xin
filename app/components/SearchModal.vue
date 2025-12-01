<script setup lang="ts">
import { useSearchStore } from '~/stores/search'

defineOptions({ name: 'SearchModal' })

const searchStore = useSearchStore()

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		searchStore.closeSearch()
	}
}

// 点击遮罩关闭
function handleOverlayClick(event: MouseEvent) {
	if (event.target === event.currentTarget) {
		searchStore.closeSearch()
	}
}

// 组件挂载时添加键盘监听
onMounted(() => {
	document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时移除键盘监听
onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown)
})

// 高亮搜索关键词
function highlightText(text: string, query: string) {
	if (!query.trim())
		return text

	const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
	return text.replace(regex, '<mark>$1</mark>')
}
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
				<div class="search-modal">
					<!-- 搜索头部 -->
					<div class="search-header">
						<div class="search-title-section">
							<h2 class="search-title">
								搜索
							</h2>
							<button
								class="close-button"
								title="关闭搜索"
								@click="searchStore.closeSearch"
							>
								<Icon name="ph:x-bold" class="close-icon" />
							</button>
						</div>

						<div class="search-input-wrapper">
							<Icon name="ph:magnifying-glass-bold" class="search-icon" />
							<input
								id="search-input"
								v-model="searchStore.searchQuery"
								type="text"
								placeholder="搜索文章标题、内容、标签..."
								class="search-input"
								autocomplete="off"
							>
							<div class="search-shortcuts">
								<kbd class="kbd">ESC</kbd>
							</div>
							<button
								v-if="searchStore.hasQuery"
								class="clear-button"
								title="清除搜索"
								@click="searchStore.clearSearch"
							>
								<Icon name="ph:x-bold" class="clear-icon" />
							</button>
						</div>
					</div>

					<!-- 搜索结果 -->
					<div class="search-content">
						<!-- 加载状态 -->
						<div v-if="searchStore.isSearching" class="search-loading">
							<div class="loading-container">
								<div class="loading-spinner" />
								<div class="loading-dots">
									<span />
									<span />
									<span />
								</div>
							</div>
							<p class="loading-text">
								正在搜索文章...
							</p>
						</div>

						<!-- 搜索结果列表 -->
						<div v-else-if="searchStore.hasResults" class="search-results">
							<div class="results-header">
								<div class="results-stats">
									<span class="results-count">
										找到 <strong>{{ searchStore.searchResults.length }}</strong> 条结果
									</span>
									<span class="search-time">
										用时 {{ searchStore.searchTime }} 毫秒
									</span>
								</div>
							</div>

							<div class="results-list">
								<article
									v-for="(result, index) in searchStore.searchResults"
									:key="result.path"
									class="result-item"
									:style="{ '--delay': `${index * 50}ms` }"
								>
									<NuxtLink
										:to="result.path"
										class="result-link"
										@click="searchStore.closeSearch"
									>
										<div class="result-content">
											<h3
												class="result-title"
												v-html="highlightText(result.title || '未命名文章', searchStore.searchQuery)"
											/>

											<p
												v-if="result.excerpt"
												class="result-excerpt"
												v-html="highlightText(result.excerpt, searchStore.searchQuery)"
											/>

											<div class="result-meta">
												<time v-if="result.date" class="result-date">
													{{ new Date(result.date).toLocaleDateString('zh-CN') }}
												</time>
												<div v-if="result.tags && result.tags.length > 0" class="result-tags">
													<span
														v-for="tag in result.tags.slice(0, 2)"
														:key="tag"
														class="result-tag"
													>
														{{ tag }}
													</span>
												</div>
											</div>
										</div>
									</NuxtLink>
								</article>
							</div>
						</div>

						<!-- 无结果状态 -->
						<div v-else-if="searchStore.hasQuery && !searchStore.isSearching" class="no-results">
							<Icon name="ph:magnifying-glass-bold" class="no-results-icon" />
							<h3>未找到相关内容</h3>
							<p>尝试使用不同的关键词或检查拼写</p>
						</div>

						<!-- 初始状态 -->
						<div v-else class="search-empty">
							<div class="empty-illustration">
								<Icon name="ph:magnifying-glass-bold" class="empty-icon" />
								<div class="search-waves">
									<div class="wave" />
									<div class="wave" />
									<div class="wave" />
								</div>
							</div>
							<h3 class="empty-title">
								开始搜索
							</h3>
							<p class="empty-description">
								输入关键词搜索文章标题、内容、标签等
							</p>

							<div class="search-features">
								<div class="feature-item">
									<Icon name="ph:article-bold" class="feature-icon" />
									<span>全文搜索</span>
								</div>
								<div class="feature-item">
									<Icon name="ph:tag-bold" class="feature-icon" />
									<span>标签匹配</span>
								</div>
								<div class="feature-item">
									<Icon name="ph:folder-bold" class="feature-icon" />
									<span>分类筛选</span>
								</div>
							</div>

							<div class="search-shortcuts-guide">
								<div class="shortcut-item">
									<kbd class="kbd">Ctrl</kbd>
									<span>+</span>
									<kbd class="kbd">K</kbd>
									<span>快速打开</span>
								</div>
								<div class="shortcut-item">
									<kbd class="kbd">ESC</kbd>
									<span>关闭搜索</span>
								</div>
							</div>
						</div>
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
	align-items: flex-start;
	justify-content: center;
	position: fixed;
	overflow-y: auto;
	inset: 0;
	padding: 10vh 1rem 2rem;
	background: rgb(0 0 0 / 50%);
	backdrop-filter: blur(4px);
	z-index: 1000;
}

.search-modal {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	width: 100%;
	max-width: 42rem;
	max-height: 80vh;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-lg);
	background: var(--card-bg);
}

.search-header {
	padding: var(--space-6);
	border-bottom: 1px solid var(--border-color);
	background: var(--card-bg);
}

.search-title-section {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: var(--space-4);
}

.search-title {
	margin: 0;
	font-size: var(--text-xl);
	font-weight: 600;
	color: var(--font-color);
}

.close-button {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: none;
	border-radius: var(--radius);
	background: none;
	transition: background-color 0.2s ease;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
	}

	.close-icon {
		width: 1rem;
		height: 1rem;
		color: var(--font-color-2);
	}
}

.search-input-wrapper {
	display: flex;
	align-items: center;
	position: relative;
}

.search-icon {
	position: absolute;
	left: var(--space-4);
	width: 1.25rem;
	height: 1.25rem;
	color: var(--font-color-2);
	z-index: 2;
}

.search-input {
	width: 100%;
	height: 3rem;
	padding: 0 6rem 0 3rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg);
	font-size: var(--text-base);
	color: var(--font-color);
	transition: all 0.2s ease;

	&:focus {
		border-color: var(--main-color);
		box-shadow: 0 0 0 3px var(--main-color-bg);
		outline: none;
	}

	&::placeholder {
		color: var(--font-color-3);
	}
}

.search-shortcuts {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	position: absolute;
	right: 3rem;
	z-index: 2;
}

.kbd {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 1.5rem;
	min-width: 1.5rem;
	padding: 0 var(--space-2);
	border: 1px solid var(--border-color);
	border-radius: var(--radius-sm);
	background: var(--card-bg);
	font-size: var(--text-xs);
	font-weight: 500;
	color: var(--font-color-2);
}

.clear-button {
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	right: var(--space-4);
	width: 1.5rem;
	height: 1.5rem;
	border: none;
	border-radius: var(--radius-sm);
	background: none;
	transition: background-color 0.2s ease;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
	}

	.clear-icon {
		width: 1rem;
		height: 1rem;
		color: var(--font-color-2);
	}
}

.search-content {
	flex: 1;
	overflow-y: auto;
	min-height: 0;
}

.search-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 2rem;
	color: var(--font-color-2);

	.loading-container {
		margin-bottom: var(--space-4);
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid var(--border-color);
		border-top: 2px solid var(--main-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-text {
		margin: 0;
		font-size: var(--text-sm);
	}
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.search-results {
	padding: 1rem 0;
}

.results-header {
	padding: var(--space-4) var(--space-6) var(--space-2);

	.results-stats {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		font-size: var(--text-sm);
		color: var(--font-color-2);
	}

	.results-count {
		strong {
			font-weight: 600;
			color: var(--main-color);
		}
	}

	.search-time {
		color: var(--font-color-3);
	}
}

.results-list {
	padding: var(--space-2) 0;
}

.result-item {
	margin: 0 var(--space-4);

	&:not(:last-child) {
		margin-bottom: var(--space-2);
	}
}

.result-link {
	display: block;
	padding: var(--space-4);
	border: 1px solid transparent;
	border-radius: var(--radius);
	background: transparent;
	text-decoration: none;
	color: inherit;
	transition: background-color 0.2s ease;

	&:hover {
		border-color: var(--border-color);
		background: var(--c-bg);
	}
}

.result-content {
	flex: 1;
	min-width: 0;
}

.result-header {
	margin-bottom: 0.5rem;
}

.result-title {
	margin: 0 0 var(--space-2) 0;
	font-size: var(--text-lg);
	font-weight: 600;
	line-height: var(--leading-snug);
	color: var(--font-color);

	:deep(mark) {
		padding: 0.1em 0.2em;
		border-radius: var(--radius-sm);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.result-excerpt {
	margin: 0 0 var(--space-3) 0;
	font-size: var(--text-sm);
	line-height: var(--leading-relaxed);
	color: var(--font-color-2);

	:deep(mark) {
		padding: 0.1em 0.2em;
		border-radius: var(--radius-sm);
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.result-meta {
	display: flex;
	align-items: center;
	justify-content: space-between;
	font-size: var(--text-xs);
	color: var(--font-color-3);
}

.result-date {
	color: var(--font-color-3);
}

.result-tags {
	display: flex;
	gap: var(--space-2);
}

.result-tag {
	padding: var(--space-1) var(--space-2);
	border-radius: var(--radius-sm);
	background: var(--c-bg-2);
	font-size: var(--text-xs);
	color: var(--font-color-2);
}

.result-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
	font-size: 0.75rem;
	color: var(--font-color-3);
}

.result-score {
	font-weight: 500;
}

.result-fields {
	opacity: 0.8;
}

.result-excerpt {
	margin: 0.5rem 0;
	font-size: 0.875rem;
	line-height: 1.6;
	color: var(--font-color-2);

	:deep(mark) {
		padding: 0.1em 0.2em;
		border-radius: 0.2em;
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}

.result-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 0.75rem;
	font-size: 0.75rem;
}

.result-date {
	color: var(--font-color-3);
}

.result-tags {
	display: flex;
	gap: 0.5rem;
}

.result-tag {
	padding: 0.2rem 0.5rem;
	border-radius: var(--radius-sm);
	background-color: var(--c-bg-2);
	font-size: 0.7rem;
	color: var(--font-color-2);
}

// 徽章样式
.result-badges {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.match-badge {
	display: inline-flex;
	align-items: center;
	padding: 0.125rem 0.5rem;
	border-radius: 0.375rem;
	font-size: 0.7rem;
	font-weight: 500;

	&.match-title {
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	&.match-content {
		background: rgb(34 197 94 / 10%);
		color: rgb(34 197 94);
	}

	&.match-tags {
		background: rgb(168 85 247 / 10%);
		color: rgb(168 85 247);
	}

	&.match-categories {
		background: rgb(249 115 22 / 10%);
		color: rgb(249 115 22);
	}
}

.score-badge {
	display: inline-flex;
	align-items: center;
	padding: 0.125rem 0.5rem;
	border-radius: 0.375rem;
	background: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-3);
}

.result-arrow {
	opacity: 0;
	transform: translateX(-10px);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	.arrow-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--main-color);
	}
}

// 标签样式
.result-tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;

	.tags-icon {
		opacity: 0.7;
		width: 0.875rem;
		height: 0.875rem;
		color: var(--font-color-3);
	}
}

.result-tag {
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
	background: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-2);
}

.more-tags {
	padding: 0.125rem 0.5rem;
	border-radius: 0.25rem;
	background: var(--main-color-bg);
	font-size: 0.7rem;
	font-weight: 600;
	color: var(--main-color);
}

// 空状态样式
.no-results,
.search-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 2rem;
	text-align: center;
	color: var(--font-color-2);
}

.no-results-icon {
	opacity: 0.4;
	width: 3rem;
	height: 3rem;
	margin-bottom: var(--space-4);
	color: var(--font-color-3);
}

.empty-illustration {
	margin-bottom: var(--space-6);

	.empty-icon {
		opacity: 0.6;
		width: 3rem;
		height: 3rem;
		color: var(--font-color-3);
	}
}

.empty-title {
	margin: 0 0 var(--space-2) 0;
	font-size: var(--text-xl);
	font-weight: 600;
	color: var(--font-color);
}

.empty-description {
	max-width: 24rem;
	margin: 0 0 var(--space-6) 0;
	font-size: var(--text-sm);
	line-height: var(--leading-relaxed);
	color: var(--font-color-2);
}

.search-features {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: var(--space-4);
	margin-bottom: var(--space-6);
}

.feature-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	min-width: 4rem;
	padding: var(--space-3);
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg);

	.feature-icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--main-color);
	}

	span {
		font-size: var(--text-xs);
		color: var(--font-color-2);
	}
}

.search-shortcuts-guide {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: var(--space-4);
}

.shortcut-item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--text-xs);
	color: var(--font-color-3);
}

.search-tips {
	max-width: 20rem;
	margin-top: 2rem;
	text-align: left;
}

.tips-title {
	margin: 0 0 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--font-color);
}

.tips-list {
	margin: 0;
	padding-left: 1.25rem;
	font-size: 0.8rem;
	line-height: 1.6;

	li {
		margin-bottom: 0.25rem;
	}
}

// 过渡动画
.search-modal-enter-active,
.search-modal-leave-active {
	transition: opacity 0.3s ease;

	.search-modal {
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
}

.search-modal-enter-from,
.search-modal-leave-to {
	opacity: 0;

	.search-modal {
		opacity: 0;
		transform: translateY(-2rem);
	}
}

.search-modal-enter-to,
.search-modal-leave-from {
	opacity: 1;

	.search-modal {
		opacity: 1;
		transform: translateY(0);
	}
}

// 响应式设计
@media (max-width: 768px) {
	.search-overlay {
		padding: 5vh var(--space-3) var(--space-4);
	}

	.search-modal {
		max-height: 90vh;
	}

	.search-header {
		padding: var(--space-4);
	}

	.search-input {
		padding: 0 4rem 0 2.5rem;
	}

	.search-shortcuts {
		right: 2.5rem;
	}

	.result-item {
		margin: 0 var(--space-3);
	}

	.result-link {
		padding: var(--space-3);
	}

	.result-meta {
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.search-loading,
	.search-empty,
	.no-results {
		padding: var(--space-8) var(--space-4);
	}

	.search-features {
		gap: var(--space-3);
	}

	.feature-item {
		min-width: 3rem;
		padding: var(--space-2);
	}
}

@media (max-width: 480px) {
	.search-overlay {
		padding: 2vh var(--space-2) var(--space-2);
	}

	.search-modal {
		max-height: 95vh;
	}

	.search-input {
		padding: 0 3rem 0 2.5rem;
	}

	.search-shortcuts {
		right: 2rem;
	}

	.result-item {
		margin: 0 var(--space-2);
	}

	.search-features {
		flex-direction: column;
		gap: var(--space-2);
	}

	.feature-item {
		flex-direction: row;
		justify-content: flex-start;
		width: 100%;
	}
}
</style>
