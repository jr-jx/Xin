<script setup lang="ts">
defineEmits<{ (e: 'select', token: string): void }>()

// 内置一组常见表情（无需外部 JSON），token 为 :token: 形式会在后端 markdown 中以普通文本出现
const emojis = [
	'😀',
	'😁',
	'😂',
	'🤣',
	'😊',
	'😇',
	'🙂',
	'😉',
	'😍',
	'😘',
	'😜',
	'🤔',
	'😎',
	'🥳',
	'😭',
	'😤',
	'😱',
	'🙃',
	'🤡',
	'💩',
	'👍',
	'👎',
	'👏',
	'🙏',
	'💪',
	'🎉',
	'🔥',
	'❤️',
	'💔',
	'⭐',
	'☕',
	'🍔',
]
</script>

<template>
<div class="owo-picker">
	<button
		v-for="e in emojis"
		:key="e"
		type="button"
		class="owo-item"
		@click="$emit('select', e)"
	>
		{{ e }}
	</button>
</div>
</template>

<style lang="scss" scoped>
.owo-picker {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(2rem, 1fr));
	gap: 0.25rem;
	padding: 0.5rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-2);
}

.owo-item {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 2rem;
	padding: 0;
	border: none;
	border-radius: var(--radius-sm);
	background: transparent;
	font-size: 1.1rem;
	transition: background 0.15s;
	cursor: pointer;

	&:hover {
		background: var(--c-bg);
	}
}
</style>
