<script lang="ts" setup>
const props = withDefaults(defineProps<TagProps>(), {
	maxTags: 40,
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
		<span
			v-for="tag in allTags"
			:key="tag.name"
			class="tag-item"
			role="listitem"
			@click="handleTagClick(tag.name)"
		>
			{{ tag.name }}<sup>{{ tag.count }}</sup>
		</span>
	</div>
</div>
</template>

<style lang="scss" scoped>
.tag-container {
	position: relative;
}

.tag-list {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem 1rem;
	line-height: 1.8;
}

.tag-item {
	font-size: 0.875rem;
	font-weight: 500;
	color: var(--font-color-2);
	transition: color 0.2s ease;
	cursor: pointer;

	&:hover {
		color: var(--main-color);
	}

	sup {
		font-size: 0.65rem;
		font-weight: 400;
		color: var(--font-color-3);
	}
}

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
</style>
