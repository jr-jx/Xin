<script lang="ts" setup>
defineProps<{
	tags: TagStat[]
	card?: boolean
}>()
</script>

<template>
<div class="tags-container" :class="{ card }">
	<NuxtLink
		v-for="tag in tags"
		:key="tag.name"
		:to="`/tags/${tag.name}`"
		class="tag-item"
	>
		<Icon name="material-symbols:tag" />
		{{ tag.name }}
	</NuxtLink>
</div>
</template>

<style lang="scss" scoped>
.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	padding: 0.5rem;

	&.card {
		border: var(--border);
		border-radius: var(--radius);
		background-color: var(--card-bg);
		transition: all 0.3s ease;
		will-change: background-color, color, border-color;
	}
}

.tag-item {
	display: inline-block;
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
</style>
