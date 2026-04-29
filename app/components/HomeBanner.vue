<script setup lang="ts">
import type { Article } from '~/types/article'

interface Props {
	posts: Article[]
	limit?: number
	interval?: number
}

defineOptions({ name: 'HomeBanner' })

const props = withDefaults(defineProps<Props>(), {
	limit: 5,
	interval: 5000,
})

const items = computed(() => (props.posts || []).slice(0, props.limit))
const activeIndex = ref(0)
const active = computed(() => items.value[activeIndex.value])

// 主题色（根据当前 hero 图片提取）
const dominantColor = ref<{ r: number, g: number, b: number } | null>(null)
const colorCache = new Map<string, { r: number, g: number, b: number }>()

function extractDominantColor(url: string): Promise<{ r: number, g: number, b: number } | null> {
	return new Promise((resolve) => {
		if (colorCache.has(url)) {
			resolve(colorCache.get(url)!)
			return
		}
		const img = new Image()
		img.crossOrigin = 'anonymous'
		img.onload = () => {
			try {
				const size = 24
				const canvas = document.createElement('canvas')
				canvas.width = size
				canvas.height = size
				const ctx = canvas.getContext('2d')
				if (!ctx) {
					resolve(null)
					return
				}
				ctx.drawImage(img, 0, 0, size, size)
				const { data } = ctx.getImageData(0, 0, size, size)
				let r = 0
				let g = 0
				let b = 0
				let count = 0
				for (let i = 0; i < data.length; i += 4) {
					const a = data[i + 3]
					if (a < 200)
						continue
					r += data[i]
					g += data[i + 1]
					b += data[i + 2]
					count++
				}
				if (!count) {
					resolve(null)
					return
				}
				const color = {
					r: Math.round(r / count),
					g: Math.round(g / count),
					b: Math.round(b / count),
				}
				colorCache.set(url, color)
				resolve(color)
			}
			catch {
				resolve(null)
			}
		}
		img.onerror = () => resolve(null)
		img.src = url
	})
}

async function updateDominantColor(url?: string) {
	if (!url) {
		dominantColor.value = null
		return
	}
	const color = await extractDominantColor(url)
	dominantColor.value = color
}

const listStyle = computed(() => {
	const c = dominantColor.value
	if (!c)
		return undefined
	return {
		backgroundColor: `rgb(${c.r} ${c.g} ${c.b} / 55%)`,
	}
})

let timer: ReturnType<typeof setInterval> | null = null

function clearTimer() {
	if (timer) {
		clearInterval(timer)
		timer = null
	}
}

function startTimer() {
	clearTimer()
	if (items.value.length <= 1)
		return
	timer = setInterval(() => {
		activeIndex.value = (activeIndex.value + 1) % items.value.length
	}, props.interval)
}

function onEnterItem(i: number) {
	activeIndex.value = i
	clearTimer()
}

function onLeaveBanner() {
	startTimer()
}

watch(() => items.value.length, (len) => {
	if (activeIndex.value >= len)
		activeIndex.value = 0
	startTimer()
})

watch(() => active.value?.image, (url) => {
	if (import.meta.client)
		updateDominantColor(url)
}, { immediate: true })

onMounted(() => {
	startTimer()
	updateDominantColor(active.value?.image)
})
onBeforeUnmount(() => clearTimer())
</script>

<template>
<section
	v-if="items.length"
	class="home-banner"
	@mouseleave="onLeaveBanner"
>
	<!-- 左侧 Hero -->
	<NuxtLink
		v-if="active"
		:to="active.path"
		class="hero"
	>
		<div
			class="hero-bg"
			:style="active.image ? { backgroundImage: `url(${active.image})` } : undefined"
			:class="{ 'hero-bg--placeholder': !active.image }"
		/>
		<div class="hero-mask" />
		<div class="hero-content">
			<div class="hero-tag">
				<Icon name="ri:star-fill" />
				<span>全站推荐</span>
			</div>
			<h2 class="hero-title">
				{{ active.title }}
			</h2>
		</div>
	</NuxtLink>

	<!-- 右侧毛玻璃列表 -->
	<ul class="banner-list" :style="listStyle">
		<li
			v-for="(item, i) in items"
			:key="item.path"
			class="banner-list-item"
			:class="{ active: i === activeIndex }"
			@mouseenter="onEnterItem(i)"
		>
			<NuxtLink :to="item.path" class="banner-list-link">
				<div
					class="banner-list-thumb"
					:style="item.image ? { backgroundImage: `url(${item.image})` } : undefined"
					:class="{ 'banner-list-thumb--placeholder': !item.image }"
				>
					<Icon v-if="!item.image" name="ph:image-square-bold" />
				</div>
				<span class="banner-list-title">{{ item.title }}</span>
			</NuxtLink>
		</li>
	</ul>
</section>
</template>

<style lang="scss" scoped>
.home-banner {
	display: grid;
	grid-template-columns: 7fr 3fr;
	position: relative;
	overflow: hidden;
	height: 300px;
	margin: 0 0.5rem 0.5rem;
	border-radius: var(--radius-lg);
	box-shadow: var(--shadow-md);

	@media (max-width: $breakpoint-mobile) {
		grid-template-columns: 1fr;
		height: 220px;
	}
}

// ========== Hero ==========
.hero {
	display: block;
	position: relative;
	overflow: hidden;
	text-decoration: none;
	color: var(--white);
}

.hero-bg {
	position: absolute;
	inset: 0;
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;
	transition: transform 6s ease;

	&--placeholder {
		background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
	}
}

.hero:hover .hero-bg {
	transform: scale(1.05);
}

.hero-mask {
	position: absolute;
	inset: 0;
	background: linear-gradient(180deg, rgb(0 0 0 / 10%) 0%, rgb(0 0 0 / 15%) 40%, rgb(0 0 0 / 65%) 100%);
	pointer-events: none;
}

.hero-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	position: absolute;
	right: 1.5rem;
	bottom: 1.5rem;
	left: 1.5rem;
}

.hero-tag {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.8rem;
	color: rgb(255 255 255 / 85%);

	svg {
		font-size: 0.9rem;
		color: var(--yellow, #F59E0B);
	}
}

.hero-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0;
	font-size: 1.75rem;
	font-weight: 700;
	-webkit-line-clamp: 2;
	line-height: 1.3;
	color: var(--white);
	-webkit-box-orient: vertical;

	@media (max-width: $breakpoint-mobile) {
		font-size: 1.25rem;
	}
}

// ========== 毛玻璃列表 ==========
.banner-list {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	border-left: 1px solid rgb(255 255 255 / 12%);
	background: rgb(255 255 255 / 12%);
	backdrop-filter: blur(16px);
	transition: background-color 0.4s ease;
	list-style: none;

	@media (max-width: $breakpoint-mobile) {
		display: none;
	}
}

.banner-list-item {
	flex: 0 0 calc(100% / 5);
	position: relative;
	height: calc(100% / 5);
	transition: background-color 0.2s ease;

	&::after {
		content: "";
		position: absolute;
		right: 0.75rem;
		bottom: 0;
		left: 0.75rem;
		height: 1px;
		background: rgb(255 255 255 / 8%);
	}

	&:last-child::after {
		display: none;
	}

	&.active {
		background: rgb(255 255 255 / 22%);
	}
}

.banner-list-link {
	display: flex;
	align-items: center;
	gap: 0.625rem;
	height: 100%;
	padding: 0.5rem 0.875rem;
	text-decoration: none;
	color: var(--white);
}

.banner-list-thumb {
	display: flex;
	flex: 0 0 auto;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	width: 32px;
	height: 32px;
	border-radius: var(--radius-md);
	box-shadow: 0 1px 2px rgb(0 0 0 / 20%);
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;

	&--placeholder {
		background: linear-gradient(135deg, #6366F1, #EC4899);
		font-size: 1rem;
		color: rgb(255 255 255 / 80%);
	}
}

.banner-list-title {
	display: -webkit-box;
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 500;
	-webkit-line-clamp: 1;
	line-height: 1.4;
	color: var(--white);
	-webkit-box-orient: vertical;
}
</style>
