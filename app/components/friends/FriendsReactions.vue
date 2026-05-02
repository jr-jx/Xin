<script setup lang="ts">
import type { ReactionKey } from '~/composables/useFriendsLikes'
import { LIKES_STATE_KEY } from '~/composables/useFriendsLikes'

defineOptions({ name: 'FriendsReactions' })

const props = defineProps<{
	id: string
}>()

interface Reaction {
	key: ReactionKey
	icon: string
	label: string
}

const REACTIONS: Reaction[] = [
	{ key: 'heart', icon: 'twemoji:red-heart', label: '爱心' },
	{ key: 'fire', icon: 'twemoji:fire', label: '火' },
	{ key: 'thumbs-up', icon: 'twemoji:thumbs-up', label: '赞' },
	{ key: 'smile', icon: 'twemoji:grinning-face-with-smiling-eyes', label: '开心' },
]

const state = inject(LIKES_STATE_KEY)

const bouncing = ref<ReactionKey | ''>('')

function count(key: ReactionKey) {
	return state?.value.counts[props.id]?.[key] ?? 0
}

function isLiked(key: ReactionKey) {
	return state?.value.liked[props.id]?.includes(key) ?? false
}

function isPending(key: ReactionKey) {
	return state?.value.pending[props.id]?.has(key) ?? false
}

function display(n: number) {
	if (n <= 0)
		return ''
	if (n > 999)
		return '999+'
	return String(n)
}

async function like(key: ReactionKey) {
	if (!state || isLiked(key) || isPending(key))
		return

	const s = state.value
	// 标记乐观值
	const prevCount = count(key)
	const postCounts = { ...(s.counts[props.id] ?? {}) }
	postCounts[key] = prevCount + 1
	s.counts = { ...s.counts, [props.id]: postCounts }

	const pendingSet = new Set(s.pending[props.id] ?? [])
	pendingSet.add(key)
	s.pending = { ...s.pending, [props.id]: pendingSet }

	bouncing.value = key
	setTimeout(() => {
		if (bouncing.value === key)
			bouncing.value = ''
	}, 220)

	try {
		const res = await $fetch<{ count: number }>('/api/likes', {
			method: 'POST',
			body: { link: props.id, key },
		})
		// 成功：校准计数 + 记录已点
		const fresh = { ...(s.counts[props.id] ?? {}) }
		fresh[key] = res.count
		s.counts = { ...s.counts, [props.id]: fresh }

		const likedList = [...(s.liked[props.id] ?? [])]
		if (!likedList.includes(key))
			likedList.push(key)
		s.liked = { ...s.liked, [props.id]: likedList }
	}
	catch (err: any) {
		const status = err?.response?.status ?? err?.statusCode
		if (status === 409) {
			// 已点过：以服务端返回的真实计数为准，标记为已点
			const dup = err?.data?.count
			const fresh = { ...(s.counts[props.id] ?? {}) }
			fresh[key] = typeof dup === 'number' ? dup : prevCount
			s.counts = { ...s.counts, [props.id]: fresh }

			const likedList = [...(s.liked[props.id] ?? [])]
			if (!likedList.includes(key))
				likedList.push(key)
			s.liked = { ...s.liked, [props.id]: likedList }
		}
		else {
			// 其他错误：回滚乐观值
			const revert = { ...(s.counts[props.id] ?? {}) }
			revert[key] = prevCount
			s.counts = { ...s.counts, [props.id]: revert }
			console.warn('[friends-like] failed:', err)
		}
	}
	finally {
		const ps = new Set(s.pending[props.id] ?? [])
		ps.delete(key)
		s.pending = { ...s.pending, [props.id]: ps }
	}
}
</script>

<template>
<div class="reactions">
	<button
		v-for="r in REACTIONS"
		:key="r.key"
		type="button"
		class="reaction"
		:class="{
			active: isLiked(r.key) || count(r.key) > 0 && false,
			liked: isLiked(r.key),
			bounce: bouncing === r.key,
			disabled: isLiked(r.key),
		}"
		:disabled="isPending(r.key)"
		:aria-label="`${r.label}（${count(r.key)}）`"
		:title="isLiked(r.key) ? '已点过' : r.label"
		@click="like(r.key)"
	>
		<Icon :name="r.icon" class="r-icon" />
		<span v-if="count(r.key) > 0" class="r-count">{{ display(count(r.key)) }}</span>
	</button>
</div>
</template>

<style lang="scss" scoped>
.reactions {
	display: inline-flex;
	align-items: center;
	gap: 0.1rem;
}

.reaction {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.3rem 0.4rem;
	border: none;
	border-radius: var(--radius-md);
	background: transparent;
	font-size: 0.75rem;
	line-height: 1;
	color: var(--font-color-3);
	transition: background 0.18s ease, color 0.18s ease, opacity 0.18s ease;
	cursor: pointer;

	&:hover:not(.liked, :disabled) {
		background: var(--c-bg-2);

		.r-icon {
			transform: scale(1.15);
		}
	}

	&.liked {
		color: var(--main-color);
		cursor: default;

		.r-count {
			color: var(--main-color);
		}
	}

	&.bounce .r-icon {
		animation: bounce 0.22s ease;
	}

	&:disabled {
		opacity: 0.7;
		cursor: wait;
	}
}

.r-icon {
	width: 1.1rem;
	height: 1.1rem;
	transition: transform 0.2s ease;
	filter: grayscale(0.45) opacity(0.75);

	.reaction:hover:not(.liked) &,
	.reaction.liked & {
		filter: none;
	}
}

.r-count {
	min-width: 0.9em;
	font-weight: 600;
	font-variant-numeric: tabular-nums;
	color: var(--font-color-3);
	transition: color 0.18s ease;
}

@keyframes bounce {
	0% { transform: scale(1); }
	50% { transform: scale(1.3); }
	100% { transform: scale(1.15); }
}
</style>
