<script setup lang="ts">
import { useConsoleStore } from '~/stores/console'

const RecentComment = shallowRef(defineAsyncComponent(() => import('../console/recentComment.vue')))
const RecentPost = shallowRef(defineAsyncComponent(() => import('../console/recentPost.vue')))
const Tag = shallowRef(defineAsyncComponent(() => import('../console/Tag.vue')))

const consoleStore = useConsoleStore()

// 使用计算属性缓存状态，减少不必要的重新计算
const isConsoleVisible = computed(() => consoleStore.showConsole)

// 使用防抖处理关闭事件，避免频繁触发状态更新
const closeConsole = useDebounceFn(() => {
	consoleStore.showConsole = !consoleStore.showConsole
}, 100)

// 使用节流处理滚动事件，提高性能
const handleWheel = useThrottleFn((event: WheelEvent) => {
	event.stopPropagation()
}, 16)

const handleTouchMove = useThrottleFn((event: TouchEvent) => {
	event.stopPropagation()
}, 16)

// 使用计算属性控制body样式，而不是直接操作DOM
const bodyStyle = computed(() => {
	return isConsoleVisible.value ? 'hidden' : ''
})

// 使用watchPostEffect代替watchEffect，确保DOM更新后再执行
watchPostEffect(() => {
	document.body.style.overflow = bodyStyle.value
})

// 组件卸载时恢复页面滚动
onUnmounted(() => {
	document.body.style.overflow = ''
})

// 自定义防抖函数，使用markRaw避免不必要的响应式包装
function useDebounceFn<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
	let timer: number | null = null
	return markRaw(function (this: any, ...args: Parameters<T>) {
		if (timer)
			clearTimeout(timer)
		timer = setTimeout(() => {
			fn.apply(this, args)
			timer = null
		}, delay) as unknown as number
	})
}

// 自定义节流函数，使用markRaw避免不必要的响应式包装
function useThrottleFn<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
	let last = 0
	return markRaw(function (this: any, ...args: Parameters<T>) {
		const now = Date.now()
		if (now - last >= delay) {
			fn.apply(this, args)
			last = now
		}
	})
}
</script>

<template>
<div>
	<!-- 使用v-show代替v-if，减少DOM重建开销 -->
	<Transition name="fade">
		<div
			v-show="isConsoleVisible"
			class="mask"
			:class="{ 'mask-show': isConsoleVisible }"
			@click="closeConsole"
		/>
	</Transition>

	<Transition name="console-transition">
		<div
			v-show="isConsoleVisible"
			class="console"
			:class="{ 'console-show': isConsoleVisible }"
		>
			<div class="console-header">
				<div class="console-header-title">
					<Icon name="i-ph:circles-four-bold" />
					<span>全站动态</span>
				</div>
				<ClientOnly>
					<ThemeToggle class="theme-toggle" />
				</ClientOnly>
			</div>

			<!-- 使用事件委托，将事件处理绑定在父元素上 -->
			<div class="console-content" @wheel.passive="handleWheel" @touchmove.passive="handleTouchMove">
				<div class="console-grid">
					<!-- 使用v-memo优化组件重渲染 -->
					<Widget
						v-memo="[isConsoleVisible]"
						card
						class="panel-section recent-comments"
						title="最近评论"
						icon="mdi:comment-text-outline"
					>
						<!-- 使用Suspense处理异步组件 -->
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

					<Widget
						v-memo="[isConsoleVisible]"
						card
						class="panel-section recent-posts"
						title="最近文章"
						icon="ph:file-text-bold"
					>
						<!-- 移除重复的事件监听器，已在父元素上绑定 -->
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

					<Widget
						v-memo="[isConsoleVisible]"
						card
						class="panel-section popular-tags"
						title="热门标签"
						icon="icon-park-solid:tag"
					>
						<!-- 移除重复的事件监听器，已在父元素上绑定 -->
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
// 定义动画变量
:root {
	--console-animation-duration: 0.4s;
	--console-animation-timing: cubic-bezier(0.34, 1.56, 0.64, 1);
	--mask-animation-duration: 0.3s;
	--mask-animation-timing: ease-out;
}

// 优化遮罩动画
.mask {
	position: fixed;
	top: 4rem;
	left: 0;
	width: 100%;
	height: calc(100vh - 4rem);
	background-color: rgb(0 0 0 / 0%);
	backdrop-filter: blur(0);
	transition:
		background-color var(--mask-animation-duration) var(--mask-animation-timing),
		backdrop-filter var(--mask-animation-duration) var(--mask-animation-timing);
	will-change: opacity, backdrop-filter;
	z-index: 50;

	&.mask-show {
		background-color: rgb(0 0 0 / 60%);
		backdrop-filter: blur(8px);
	}
}

// 优化控制台主体动画
.console {
	display: flex;
	flex-direction: column;
	position: fixed;
	overflow: hidden;
	opacity: 0;
	top: 5rem;
	left: 50%;
	width: calc(100% - 2rem);
	height: 85vh;
	max-width: 1250px;
	border: none;
	border-radius: var(--radius);
	box-sizing: border-box;
	background-color: var(--card-bg);
	transform: translateX(-50%) translateY(20px) scale(0.95);
	transition:
		transform var(--console-animation-duration) var(--console-animation-timing),
		opacity var(--console-animation-duration) var(--console-animation-timing);
	will-change: transform, opacity;
	z-index: 50;

	&.console-show {
		opacity: 1;
		box-shadow: 0 25px 80px rgb(0 0 0 / 15%);
		transform: translateX(-50%) translateY(0) scale(1);
	}
}

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

.console-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	gap: 1rem;
	height: fit-content;
	min-height: 100%;

	/* 定义网格区域 - 使用grid-area简化布局 */
	.recent-comments {
		grid-column: 1 / -1;
		min-height: 200px;
		animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
	}

	@media (min-width: 768px) {
		grid-template-columns: 1fr 1fr;

		.recent-posts {
			grid-column: 1;
			animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
		}

		.popular-tags {
			grid-column: 2;
			animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
		}
	}

	@media (min-width: 1200px) {
		.technical-info {
			grid-column: 3;
			animation: slide-in-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both;
		}
	}
}

// 优化面板部分
.panel-section {
	contain: content; // 包含内容，减少重绘范围
	display: flex;
	flex-direction: column;
	overflow: hidden;
	opacity: 0;
	min-height: 200px;
	transform: translateY(30px);
	transition:
		opacity 0.4s ease-out,
		transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 0.3s ease-out;

	&:hover {
		transform: translateY(-2px);
	}
}

.section-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 1rem;
	border-bottom: var(--border);
	background-color: var(--card-bg);

	.icon {
		width: 1rem;
		height: 1rem;
		color: var(--main-color);
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--font-color);
	}
}

.section-content {
	flex: 1;
	overflow: hidden auto;
	padding: 1rem;

	/* Firefox 隐藏滚动条 */
	scrollbar-width: none;
	-webkit-overflow-scrolling: touch; // 提高iOS滚动性能

	/* 隐藏滚动条 */
	&::-webkit-scrollbar {
		display: none;
	}
}

// 优化列表项样式
.post-item {
	contain: layout; // 包含布局，减少重排范围
	margin-bottom: 0.75rem;

	&:last-child {
		margin-bottom: 0;
	}
}

.post-link {
	display: block;
	padding: 0.5rem;
	border-radius: var(--radius);
	text-decoration: none;
	transition: background-color var(--transition-duration) var(--transition-timing);

	&:hover {
		background-color: var(--c-bg-2);
	}
}

.post-content {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
}

// 优化图片加载和显示
.post-image {
	flex-shrink: 0;
	overflow: hidden;
	width: 50px;
	height: 50px;
	border-radius: var(--radius);
	background-color: var(--c-bg-2);

	img {
		width: 100%;
		height: 100%;
		transition: transform var(--transition-duration) var(--transition-timing);
		will-change: transform; // 提示浏览器优化transform变换
		object-fit: cover;
	}

	.post-link:hover & img {
		transform: scale(1.05);
	}
}

.post-text {
	flex: 1;
	min-width: 0; // 确保文本可以正确缩小
}

// 优化文本显示
.post-title {
	display: -webkit-box;
	overflow: hidden;
	margin-bottom: 0.25rem;
	font-size: 0.875rem;
	font-weight: 500;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.4;
	text-overflow: ellipsis;
	color: var(--font-color);
	-webkit-box-orient: vertical;
}

.post-meta {
	font-size: 0.75rem;
	color: var(--font-color-2);
}

// 优化标签列表
.tag-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.tag-item {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
	font-size: 0.75rem;
	text-decoration: none;
	color: var(--font-color-2);
	transition:
		background-color var(--transition-duration) var(--transition-timing),
		color var(--transition-duration) var(--transition-timing),
		border-color var(--transition-duration) var(--transition-timing);

	&:hover {
		border-color: var(--main-color);
		background-color: var(--main-color);
		color: var(--white);
	}
}

// 添加动画关键帧
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

@keyframes scale-in {
	from {
		opacity: 0;
		transform: scale(0.9);
	}

	to {
		opacity: 1;
		transform: scale(1);
	}
}

// 过渡动画类
.fade-enter-active {
	transition: all 0.3s ease-out;
}

.fade-leave-active {
	transition: all 0.25s ease-in;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.console-transition-enter-active {
	transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.console-transition-leave-active {
	transition: all 0.3s ease-in;
}

.console-transition-enter-from {
	opacity: 0;
	transform: translateX(-50%) translateY(30px) scale(0.9);
}

.console-transition-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(-20px) scale(0.95);
}

// 添加加载占位符样式
.loading-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100px;
	font-size: 0.875rem;
	color: var(--font-color-2);
	animation: fade-in 0.3s ease-out;
}
</style>
