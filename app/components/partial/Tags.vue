<script lang="ts" setup>
defineProps<{
	tags: TagStat[]
}>()
</script>

<template>
<div class="tags-container">
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
}

.tag-item {
	display: inline-block;
	padding: 0.25rem 0.625rem;
	border-radius: var(--radius-pill);
	background-color: var(--c-bg-2);
	font-size: 0.8rem;
	text-decoration: none;
	color: var(--font-color-2);
	transition: background-color 0.2s ease, color 0.2s ease;
	cursor: pointer;

	&:hover {
		background-color: var(--main-color-bg);
		color: var(--main-color);
	}
}
</style>
