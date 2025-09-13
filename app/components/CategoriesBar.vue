<script setup lang="ts">
import { useContentLoader } from '~/composables/useContentLoader'

interface Category {
	name: string
	tip: string
	slug?: string
	icon?: string
	count?: number
}

interface CategoriesBarProps {
	activeCategory?: string
	showIcon?: boolean
	type?: 'category' | 'tag'
}

defineOptions({ name: 'CategoriesBar' })

const props = withDefaults(defineProps<CategoriesBarProps>(), {
	showIcon: false,
	type: 'category',
})

// 直接从 useContentLoader 获取数据
const { postsByCategory, postsByTag, postsPending } = useContentLoader()

// 溢出检测相关状态
const isOverflow = ref(false)
const isIconReversed = ref(false)
const categoryListRef = ref<HTMLElement>()

// 从文章数据生成分类信息
const categories = computed<Category[]>(() => {
	// 如果还在加载中，只显示精选
	if (postsPending.value) {
		return [
			{
				name: '精选',
				slug: 'featured',
				tip: '查看所有精选的文章',
			},
		]
	}

	if (props.type === 'tag') {
		// 生成标签列表
		const tagEntries = Object.entries(postsByTag.value)
		return tagEntries.map(([name, posts]) => ({
			name,
			slug: name,
			tip: `查看包含 ${name} 标签的文章`,
			count: posts.length,
		}))
	}
	else {
		// 生成分类列表
		const categoryEntries = Object.entries(postsByCategory.value)
		const result = [
			{
				name: '精选',
				slug: 'featured',
				tip: '查看所有精选的文章',
			},
			...categoryEntries.map(([name, posts]) => ({
				name,
				slug: name,
				tip: `前往 ${name} 分类的文章`,
				count: posts.length,
			})),
		]
		return result
	}
})

// 生成导航链接
function getNavigationLink(category: Category) {
	if (props.type === 'tag') {
		return category.slug ? `/tags/${category.slug}` : '/tags'
	}
	return category.slug === 'featured' ? '/' : `/categories/${category.slug}`
}

// 判断是否为激活状态
function isActive(category: Category) {
	if (props.type === 'tag') {
		// 标签模式：检查当前路由是否匹配标签
		return category.slug === props.activeCategory || category.slug === undefined
	}
	else {
		// 分类模式
		if (category.slug === 'featured') {
			// 精选分类：在首页时激活
			return props.activeCategory === undefined || props.activeCategory === ''
		}
		else {
			// 普通分类：检查当前路由是否匹配分类
			return category.slug === props.activeCategory
		}
	}
}

// 检查是否溢出
function checkOverflow() {
	if (categoryListRef.value) {
		isOverflow.value = categoryListRef.value.scrollWidth > categoryListRef.value.clientWidth
	}
}

// 处理更多按钮点击
function handleMoreType() {
	if (categoryListRef.value) {
		categoryListRef.value.scrollLeft = categoryListRef.value.scrollWidth
		isIconReversed.value = !isIconReversed.value
	}
}

// 监听窗口大小变化
onMounted(() => {
	nextTick(() => {
		checkOverflow()
		window.addEventListener('resize', checkOverflow)
	})
})

onUnmounted(() => {
	window.removeEventListener('resize', checkOverflow)
})

// 监听分类数据变化，重新检查溢出
watch(categories, () => {
	nextTick(() => {
		checkOverflow()
	})
}, { deep: true })
</script>

<template>
<div class="category-section">
	<div class="category-nav">
		<!-- 加载状态 -->
		<div v-if="postsPending" class="loading-state">
			<div class="loading-spinner" />
			<span>加载分类中...</span>
		</div>

		<!-- 分类列表 -->
		<div v-else class="category-container">
			<div
				ref="categoryListRef"
				class="category-list"
			>
				<NuxtLink
					v-for="category in categories"
					:key="category.name"
					:to="getNavigationLink(category)"
					class="category-button" :class="[
						isActive(category) ? 'category-button-active' : 'category-button-default',
					]"
					v-tip:="category.tip"
				>
					<Icon v-if="showIcon && category.icon" :name="category.icon" class="category-icon" />
					{{ category.name }}
				</NuxtLink>
			</div>

			<!-- 更多按钮组 -->
			<div v-if="isOverflow" class="more-type-group">
				<Icon
					class="more-next"
					:class="{ rotated: isIconReversed }"
					name="mingcute:arrows-right-line"
					@click="handleMoreType"
				/>
				<NuxtLink :to="type === 'tag' ? '/tags' : '/categories'" class="more-link">
					更多
				</NuxtLink>
			</div>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.category-section {
	margin-bottom: 0.5rem;
}

.category-nav {
	padding: 0.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	transition: all 0.3s ease;

	@media (max-width: 900px) {
		padding: 0;
		border: var(--border-always);
		background-color: transparent;
	}
}

.category-container {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 0.75rem;
}

.category-list {
	display: flex;
	flex: 1;
	gap: 0.5rem;
	overflow-x: auto;
	mask:
		linear-gradient(
			90deg,
			#FFF 0,
			#FFF 90%,
			hsl(0deg 0% 100% / 60%) 95%,
			hsl(0deg 0% 100% / 0%) 100%
		);
	scrollbar-width: none;
	-ms-overflow-style: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.category-button {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.5rem;
	min-width: fit-content;
	padding: 0.25rem 0.75rem;
	border: var(--border-always);
	border-radius: var(--radius);
	background-color: transparent;
	font-size: 0.875rem;
	font-weight: 600;
	white-space: nowrap;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover:not(.category-button-active) {
		background-color: var(--c-bg-2);
		color: var(--main-color);
	}

	@media (max-width: 900px) {
		border: var(--border);
	}
}

.category-button-active {
	order: -1;
	background-color: var(--main-color);
	color: var(--white);
}

.category-button-default {
	background-color: transparent;
	color: var(--font-color-2);
}

.category-icon {
	flex-shrink: 0;
	width: 1rem;
	height: 1rem;
}

.category-count {
	flex-shrink: 0;
	margin-left: 0.25rem;
	padding: 0.125rem 0.375rem;
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
	font-size: 0.75rem;
	font-weight: normal;
	color: var(--font-color-2);
}

.category-button-active .category-count {
	background-color: var(--white);
	color: var(--main-color);
}

.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 1rem;
	font-size: 0.875rem;
	color: var(--font-color-2);
}

.loading-spinner {
	width: 1rem;
	height: 1rem;
	border: 2px solid var(--c-border);
	border-top: 2px solid var(--main-color);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.more-type-group {
	display: flex;
	flex-direction: row;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	white-space: nowrap;
	transition: all 0.3s;
}

.more-next {
	padding: 0.25rem;
	border-radius: var(--radius);
	font-size: 1.2rem;
	color: var(--font-color-2);
	transform: rotate(0deg);
	transition: all 0.3s ease;
	cursor: pointer;

	&.rotated {
		transform: rotate(180deg);
	}

	&:hover {
		background-color: var(--c-bg-2);
		color: var(--main-color);
	}
}

.more-link {
	padding: 0.25rem 0.5rem;
	border-radius: var(--radius);
	font-size: 0.875rem;
	font-weight: 600;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--c-bg-2);
		color: var(--main-color);
	}
}
</style>
