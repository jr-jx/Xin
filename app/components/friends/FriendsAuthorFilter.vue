<script setup lang="ts">
import type { FriendItem } from '~/types/feed'

defineOptions({ name: 'FriendsAuthorFilter' })

const props = defineProps<{
	items: FriendItem[]
}>()

/** 选中作者的 siteLink，空字符串表示"全部" */
const selected = defineModel<string>({ default: '' })

interface Row {
	siteLink: string
	author: string
	sitenick?: string
	avatar: string
	count: number
}

const authors = computed<Row[]>(() => {
	const map = new Map<string, Row>()
	for (const p of props.items) {
		const key = p.siteLink || p.author
		const existing = map.get(key)
		if (existing) {
			existing.count += 1
		}
		else {
			map.set(key, {
				siteLink: p.siteLink,
				author: p.author,
				sitenick: p.sitenick,
				avatar: p.avatar,
				count: 1,
			})
		}
	}
	return [...map.values()].sort((a, b) => b.count - a.count)
})

function pick(key: string) {
	selected.value = selected.value === key ? '' : key
}
</script>

<template>
<Widget title="朋友筛选" icon="ph:users-three-bold" card>
	<ul class="author-list">
		<li>
			<button
				type="button"
				class="author-row all"
				:class="{ active: !selected }"
				@click="selected = ''"
			>
				<Icon name="ph:squares-four-bold" class="all-icon" />
				<span class="name">全部</span>
				<span class="count">{{ items.length }}</span>
			</button>
		</li>
		<li v-for="row in authors" :key="row.siteLink">
			<button
				type="button"
				class="author-row"
				:class="{ active: selected === row.siteLink }"
				:title="row.author"
				@click="pick(row.siteLink)"
			>
				<img
					class="avatar"
					:src="row.avatar"
					:alt="row.author"
					loading="lazy"
					referrerpolicy="no-referrer"
				>
				<span class="name">{{ row.sitenick || row.author }}</span>
				<span class="count">{{ row.count }}</span>
			</button>
		</li>
	</ul>
</Widget>
</template>

<style lang="scss" scoped>
.author-list {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	overflow-y: auto;
	max-height: 320px;
	margin: 0;
	padding: 0;
	list-style: none;

	/* 窄滚动条 */
	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: var(--radius-full);
		background: rgb(156 163 175 / 35%);
	}
}

.author-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	width: 100%;
	padding: 0.35rem 0.45rem;
	border: 1px solid transparent;
	border-radius: var(--radius-md);
	background: transparent;
	font-size: 0.82rem;
	color: var(--font-color);
	transition: all 0.18s ease;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
	}

	&.active {
		border-color: var(--main-color);
		background: rgb(var(--main-color-rgb, 59, 130, 246), 0.08);
		color: var(--main-color);

		.count {
			background: var(--main-color);
			color: var(--white, #FFF);
		}
	}
}

.avatar {
	flex-shrink: 0;
	width: 20px;
	height: 20px;
	border-radius: var(--radius-full);
	object-fit: cover;
}

.all-icon {
	flex-shrink: 0;
	width: 20px;
	height: 20px;
	color: var(--font-color-2);

	.active & {
		color: var(--main-color);
	}
}

.name {
	flex: 1;
	overflow: hidden;
	min-width: 0;
	white-space: nowrap;
	text-align: left;
	text-overflow: ellipsis;
}

.count {
	flex-shrink: 0;
	min-width: 1.25rem;
	padding: 0.05rem 0.4rem;
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 600;
	text-align: center;
	color: var(--font-color-3);
	transition: all 0.18s ease;
}
</style>
