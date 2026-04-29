<script setup lang="ts">
import { useContentLoader } from '~/composables/useContentLoader'
import { useConsoleStore } from '~/stores/console'

// 异步组件定义
const RecentComment = defineAsyncComponent(() => import('../console/recentComment.vue'))
const ConsoleTag = defineAsyncComponent(() => import('../console/Tag.vue'))

// Store 和状态管理
const consoleStore = useConsoleStore()
const isConsoleVisible = computed(() => consoleStore.showConsole)

// 年份统计
const { publishedPosts } = useContentLoader()
const yearStats = computed(() => {
	const map = new Map<number, number>()
	for (const post of publishedPosts.value) {
		const year = post.date ? new Date(post.date).getFullYear() : null
		if (year)
			map.set(year, (map.get(year) || 0) + 1)
	}
	return [...map.entries()].sort((a, b) => b[0] - a[0])
})
const totalPosts = computed(() => publishedPosts.value.length)

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
			<div class="console-content">
				<div class="console-grid">
					<!-- 左侧：最近评论 -->
					<Widget card class="panel-comments" title="最近评论" icon="mdi:comment-text-outline">
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

					<!-- 右侧：标签 + 文章归档 -->
					<div class="panel-right">
						<Widget card class="panel-tags" title="热门标签" icon="icon-park-solid:tag">
							<ClientOnly>
								<Suspense>
									<ConsoleTag :max-tags="30" />
									<template #fallback>
										<div class="loading-placeholder">
											加载中...
										</div>
									</template>
								</Suspense>
							</ClientOnly>
						</Widget>

						<div class="panel-stats">
							<div class="stats-grid">
								<NuxtLink
									v-for="[year, count] in yearStats"
									:key="year"
									class="stat-card"
									:to="`/archives#${year}`"
									@click="closeConsole"
								>
									<span class="stat-year">{{ year }}</span>
									<span class="stat-count">{{ count }} <small>篇</small></span>
								</NuxtLink>
								<NuxtLink
									class="stat-card"
									to="/archives"
									@click="closeConsole"
								>
									<span class="stat-year">全部文章</span>
									<span class="stat-count">{{ totalPosts }} <small>篇</small></span>
								</NuxtLink>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- 底部胶囊工具栏 -->
			<div class="console-toolbar">
				<ClientOnly>
					<ThemeToggle />
				</ClientOnly>
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
	transform: translate(-50%, -45%) scale(0.95);
}

// 遮罩层样式
.mask {
	position: fixed;
	inset: 0;
	width: 100%;
	height: 100vh;
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
	align-items: center;
	position: fixed;
	overflow: hidden;
	top: 50%;
	left: 50%;
	width: calc(100% - 2rem);
	max-width: 1250px;
	max-height: 85vh;
	transform: translate(-50%, -50%);
	z-index: 50;
}

// 控制台内容区域
.console-content {
	flex: 1;
	overflow: hidden auto;
	width: 100%;
	padding: 0.5rem;
	overscroll-behavior: contain;
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch;

	&::-webkit-scrollbar {
		display: none;
	}
}

// 底部胶囊工具栏
.console-toolbar {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 0.75rem 0;
	animation: slide-in-up 0.5s ease-out 0.4s both;
}

// 主网格：左评论 4fr，右栏 6fr
.console-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 0.75rem;
	min-height: 0;

	@media (min-width: 768px) {
		grid-template-columns: 4fr 6fr;
	}
}

.panel-comments {
	animation: slide-in-up 0.5s ease-out 0.1s both;
}

// 右侧栏：标签 7 + 统计 3
.panel-right {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
}

.panel-tags {
	flex: 7;
	min-height: 0;
	animation: slide-in-up 0.5s ease-out 0.2s both;
}

.panel-stats {
	flex: 3;
	animation: slide-in-up 0.5s ease-out 0.3s both;
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.5rem;
	height: 100%;

	@media (min-width: 768px) {
		grid-template-columns: repeat(4, 1fr);
	}
}

.stat-card {
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 0.25rem;
	padding: 0.625rem 0.875rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	text-decoration: none;
	color: inherit;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: var(--c-bg-2);
	}
}

.stat-year {
	font-size: 0.75rem;
	color: var(--font-color-3);
}

.stat-count {
	font-size: 1.25rem;
	font-weight: 700;
	line-height: 1.2;
	color: var(--font-color);

	small {
		font-size: 0.75rem;
		font-weight: 400;
		color: var(--font-color-2);
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
}

// 动画关键帧
@keyframes slide-in-up {
	from {
		opacity: 0;
		transform: translateY(20px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>
