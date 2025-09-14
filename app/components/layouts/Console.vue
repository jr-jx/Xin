<script setup lang="ts">
import { useConsoleStore } from '~/stores/console'

// 异步组件定义
const RecentComment = defineAsyncComponent(() => import('../console/recentComment.vue'))
const RecentPost = defineAsyncComponent(() => import('../console/recentPost.vue'))
const Tag = defineAsyncComponent(() => import('../console/Tag.vue'))

// Store 和状态管理
const consoleStore = useConsoleStore()
const isConsoleVisible = computed(() => consoleStore.showConsole)

// 关闭控制台
function closeConsole() {
	consoleStore.showConsole = false
}

// 防止滚动穿透
function handleScrollPrevention(prevent: boolean) {
	if (typeof document !== 'undefined') {
		document.body.style.overflow = prevent ? 'hidden' : ''
		document.body.style.touchAction = prevent ? 'none' : ''
	}
}

// 键盘事件处理
function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && isConsoleVisible.value) {
		closeConsole()
	}
}

// 生命周期钩子
onMounted(() => {
	document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
	document.removeEventListener('keydown', handleKeydown)
	handleScrollPrevention(false)
})
watch(() => isConsoleVisible.value, (visible) => {
	handleScrollPrevention(visible)
}, { immediate: true })
</script>

<template>
<div>
	<!-- 遮罩层 -->
	<Transition name="fade">
		<div
			v-if="isConsoleVisible"
			class="mask"
			aria-hidden="true"
			@click="closeConsole"
		/>
	</Transition>

	<!-- 控制台主体 -->
	<Transition name="slide-up">
		<div
			v-if="isConsoleVisible"
			class="console"
			aria-modal="true"
			aria-labelledby="console-title"
		>
			<div class="console-header">
				<div class="console-header-title">
					<Icon name="i-ph:circles-four-bold" />
					<span id="console-title">全站动态</span>
				</div>
				<div class="console-header-actions">
					<ClientOnly>
						<ThemeToggle class="theme-toggle" />
					</ClientOnly>
				</div>
			</div>

			<div class="console-content">
				<div class="console-grid">
					<!-- 最近评论 -->
					<Widget
						card
						class="panel-section recent-comments"
						title="最近评论"
						icon="mdi:comment-text-outline"
					>
						<ClientOnly>
							<Suspense>
								<RecentComment />
								<template #fallback>
									<div class="loading-placeholder">
										加载中...
									</div>
								</template>
							</Suspense>
						</ClientOnly>
					</Widget>

					<!-- 最近文章 -->
					<Widget
						card
						class="panel-section recent-posts"
						title="最近文章"
						icon="ph:file-text-bold"
					>
						<div class="section-content">
							<ClientOnly>
								<Suspense>
									<RecentPost :max-posts="6" />
									<template #fallback>
										<div class="loading-placeholder">
											加载中...
										</div>
									</template>
								</Suspense>
							</ClientOnly>
						</div>
					</Widget>

					<!-- 热门标签 -->
					<Widget
						card
						class="panel-section popular-tags"
						title="热门标签"
						icon="icon-park-solid:tag"
					>
						<div class="section-content">
							<ClientOnly>
								<Suspense>
									<Tag :max-tags="10" />
									<template #fallback>
										<div class="loading-placeholder">
											加载中...
										</div>
									</template>
								</Suspense>
							</ClientOnly>
						</div>
					</Widget>
				</div>
			</div>
		</div>
	</Transition>
</div>
</template>

<style lang="scss" scoped>
// 淡入动画
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

// 上滑动画
.slide-up-enter-active,
.slide-up-leave-active {
	transition:
		opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
		transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(30px) scale(0.95);
}

// 遮罩层样式
.mask {
	position: fixed;
	top: 4rem;
	left: 0;
	width: 100%;
	height: calc(100vh - 4rem);
	background-color: rgb(0 0 0 / 60%);
	backdrop-filter: blur(8px);
	cursor: pointer;
	pointer-events: auto;
	z-index: 40;
}

// 控制台主体样式
.console {
	display: flex;
	flex-direction: column;
	position: fixed;
	overflow: hidden;
	top: 5rem;
	left: 50%;
	width: calc(100% - 2rem);
	height: 85vh;
	max-width: 1250px;
	border: none;
	border-radius: var(--radius);
	box-shadow: 0 25px 80px rgb(0 0 0 / 15%);
	box-sizing: border-box;
	background-color: var(--card-bg);
	transform: translateX(-50%);
	z-index: 50;
}

// 控制台头部
.console-header {
	contain: content;
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: space-between;
	padding: 0.5rem 1rem;
	border-bottom: var(--border);
	background-color: var(--c-bg-2);
}

.console-header-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--font-color);

	.icon {
		width: 1.25rem;
		height: 1.25rem;
		color: var(--main-color);
	}
}

.console-header-actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

// 控制台内容区域
.console-content {
	flex: 1;
	overflow: hidden auto;
	padding: 1rem;
	overscroll-behavior: contain;
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		display: none;
	}
}

// 网格布局
.console-grid {
	display: grid;
	grid-template-columns: 1fr;
	height: fit-content;
	min-height: 100%;

	.recent-comments {
		min-height: 200px;
		animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
	}

	.recent-posts {
		animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
	}

	.popular-tags {
		animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
	}

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;
		gap: 1rem;

		.recent-comments {
			grid-column: 1 / -1;
		}

		.recent-posts {
			grid-column: 1;
		}

		.popular-tags {
			grid-column: 2;
		}
	}
}

// 面板区域
.panel-section {
	contain: content;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	transition:
		opacity 0.4s ease-out,
		transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 0.3s ease-out;
}

// 内容区域
.section-content {
	flex: 1;
	overflow: hidden auto;
	padding: 1rem;
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		display: none;
	}
}

// 加载占位符
.loading-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100px;
	font-size: 0.875rem;
	color: var(--font-color-2);
	animation: fade-in 0.3s ease-out;
}

// 主题切换按钮
.theme-toggle {
	margin-left: 0.5rem;
}

// 动画关键帧
@keyframes slide-in-up {
	from {
		opacity: 0;
		transform: translateY(30px) scale(0.95);
	}

	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes fade-in {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}
</style>
