<script setup lang="ts">
import blogConfig from '~~/blog.config'
import AppBox from '~/components/layouts/AppBox.vue'
import { useConsoleStore } from '~/stores/console'
import { useSearchStore } from '~/stores/search'

// 定义组件名称
defineOptions({ name: 'AppHeader' })

// 从配置中解构菜单数据
const { menu, site } = blogConfig

// 使用控制台状态管理
const consoleStore = useConsoleStore()

// 使用搜索状态管理
const searchStore = useSearchStore()

// 右侧按钮菜单配置
const btnMenu = ref([
	{
		label: '揪蝉',
		icon: 'ph:basketball-bold',
		to: 'https://jiuchan.org',
		target: '_blank',
		tip: '前往揪蝉',
		function: undefined,
	},
	{
		label: 'Search',
		icon: 'ph:magnifying-glass-bold',
		to: '',
		target: '',
		tip: '搜索文章内容 (Ctrl+K)',
		function: () => searchStore.openSearch(),
	},
])

// 滚动状态管理
const isScrolled = ref(false)
const headerScrolled = computed(() => isScrolled.value || consoleStore.showConsole)

// 下拉菜单激活状态
const activeDropdown = ref<string | null>(null)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

// 应用盒子悬停状态
const showAppBox = ref(false)
let appBoxTimeout: ReturnType<typeof setTimeout> | null = null

function handleAppBoxEnter() {
	if (appBoxTimeout) {
		clearTimeout(appBoxTimeout)
		appBoxTimeout = null
	}
	showAppBox.value = true
}

function handleAppBoxLeave() {
	appBoxTimeout = setTimeout(() => {
		showAppBox.value = false
	}, 150)
}

/**
 * 节流函数 - 限制函数执行频率
 * @param func 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
function throttle<T extends (...args: never[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
	let timeoutId: ReturnType<typeof setTimeout>
	let lastExecTime = 0

	return function (this: unknown, ...args: Parameters<T>) {
		const currentTime = Date.now()

		if (currentTime - lastExecTime > delay) {
			func.apply(this, args)
			lastExecTime = currentTime
		}
		else {
			clearTimeout(timeoutId)
			timeoutId = setTimeout(() => {
				func.apply(this, args)
				lastExecTime = Date.now()
			}, delay - (currentTime - lastExecTime))
		}
	}
}

/**
 * 处理鼠标进入导航项事件
 * @param label 导航项标签
 */
function handleMouseEnter(label: string): void {
	// 清除之前的关闭定时器
	if (closeTimeout) {
		clearTimeout(closeTimeout)
		closeTimeout = null
	}
	activeDropdown.value = label
}

/**
 * 处理鼠标离开导航项事件
 * @param _label 导航项标签
 */
function handleMouseLeave(_label: string): void {
	// 延迟关闭下拉菜单，给用户更多时间移动到下拉菜单
	closeTimeout = setTimeout(() => {
		activeDropdown.value = null
	}, 150)
}

/**
 * 处理Logo点击事件
 */
function handleLogoClick(): void {
	consoleStore.showConsole = false
}

/**
 * 处理下拉菜单链接点击事件
 */
function handleDropdownClick(): void {
	consoleStore.showConsole = false
}

/**
 * 处理控制台切换按钮点击事件
 */
function toggleConsole(): void {
	consoleStore.showConsole = !consoleStore.showConsole
}

/**
 * 处理滚动事件
 */
const handleScroll = throttle(() => {
	const scrollTop = window.scrollY
	isScrolled.value = scrollTop > 20
}, 16)

/**
 * 处理键盘快捷键
 */
function handleKeydown(event: KeyboardEvent) {
	// Ctrl+K 或 Cmd+K 打开搜索
	if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
		event.preventDefault()
		searchStore.openSearch()
	}

	// ESC 关闭应用盒子
	if (event.key === 'Escape' && showAppBox.value) {
		showAppBox.value = false
	}
}

// 组件挂载时设置事件监听器
onMounted(() => {
	window.addEventListener('scroll', handleScroll, { passive: true })
	window.addEventListener('keydown', handleKeydown)
})

// 组件卸载时清理事件监听器和定时器
onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
	window.removeEventListener('keydown', handleKeydown)
	if (closeTimeout) {
		clearTimeout(closeTimeout)
	}
})
</script>

<template>
<header class="header" :class="{ 'header-scrolled': headerScrolled }" role="banner">
	<div class="header-container">
		<div class="header-content">
			<!-- Logo 区域 -->
			<div class="logo-container">
				<!-- 应用盒子触发按钮 -->
				<div
					class="app-box-trigger"
					@mouseenter="handleAppBoxEnter"
					@mouseleave="handleAppBoxLeave"
				>
					<button
						v-tip="'应用盒子'"
						class="app-box-btn"
						:class="{ 'app-box-btn-active': showAppBox }"
						aria-label="应用盒子"
						aria-haspopup="true"
						:aria-expanded="showAppBox"
					>
						<Icon name="ph:squares-four-bold" />
					</button>
					<Transition name="app-box">
						<div
							v-show="showAppBox"
							class="app-box-panel"
							@mouseenter="handleAppBoxEnter"
							@mouseleave="handleAppBoxLeave"
						>
							<AppBox />
						</div>
					</Transition>
				</div>

				<NuxtLink
					to="/"
					class="logo-link"
					v-tip:="'返回博客首页'"
					aria-label="返回博客首页"
					@click="handleLogoClick"
				>
					<span class="logo-text">{{ site.title }}</span>
					<Icon name="ph:house-bold" class="logo-icon" />
				</NuxtLink>
			</div>

			<!-- 导航菜单 -->
			<nav class="nav-menu" role="navigation" aria-label="主导航">
				<div
					v-for="item in menu"
					:key="item.label"
					class="nav-item"
					@mouseenter="handleMouseEnter(item.label)"
					@mouseleave="handleMouseLeave(item.label)"
				>
					<div
						class="nav-button"
						:class="{ 'nav-button-active': activeDropdown === item.label }"
						:aria-haspopup="item.items ? 'true' : 'false'"
						:aria-expanded="activeDropdown === item.label ? 'true' : 'false'"
					>
						{{ item.label }}
					</div>

					<!-- 下拉菜单 -->
					<ul
						v-if="item.items"
						class="dropdown-menu"
						:class="{ 'dropdown-menu-active': activeDropdown === item.label }"
						:aria-labelledby="`nav-button-${item.label}`"
					>
						<li
							v-for="subItem in item.items"
							:key="subItem.label"
							class="dropdown-item"
						>
							<NuxtLink
								:to="subItem.to"
								class="dropdown-link"
								role="menuitem"
								:tabindex="activeDropdown === item.label ? 0 : -1"
								@click="handleDropdownClick"
							>
								<Icon v-if="subItem.icon" :name="subItem.icon" class="dropdown-icon" />
								<span class="dropdown-text">{{ subItem.label }}</span>
							</NuxtLink>
						</li>
					</ul>
				</div>
			</nav>

			<!-- 右侧功能区 -->
			<div class="right-section" aria-label="功能区">
				<template v-for="item in btnMenu" :key="item.label">
					<NuxtLink
						v-if="item.to"
						:aria-label="item.label"
						v-tip:="item.tip"
						:title="item.label"
						:to="item.to"
						class="social-link"
						:target="item.target"
						@click="item.function"
					>
						<Icon :name="item.icon" class="social-icon" />
					</NuxtLink>
					<button
						v-else
						:aria-label="item.label"
						v-tip:="item.tip"
						:title="item.label"
						class="social-link"
						@click="item.function"
					>
						<Icon :name="item.icon" class="social-icon" />
					</button>
				</template>
				<button
					class="social-link"
					v-tip:="'打开/关闭控制台'"
					:aria-label="consoleStore.showConsole ? '关闭控制台' : '打开控制台'"
					:aria-pressed="consoleStore.showConsole"
					@click="toggleConsole"
				>
					<Icon v-if="!consoleStore.showConsole" name="ph:circles-four-bold" />
					<Icon v-else name="ph:x-bold" />
				</button>
			</div>
		</div>
	</div>

	<!-- 搜索模态框 -->
	<ClientOnly>
		<SearchModal />
	</ClientOnly>
</header>
</template>

<style lang="scss" scoped>
// 定义CSS变量便于主题切换
$transition-fast: 0.2s ease;
$transition-normal: 0.3s ease;
$transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// 混合器 - 居中对齐
@mixin flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

// 混合器 - 悬停效果
@mixin hover-effect {
	transition: all $transition-normal;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color);
		color: var(--white);
	}
}

// 混合器 - 响应式设计
@mixin responsive($breakpoint) {
	@if $breakpoint == lg {
		@media (min-width: 1024px) { @content; }
	}

	@if $breakpoint == md {
		@media (min-width: 768px) { @content; }
	}

	@if $breakpoint == mobile {
		@media (max-width: 767px) { @content; }
	}
}

// 头部容器基础样式
.header {
	position: sticky;
	top: 0;
	border-bottom: 1px solid transparent;
	transition: background-color $transition-normal;
	z-index: 50;

	// 滚动时的样式变化：header 保持透明，左/中/右三块各自变为药丸胶囊
	&.header-scrolled {
		.logo-container,
		.right-section {
			border: 1px solid color-mix(in srgb, var(--font-color) 10%, transparent);
			border-radius: var(--radius-pill);
			box-shadow: var(--shadow-sm);
			background-color: var(--glass-bg, rgb(255 255 255 / 12%));
			backdrop-filter: blur(16px) saturate(180%);
		}

		// nav-menu 用 ::before 实现毛玻璃，避免在自身建立 backdrop-filter 上下文
		// 否则其子节点 .dropdown-menu 的 backdrop-filter 会读取已被过滤的背景
		// 不使用 isolation/z-index:-1，确保 .dropdown-menu 与胶囊在同一堆叠上下文下采样背景，
		// 这样下拉菜单的模糊透明度与菜单胶囊保持一致
		.nav-menu {
			position: relative;
			border-radius: var(--radius-pill);

			&::before {
				content: "";
				position: absolute;
				inset: 0;
				border: 1px solid color-mix(in srgb, var(--font-color) 10%, transparent);
				border-radius: inherit;
				box-shadow: var(--shadow-sm);
				background-color: var(--glass-bg, rgb(255 255 255 / 12%));
				backdrop-filter: blur(16px) saturate(180%);
				pointer-events: none;
			}
		}

		.logo-container,
		.nav-menu,
		.right-section {
			align-items: center;
			height: 2.75rem;
		}

		.logo-container {
			padding: 0 0.75rem;
		}

		.nav-menu {
			padding: 0 1rem;
		}

		.right-section {
			padding: 0 0.25rem;
		}

		// 滚动状态下的交互元素样式调整
		.nav-button {
			&:hover {
				background-color: var(--main-color-bg);
				color: var(--main-color);
			}
		}

		.social-link {
			&:hover {
				background-color: var(--main-color-bg);
				color: var(--main-color);
			}
		}
	}
}

.header-container {
	max-width: 1250px;
	margin: 0 auto;
	padding: 0 0.5rem;
}

.header-content {
	@include flex-center;

	justify-content: space-between;
	width: 100%;
	height: 4rem;

	@include responsive(lg) {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		align-items: center;
	}
}

// Logo 区域样式
.logo-container {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.375rem;
	width: fit-content;
	border: 1px solid transparent;
	border-radius: var(--radius-pill);
	transition: background-color $transition-normal, border-color $transition-normal, box-shadow $transition-normal, padding $transition-normal;

	@include responsive(lg) {
		justify-self: start;
	}
}

.logo-link {
	display: grid;
	align-items: center;
	gap: 0.75rem;
	position: relative;
	overflow: hidden;
	height: 2rem;
	padding: 0 0.25rem;
	border-radius: var(--radius-pill);
	text-decoration: none;
	color: inherit;
	transition: all $transition-smooth;

	.logo-text {
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		transition: all $transition-smooth;
		will-change: transform, opacity;
	}

	.logo-icon {
		flex-shrink: 0;
		position: absolute;
		opacity: 0;
		top: 50%;
		left: 50%;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-pill);
		color: var(--white);
		transform: translate(-50%, -50%) scale(0.8);
		transition: all $transition-smooth;
		will-change: transform, opacity;
	}

	&:hover {
		background-color: var(--main-color);

		.logo-text {
			opacity: 0;
		}

		.logo-icon {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
	}
}

.logo-text {
	font-size: 1.125rem;
	font-weight: 700;
	letter-spacing: 0.025em;

	@include responsive(lg) {
		font-size: 1.25rem;
	}
}

// 应用盒子
.app-box-trigger {
	position: relative;

	@include responsive(mobile) {
		display: none;
	}
}

.app-box-btn {
	@include flex-center;

	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: none;
	border-radius: var(--radius-pill);
	outline: none;
	background: none;
	font-size: 1.125rem;
	text-decoration: none;
	color: var(--font-color);
	transition: all $transition-normal;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}

	&.app-box-btn-active {
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}

	&:focus-visible {
		outline: 2px solid var(--main-color);
		outline-offset: 2px;
	}
}

.app-box-panel {
	position: absolute;
	top: calc(100% + 0.5rem);
	left: 0;
	border: 1px solid var(--glass-border);
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-md);
	background-color: var(--glass-bg);
	backdrop-filter: blur(16px) saturate(180%);
	z-index: 100;

	// 透明桥接区，覆盖触发按钮与面板之间的 0.5rem 间隙，避免鼠标穿越时面板抖动关闭
	&::before {
		content: "";
		position: absolute;
		top: -0.5rem;
		left: 0;
		width: 100%;
		height: 0.5rem;
	}
}

.app-box-enter-active,
.app-box-leave-active {
	transform-origin: top left;
	transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-box-enter-from,
.app-box-leave-to {
	opacity: 0;
	transform: translateY(-0.5rem) scale(0.96);
}

// 导航菜单样式
.nav-menu {
	@include flex-center;

	gap: 2rem;
	border: 1px solid transparent;
	border-radius: var(--radius-pill);
	transition: background-color $transition-normal, border-color $transition-normal, box-shadow $transition-normal, padding $transition-normal;

	@include responsive(mobile) {
		display: none;
	}
}

.nav-item {
	position: relative;
}

.nav-button {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 2rem;
	padding: 0 0.8rem 0 1rem;
	border-radius: var(--radius-pill);
	font-weight: 500;
	letter-spacing: 0.2rem;
	line-height: 2rem;
	transition: color $transition-normal, background-color $transition-normal;
	cursor: pointer;

	&.nav-button-active {
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}

// 下拉菜单样式
.dropdown-menu {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 0.25rem;
	position: absolute;
	visibility: hidden;
	opacity: 0;
	top: calc(100% + 0.5rem);
	left: 50%;
	width: max-content;
	padding: 0.375rem;
	border: 1px solid var(--glass-border);
	border-radius: var(--radius-pill);
	box-shadow: var(--shadow-sm);
	background-color: var(--glass-bg);
	backdrop-filter: blur(16px) saturate(180%);
	transform: translateX(-50%) translateY(-0.5rem);
	transition: opacity $transition-normal, transform $transition-normal, visibility $transition-normal;
	pointer-events: none;
	z-index: 100;

	// 顶部小箭头指向触发项
	&::before {
		content: "";
		position: absolute;
		top: -0.5rem;
		left: 0;
		width: 100%;
		height: 0.5rem;
	}

	&.dropdown-menu-active {
		visibility: visible;
		opacity: 1;
		transform: translateX(-50%) translateY(0);
		pointer-events: auto;
	}
}

.dropdown-item {
	display: flex;
}

.dropdown-link {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 0.875rem;
	border-radius: var(--radius-pill);
	text-decoration: none;
	color: var(--font-color);
	transition: background-color $transition-fast, color $transition-fast;

	&:hover,
	&:focus-visible {
		outline: none;
		background-color: var(--main-color-bg);
		color: var(--main-color);

		.dropdown-icon {
			color: var(--main-color);
			transform: scale(1.05);
		}
	}
}

.dropdown-icon {
	flex-shrink: 0;
	width: 1rem;
	height: 1rem;
	color: var(--font-color);
	transition: color $transition-fast, transform $transition-fast;
}

.dropdown-text {
	flex: 1;
	overflow: hidden;
	font-size: 0.875rem;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
}

// 右侧功能区样式
.right-section {
	@include flex-center;

	gap: 0.5rem;
	border: 1px solid transparent;
	border-radius: var(--radius-pill);
	transition: background-color $transition-normal, border-color $transition-normal, box-shadow $transition-normal, padding $transition-normal;

	@include responsive(lg) {
		justify-self: end;
	}
}

.social-link {
	@include flex-center;

	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: none;
	border-radius: var(--radius-pill);
	outline: none;
	background: none;
	text-decoration: none;
	color: var(--font-color);
	transition: all $transition-normal;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color-bg);
		color: var(--font-color);
	}

	// 键盘焦点样式
	&:focus-visible {
		outline: 2px solid var(--main-color);
		outline-offset: 2px;
	}
}

.social-icon {
	width: 1rem;
	height: 1rem;

	@include responsive(lg) {
		width: 1.25rem;
		height: 1.25rem;
	}
}
</style>
