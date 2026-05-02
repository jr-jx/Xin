<script setup lang="ts">
defineOptions({ name: 'FriendsSearch' })

const model = defineModel<string>({ default: '' })
</script>

<template>
<div class="friends-search">
	<Icon name="ph:magnifying-glass" class="icon" />
	<input
		v-model="model"
		type="search"
		placeholder="搜索标题、摘要或作者"
		class="input"
		autocomplete="off"
	>
	<button
		v-if="model"
		class="clear"
		type="button"
		aria-label="清除"
		@click="model = ''"
	>
		<Icon name="ph:x-bold" />
	</button>
</div>
</template>

<style lang="scss" scoped>
.friends-search {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-lg);
	background: var(--card-bg);
	transition: border-color 0.2s ease, box-shadow 0.2s ease;

	&:focus-within {
		border-color: var(--main-color);
		box-shadow: 0 0 0 3px rgb(var(--main-color-rgb, 59, 130, 246), 0.12);
	}
}

.icon {
	flex-shrink: 0;
	width: 1rem;
	height: 1rem;
	color: var(--font-color-3);
}

.input {
	flex: 1;
	min-width: 0;
	border: none;
	outline: none;
	background: transparent;
	font-size: 0.88rem;
	color: var(--font-color);

	&::-webkit-search-cancel-button {
		display: none;
	}
}

.clear {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	padding: 0;
	border: none;
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	color: var(--font-color-3);
	transition: color 0.2s ease, background 0.2s ease;
	cursor: pointer;

	&:hover {
		background: var(--main-color-bg, var(--c-bg-2));
		color: var(--main-color);
	}

	.icon {
		width: 0.75rem;
		height: 0.75rem;
	}
}
</style>
