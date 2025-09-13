<script lang="ts" setup>
const props = withDefaults(defineProps<TagProps>(), {
	maxTags: 10,
})

const consoleStore = useConsoleStore()

interface TagProps {
	maxTags?: number
	class?: string
}

const { tags, hasData } = useSiteStats()

const allTags = computed(() => {
	return tags.value.slice(0, props.maxTags)
})
const loading = computed(() => !hasData.value)

function handleTagClick(tagName: string) {
	consoleStore.showConsole = !consoleStore.showConsole
	navigateTo(`/tags/${tagName}`)
}
</script>

<template>
<div
	class="tag-container"
	:class="props.class"
	role="region"
	aria-label="热门标签"
>
	<div
		v-if="loading"
		class="tag-loading"
		role="status"
		aria-live="polite"
	>
		<div class="loading-text">
			加载中...
		</div>
	</div>

	<!-- 标签列表 -->
	<div
		v-else
		class="tag-list"
		role="list"
		aria-label="标签列表"
	>
		<div
			v-for="tag in allTags"
			:key="tag.name"
			class="tag-item"
			role="listitem"
			:aria-label="`标签：${tag.name}，共${tag.count}篇文章`"
			@click="handleTagClick(tag.name)"
		>
			<Icon name="material-symbols:tag" />
			<span class="tag-name">
				{{ tag.name }}
			</span>
			<span class="tag-count">
				{{ tag.count }}
			</span>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
// ===== 基础变量 =====
$t-border-radius: 4px;
$t-transition-fast: 0.2s ease;
$t-transition-normal: 0.3s ease;

// ===== 容器样式 =====
.tag-container {
	position: relative;
}

// ===== 标签列表 =====
.tag-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	width: 100%;
}

// ===== 标签项 =====
.tag-item {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	font-size: 0.875rem;
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;
	will-change: transform, color, border-color;
	cursor: pointer;

	&:hover {
		border-color: var(--main-color);
		color: var(--main-color);
	}
}

// ===== 标签名称 =====
.tag-name {
	font-size: 0.875rem;
	font-weight: 500;
	line-height: 1.2;
	color: inherit;
	transition: color 0.2s ease;
}

// ===== 标签计数 =====
.tag-count {
	border-radius: var(--radius);
	font-size: 0.75rem;
	transition: color 0.2s ease;
}

// ===== 加载状态 =====
.tag-loading {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 2rem 0;
}

.loading-text {
	font-size: 0.875rem;
	color: var(--font-color-2);
}

// ===== 平板响应式设计 =====
@media (max-width: 768px) {
	.tag-item {
		padding: 0.2rem 0.4rem;
		font-size: 0.8rem;
	}

	.tag-name {
		font-size: 0.8rem;
	}

	.tag-count {
		font-size: 0.7rem;
	}
}

// ===== 手机响应式设计 =====
@media (max-width: 480px) {
	.tag-item {
		padding: 0.15rem 0.3rem;
		font-size: 0.75rem;
	}

	.tag-name {
		font-size: 0.75rem;
	}

	.tag-count {
		font-size: 0.65rem;
	}
}

// ===== 无障碍支持 =====
@media (prefers-reduced-motion: reduce) {
	/* stylelint-disable declaration-no-important */
	* {
		transition-duration: 0.01ms !important;
		animation-duration: 0.01ms !important;
		animation-iteration-count: 1 !important;
	}
	/* stylelint-enable declaration-no-important */

	.tag-item {
		transition: none;

		&:hover {
			transform: none;
		}
	}

	.tag-name,
	.tag-count {
		transition: none;
	}
}

// ===== 高对比度模式 =====
@media (prefers-contrast: high) {
	.tag-item {
		border: 2px solid var(--font-color);
	}

	.tag-count {
		color: var(--font-color);
	}
}
</style>
