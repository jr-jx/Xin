<script setup lang="ts">
import type { FriendItem, FriendSourceStatus } from '~/types/feed'
import { getPostDate } from '~/utils/date'

defineOptions({ name: 'FriendsStats' })

const props = defineProps<{
	items: FriendItem[]
	sources: FriendSourceStatus[]
	generatedAt: string
	refreshing?: boolean
}>()

const emit = defineEmits<{ refresh: [] }>()

const activeAuthors = computed(() => props.sources.filter(s => s.ok).length)

const thisMonthCount = computed(() => {
	const now = new Date()
	const y = now.getFullYear()
	const m = now.getMonth()
	return props.items.filter((p) => {
		const d = new Date(p.pubDate)
		return !Number.isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m
	}).length
})

const generatedLabel = computed(() => props.generatedAt ? getPostDate(props.generatedAt) : '—')
</script>

<template>
<Widget title="朋友圈 · 动态" icon="ph:chart-line-up-bold" card>
	<ul class="stats">
		<li>
			<span class="num">{{ items.length }}</span>
			<span class="label">动态</span>
		</li>
		<li>
			<span class="num">{{ activeAuthors }}</span>
			<span class="label">朋友</span>
		</li>
		<li>
			<span class="num">{{ thisMonthCount }}</span>
			<span class="label">本月</span>
		</li>
	</ul>

	<div class="refresh-row">
		<span class="updated">更新于 {{ generatedLabel }}</span>
		<button
			type="button"
			class="refresh-btn"
			:disabled="refreshing"
			@click="emit('refresh')"
		>
			<Icon name="ph:arrows-clockwise-bold" :class="{ spin: refreshing }" />
			<span>{{ refreshing ? '刷新中' : '刷新' }}</span>
		</button>
	</div>
</Widget>
</template>

<style lang="scss" scoped>
.stats {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;
	margin: 0 0 0.85rem;
	padding: 0;
	list-style: none;

	li {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.6rem 0.25rem;
		border-radius: var(--radius-md);
		background: var(--c-bg-2);
	}

	.num {
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.1;
		color: var(--main-color);
	}

	.label {
		margin-top: 0.2rem;
		font-size: 0.75rem;
		color: var(--font-color-2);
	}
}

.refresh-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	font-size: 0.78rem;
	color: var(--font-color-3);
}

.refresh-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.3rem;
	padding: 0.3rem 0.6rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-md);
	background: var(--card-bg);
	font-size: 0.78rem;
	color: var(--font-color-2);
	transition: color 0.2s ease, border-color 0.2s ease;
	cursor: pointer;

	&:hover:not(:disabled) {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	&:disabled {
		opacity: 0.7;
		cursor: not-allowed;
	}

	:deep(svg) {
		width: 0.85rem;
		height: 0.85rem;
	}

	.spin {
		animation: spin 0.9s linear infinite;
	}
}

@keyframes spin {
	to {
		transform: rotate(360deg);
	}
}
</style>
