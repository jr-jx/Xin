<script setup lang="ts">
import type { FriendItem } from '~/types/feed'

defineOptions({ name: 'FriendsRandom' })

const props = defineProps<{
	items: FriendItem[]
}>()

const disabled = computed(() => props.items.length === 0)

function surprise() {
	if (disabled.value)
		return
	const idx = Math.floor(Math.random() * props.items.length)
	const post = props.items[idx]
	if (post?.link && typeof window !== 'undefined')
		window.open(post.link, '_blank', 'noopener,noreferrer')
}
</script>

<template>
<Widget title="随机串门" icon="ph:shuffle-bold" card>
	<button
		type="button"
		class="surprise-btn"
		:disabled="disabled"
		@click="surprise"
	>
		<Icon name="ph:dice-five-bold" class="dice" />
		<span>随便看看</span>
	</button>
	<p class="tip">
		惊喜访问一篇朋友动态
	</p>
</Widget>
</template>

<style lang="scss" scoped>
.surprise-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.7rem 0.75rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-md);
	background: var(--c-bg-2);
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--font-color);
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover:not(:disabled) {
		border-color: var(--main-color);
		box-shadow: 0 4px 14px rgb(0 0 0 / 8%);
		color: var(--main-color);
		transform: translateY(-1px);

		.dice {
			transform: rotate(25deg) scale(1.12);
		}
	}

	&:active:not(:disabled) .dice {
		transform: rotate(-180deg) scale(1.05);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
}

.dice {
	width: 1.15rem;
	height: 1.15rem;
	transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.tip {
	margin: 0.6rem 0 0;
	font-size: 0.75rem;
	text-align: center;
	color: var(--font-color-3);
}
</style>
