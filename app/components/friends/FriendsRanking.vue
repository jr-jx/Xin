<script setup lang="ts">
import type { FriendItem } from '~/types/feed'
import { getPostDate } from '~/utils/date'

defineOptions({ name: 'FriendsRanking' })

const props = defineProps<{
	items: FriendItem[]
	limit?: number
}>()

interface RankRow {
	author: string
	sitenick?: string
	avatar: string
	siteLink: string
	count: number
	latest: string
}

const ranking = computed<RankRow[]>(() => {
	const map = new Map<string, RankRow>()
	for (const p of props.items) {
		const key = p.siteLink || p.author
		const existing = map.get(key)
		if (existing) {
			existing.count += 1
			if (new Date(p.pubDate) > new Date(existing.latest))
				existing.latest = p.pubDate
		}
		else {
			map.set(key, {
				author: p.author,
				sitenick: p.sitenick,
				avatar: p.avatar,
				siteLink: p.siteLink,
				count: 1,
				latest: p.pubDate,
			})
		}
	}
	return [...map.values()]
		.sort((a, b) => +new Date(b.latest) - +new Date(a.latest))
		.slice(0, props.limit ?? 8)
})
</script>

<template>
<Widget title="活跃朋友" icon="ph:flame-bold" card>
	<ul v-if="ranking.length" class="rank-list">
		<li v-for="(row, i) in ranking" :key="row.siteLink" class="rank-item">
			<span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
			<a
				class="rank-link"
				:href="row.siteLink"
				target="_blank"
				rel="noopener noreferrer"
				:title="row.author"
			>
				<img
					class="rank-avatar"
					:src="row.avatar"
					:alt="row.author"
					loading="lazy"
					referrerpolicy="no-referrer"
				>
				<div class="rank-meta">
					<span class="rank-name">{{ row.sitenick || row.author }}</span>
					<span class="rank-sub">{{ row.count }} 条 · {{ getPostDate(row.latest) }}</span>
				</div>
			</a>
		</li>
	</ul>
	<p v-else class="empty">
		暂无数据
	</p>
</Widget>
</template>

<style lang="scss" scoped>
.rank-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.rank-item {
	display: flex;
	align-items: center;
	gap: 0.55rem;

	+ .rank-item {
		margin-top: 0.55rem;
	}
}

.rank-no {
	display: inline-flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 1.25rem;
	height: 1.25rem;
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 700;
	color: var(--font-color-3);

	&.top {
		background: var(--main-color);
		color: var(--white, #FFF);
	}
}

.rank-link {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;
	padding: 0.25rem 0.35rem;
	border-radius: var(--radius-md);
	text-decoration: none;
	color: inherit;
	transition: background 0.2s ease;

	&:hover {
		background: var(--c-bg-2);

		.rank-name {
			color: var(--main-color);
		}
	}
}

.rank-avatar {
	flex-shrink: 0;
	width: 28px;
	height: 28px;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-full);
	object-fit: cover;
}

.rank-meta {
	display: flex;
	flex: 1;
	flex-direction: column;
	min-width: 0;
	line-height: 1.2;
}

.rank-name {
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 600;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);
	transition: color 0.2s ease;
}

.rank-sub {
	overflow: hidden;
	margin-top: 0.15rem;
	font-size: 0.7rem;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color-3);
}

.empty {
	margin: 0;
	font-size: 0.85rem;
	color: var(--font-color-3);
}
</style>
