<script setup lang="ts">
import blogConfig from '~~/blog.config'
import { useConsoleStore } from '~/stores/console'

// 定义组件名称
defineOptions({ name: 'AppHeader' })

// 从配置中解构菜单数据
const { menu, site } = blogConfig

// 使用控制台状态管理
const consoleStore = useConsoleStore()

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
		tip: '搜索一下',
		function: () => {},
	},
])

// 滚动状态管理
const isScrolled = ref(false)

// 下拉菜单激活状态
const activeDropdown = ref<string | null>(null)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

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

// 组件挂载时设置事件监听器
onMounted(() => {
	window.addEventListener('scroll', handleScroll, { passive: true })
})

// 组件卸载时清理事件监听器和定时器
onUnmounted(() => {
	window.removeEventListener('scroll', handleScroll)
	if (closeTimeout) {
		clearTimeout(closeTimeout)
	}
})
</script>

<template>
<header class="header" :class="{ 'header-scrolled': isScrolled }" role="banner">
	<div class="header-container">
		<div class="header-content">
			<!-- Logo 区域 -->
			<div class="logo-container">
				<NuxtLink
					to="/"
					class="logo-link"
					v-tip:="'返回博客首页'"
					aria-label="返回博客首页"
					@click="handleLogoClick"
				>
					<span class="logo-text">{{ site.title }}</span>
					<Icon name="i-material-symbols:home-rounded" class="logo-icon" />
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
					<Icon v-if="!consoleStore.showConsole" name="i-ph:circles-four-bold" />
					<Icon v-else name="i-ph:x-bold" />
				</button>
			</div>
		</div>
	</div>
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
	@else if $breakpoint == md {
		@media (min-width: 768px) { @content; }
	} @else if $breakpoint == mobile {
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

	// 滚动时的样式变化
	&.header-scrolled {
		border-bottom-color: var(--border-color);
		box-shadow: var(--shadow-sm);
		background-color: var(--card-bg);
		transition: all $transition-normal;
		will-change: background-color, border-bottom-color, box-shadow;

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
}

.logo-link {
	display: grid;
	align-items: center;
	gap: 0.75rem;
	position: relative;
	overflow: hidden;
	height: 2rem;
	padding: 0 0.25rem;
	border-radius: var(--radius-md);
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
		border-radius: var(--radius);
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

// 导航菜单样式
.nav-menu {
	@include flex-center;

	gap: 2rem;

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
	border-radius: var(--radius);
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
	justify-content: center;
	gap: 0.5rem;
	position: absolute;
	visibility: hidden;
	opacity: 0;
	top: 120%;
	left: 50%;
	width: max-content;
	height: 3rem;
	min-width: 8rem;
	padding: 0.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	backdrop-filter: blur(12px);
	transform: translateX(-50%) translateY(0.5rem);
	transition: all $transition-normal;
	pointer-events: none;
	z-index: 100;

	&.dropdown-menu-active {
		visibility: visible;
		opacity: 1;
		transform: translateX(-50%) translateY(0);
		pointer-events: auto;
	}
}

.dropdown-item {
	width: 100%;
	height: 100%;
}

.dropdown-link {
	@include flex-center;

	gap: 0.5rem;
	height: 100%;
	padding: 0.5rem 1rem;
	border-radius: var(--radius);
	text-decoration: none;
	color: var(--font-color);
	transition: all $transition-normal;

	&:hover {
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}

.dropdown-icon {
	flex-shrink: 0;
	opacity: 0.7;
	width: 1rem;
	height: 1rem;
	transition: opacity $transition-normal;
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
	border-radius: var(--radius);
	outline: none;
	background: none;
	text-decoration: none;
	color: var(--font-color-2);
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
