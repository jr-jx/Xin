<script setup lang="ts">
import blogConfig from '~~/blog.config'
import { useConsoleStore } from '~/stores/console'

defineOptions({ name: 'AppHeader' })

const { menu } = blogConfig

const consoleStore = useConsoleStore()

const btnMenu = [
	{
		label: '揪蝉',
		icon: 'ph:basketball-bold',
		to: 'https://jiuchan.org',
		target: '_blank',
		tip: '前往揪蝉',
	},
	{
		label: 'Search',
		icon: 'ph:magnifying-glass-bold',
		function: () => {
		},
		tip: '搜索一下',
	},
]

// 滚动状态管理
const isScrolled = ref(false)

// 下拉菜单激活状态
const activeDropdown = ref<string | null>(null)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

// 节流函数
function throttle<T extends (...args: never[]) => void>(func: T, delay: number) {
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

// 处理鼠标进入事件
function handleMouseEnter(label: string) {
	// 清除之前的关闭定时器
	if (closeTimeout) {
		clearTimeout(closeTimeout)
		closeTimeout = null
	}
	activeDropdown.value = label
}

// 处理鼠标离开事件
function handleMouseLeave(_label: string) {
	// 延迟关闭下拉菜单
	closeTimeout = setTimeout(() => {
		activeDropdown.value = null
	}, 150) // 延迟150ms关闭，给用户更多时间移动到下拉菜单
}

// 监听滚动事件
onMounted(() => {
	const handleScroll = throttle(() => {
		const scrollTop = window.scrollY
		isScrolled.value = scrollTop > 20
	}, 16)

	window.addEventListener('scroll', handleScroll, { passive: true })

	// 清理事件监听器
	onUnmounted(() => {
		window.removeEventListener('scroll', handleScroll)
		// 清理定时器
		if (closeTimeout) {
			clearTimeout(closeTimeout)
		}
	})
})
</script>

<template>
<header class="header" :class="{ 'header-scrolled': isScrolled }">
	<div class="header-container">
		<div class="header-content">
			<!-- Logo -->
			<div class="logo-container">
				<NuxtLink to="/" class="logo-link" v-tip:="'返回博客首页'" @click="consoleStore.showConsole = false">
					<span class="logo-text">{{ blogConfig.site.title }}</span>
					<Icon name="i-material-symbols:home-rounded" class="logo-icon" />
				</NuxtLink>
			</div>

			<!-- Navigation Menu -->
			<nav class="nav-menu">
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
					>
						{{ item.label }}
					</div>

					<!-- Dropdown Menu -->
					<ul
						v-if="item.items"
						class="dropdown-menu"
						:class="{ 'dropdown-menu-active': activeDropdown === item.label }"
					>
						<li v-for="subItem in item.items" :key="subItem.label" class="dropdown-item">
							<NuxtLink :to="subItem.to" class="dropdown-link" @click="consoleStore.showConsole = false">
								<Icon v-if="subItem.icon" :name="subItem.icon" class="dropdown-icon" />
								<span class="dropdown-text">{{ subItem.label }}</span>
							</NuxtLink>
						</li>
					</ul>
				</div>
			</nav>

			<!-- Right Section -->
			<div class="right-section">
				<NuxtLink
					v-for="item in btnMenu"
					:key="item.label"
					:aria-label="`${item.label}`"
					v-tip:="item.tip"
					:title="item.label"
					:to="item.to"
					class="social-link"
					:target="item.target"
					@click="item.function"
				>
					<Icon :name="item.icon" class="social-icon" />
				</NuxtLink>
				<div class="social-link" v-tip:="'打开/关闭控制台'" @click="consoleStore.showConsole = !consoleStore.showConsole">
					<Icon v-if="!consoleStore.showConsole" name="i-ph:circles-four-bold" />
					<Icon v-else name="i-ph:x-bold" />
				</div>
			</div>
		</div>
	</div>
</header>
</template>

<style lang="scss" scoped>
// 混合器
@mixin flex-center {
	display: flex;
	align-items: center;
}

@mixin hover-effect {
	transition: $transition;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color);
		color: var(--white);
	}
}

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

// 主容器
.header {
	position: sticky;
	top: 0;
	border-bottom: 1px solid transparent;
	z-index: 50;

	// 滚动时的样式
	&.header-scrolled {
		border-bottom-color: var(--border-color);
		box-shadow: var(--shadow-sm);
		background-color: var(--card-bg);
		transition: all 0.3s ease;
		will-change: background-color, border-bottom-color, box-shadow;

		// 增强滚动时的视觉效果
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
}

.header-content {
	@include flex-center;

	justify-content: space-between;
	height: 4rem;
	padding: 0 0.5rem;

	@include responsive(lg) {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
	}
}

// Logo 区域
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
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	.logo-text {
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		will-change: transform, opacity;
	}

	&:hover {
		background-color: var(--main-color);

		.logo-text {
			opacity: 0;
		}

		.logo-icon {
			opacity: 1;
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

// 导航菜单
.nav-menu {
	@include flex-center;

	gap: 2rem;

	@include responsive(mobile) {
		display: none;
	}
}

.nav-item {
	position: relative;

	&:hover {
		.nav-button {
			background-color: var(--main-color);
			color: var(--white);
		}
	}
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
	transition: color 0.3s, background-color 0.3s;
	cursor: pointer;

	&.nav-button-active {
		background-color: var(--main-color);
		color: var(--white);
	}
}

// 下拉菜单
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
	transition: all 0.3s ease;
	pointer-events: none;

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
	transition: all 0.3s ease;

	&:hover {
		background-color: var(--main-color);
		color: var(--white);
	}
}

.dropdown-icon {
	flex-shrink: 0;
	opacity: 0.7;
	width: 1rem;
	height: 1rem;
	transition: opacity 0.3s ease;
}

.dropdown-text {
	flex: 1;
	overflow: hidden;
	font-size: 0.875rem;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
}

// 右侧区域
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
	border-radius: var(--radius);
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.3s ease;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color-bg);
		color: var(--font-color);
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
