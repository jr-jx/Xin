<script setup lang="ts">
import type { LikesState, ReactionKey } from '~/composables/useFriendsLikes'
import type { FriendsResponse } from '~/types/feed'
import { createEmptyLikes, LIKES_STATE_KEY } from '~/composables/useFriendsLikes'
import { getPostDate } from '~/utils/date'
import { getArchIcon } from '~/utils/icon'

useSeoMeta({
	title: '朋友圈',
	description: '朋友们的最新动态',
})

const refreshToken = ref(0)
const fetchQuery = computed(() => refreshToken.value ? { refresh: String(refreshToken.value) } : {})
const { data, pending, error, status } = await useFetch<FriendsResponse>('/api/friends', {
	key: 'friends-feed',
	query: fetchQuery,
	cache: 'no-store',
	default: () => ({ items: [], sources: [], generatedAt: '' }),
})

const items = computed(() => data.value?.items ?? [])
const sources = computed(() => data.value?.sources ?? [])
const failedSources = computed(() => sources.value.filter(s => !s.ok))
const refreshing = computed(() => status.value === 'pending')

// 点赞状态（provide 给 FriendsReactions）
const likesState = ref<LikesState>(createEmptyLikes())
provide(LIKES_STATE_KEY, likesState)

async function loadLikes() {
	const links = items.value.map(i => i.link).filter(Boolean)
	if (!links.length)
		return
	try {
		const payload = btoa(unescape(encodeURIComponent(JSON.stringify(links))))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '')
		const res = await $fetch<{
			counts: Record<string, Partial<Record<ReactionKey, number>>>
			likedByMe: Record<string, ReactionKey[]>
		}>('/api/likes', { query: { links: payload } })
		likesState.value = {
			counts: res.counts ?? {},
			liked: res.likedByMe ?? {},
			pending: {},
		}
	}
	catch (err) {
		console.warn('[friends] load likes failed:', err)
	}
}

// 首屏（包含 SSR）拉取计数
if (import.meta.server)
	await loadLikes()

// 客户端数据刷新后（或 hydrate 后）补一次，确保 liked 反映真实 IP
onMounted(() => {
	loadLikes()
})

watch(items, () => {
	if (import.meta.client)
		loadLikes()
}, { flush: 'post' })

// 搜索过滤
const query = ref('')
// 作者筛选：空串 = 全部，否则匹配 siteLink
const authorFilter = ref('')

const filteredItems = computed(() => {
	const q = query.value.trim().toLowerCase()
	const author = authorFilter.value
	return items.value.filter((p) => {
		if (author && p.siteLink !== author)
			return false
		if (!q)
			return true
		return [p.title, p.summary, p.author, p.sitenick]
			.some(v => v?.toLowerCase().includes(q))
	})
})

// 客户端分页：默认 10 条，点击"加载更多"每次 +10
const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)
const pagedItems = computed(() => filteredItems.value.slice(0, visibleCount.value))
const remainingCount = computed(() => Math.max(0, filteredItems.value.length - visibleCount.value))
const showEndTip = computed(() => filteredItems.value.length > PAGE_SIZE && remainingCount.value === 0)

// 搜索 / 作者筛选 / 刷新后重置分页
watch(filteredItems, () => {
	visibleCount.value = PAGE_SIZE
})

function loadMore() {
	visibleCount.value += PAGE_SIZE
}

// 可折叠摘要
const SUMMARY_THRESHOLD = 80
const expanded = ref<Set<string>>(new Set())
function toggleExpand(key: string) {
	const next = new Set(expanded.value)
	if (next.has(key))
		next.delete(key)
	else
		next.add(key)
	expanded.value = next
}

function onRefresh() {
	refreshToken.value = Date.now()
}
</script>

<template>
<div class="friends-page">
	<PageBanner
		v-fade-up
		title="朋友圈"
		desc="朋友们的最新动态"
		footer="基于订阅源聚合"
		image="https://cdn.lightxi.com/cloudreve/uploads/2025/08/03/S9ethiQA_9298cf4b972a1ea927236a66a18e4e27.jpg"
	/>

	<div class="layout">
		<!-- 左栏：作者筛选 + 随机串门 + 快捷入口 -->
		<aside v-fade-up class="col left">
			<div class="sticky">
				<FriendsAuthorFilter v-model="authorFilter" :items="items" />
				<FriendsRandom :items="filteredItems" />
				<FriendsShortcuts />
			</div>
		</aside>

		<!-- 中间：时间线 -->
		<section class="col center">
			<!-- 移动端搜索置顶 -->
			<div class="mobile-search">
				<FriendsSearch v-model="query" />
			</div>

			<div v-if="pending && items.length === 0" class="state-tip">
				正在加载朋友们的动态...
			</div>
			<div v-else-if="error" class="state-tip error">
				加载失败：{{ error.message }}
				<button class="retry" @click="onRefresh">
					重试
				</button>
			</div>

			<ul v-if="pagedItems.length" class="moment-list">
				<li
					v-for="(post, i) in pagedItems"
					:key="`${post.link}-${i}`"
					v-fade-up="Math.min(i, 8) * 40"
					class="moment"
				>
					<a
						:href="post.siteLink"
						target="_blank"
						rel="noopener noreferrer"
						class="avatar-link"
						:title="post.author"
					>
						<img
							class="avatar"
							:src="post.avatar"
							:alt="post.author"
							loading="lazy"
							referrerpolicy="no-referrer"
						>
					</a>
					<div class="bubble">
						<div class="meta-top">
							<a
								class="nickname"
								:href="post.siteLink"
								target="_blank"
								rel="noopener noreferrer"
							>{{ post.sitenick || post.author }}</a>
							<span
								v-if="post.sitenick && post.author !== post.sitenick"
								class="sub-author"
							>@{{ post.author }}</span>
						</div>

						<a
							class="post-title"
							:href="post.link"
							target="_blank"
							rel="noopener noreferrer"
						>{{ post.title }}</a>

						<template v-if="post.summary">
							<p
								class="summary"
								:class="{ expanded: expanded.has(post.link) }"
							>
								{{ post.summary }}
							</p>
							<button
								v-if="post.summary.length > SUMMARY_THRESHOLD"
								type="button"
								class="expand-btn"
								@click="toggleExpand(post.link)"
							>
								{{ expanded.has(post.link) ? '收起' : '展开' }}
								<Icon :name="expanded.has(post.link) ? 'ph:caret-up-bold' : 'ph:caret-down-bold'" />
							</button>
						</template>

						<a
							v-if="post.cover"
							:href="post.link"
							target="_blank"
							rel="noopener noreferrer"
							class="cover-wrap"
						>
							<img
								class="cover"
								:src="post.cover"
								:alt="post.title"
								loading="lazy"
								referrerpolicy="no-referrer"
							>
						</a>

						<div class="meta-bottom">
							<div class="meta-left">
								<time class="date" :datetime="post.pubDate">{{ getPostDate(post.pubDate) }}</time>
								<div v-if="post.archs?.length" class="archs">
									<span
										v-for="arch in post.archs"
										:key="arch"
										class="arch-tag"
									>
										<Icon v-tip="arch" :name="getArchIcon(arch as any)" />
									</span>
								</div>
							</div>
							<FriendsReactions :id="post.link" />
						</div>
					</div>
				</li>
			</ul>

			<div v-if="pagedItems.length && remainingCount > 0" class="load-more-wrap">
				<button type="button" class="load-more" @click="loadMore">
					<Icon name="ph:arrow-down-bold" />
					<span>加载更多（剩 {{ remainingCount }} 条）</span>
				</button>
			</div>
			<div v-else-if="showEndTip" class="end-tip">
				— 到底啦 —
			</div>

			<div v-else-if="items.length && query" class="state-tip">
				没有匹配「{{ query }}」的动态
			</div>
			<div v-else-if="items.length && authorFilter" class="state-tip">
				该朋友暂无动态
			</div>
			<div v-else-if="!pending && !error" class="state-tip">
				暂无动态
			</div>

			<details v-if="failedSources.length" class="failed-sources">
				<summary>{{ failedSources.length }} 个订阅源暂时不可用</summary>
				<ul>
					<li v-for="s in failedSources" :key="s.feed || s.siteLink">
						<a :href="s.siteLink" target="_blank" rel="noopener noreferrer">{{ s.sitenick || s.author }}</a>
						<span v-if="s.error" class="err-msg">— {{ s.error }}</span>
					</li>
				</ul>
			</details>

			<PostComment />
		</section>

		<!-- 右栏：搜索 + 统计 + 活跃榜 -->
		<aside v-fade-up class="col right">
			<div class="sticky">
				<div class="desktop-search">
					<FriendsSearch v-model="query" />
				</div>
				<FriendsStats
					:items="items"
					:sources="sources"
					:generated-at="data?.generatedAt ?? ''"
					:refreshing="refreshing"
					@refresh="onRefresh"
				/>
				<FriendsRanking :items="items" />
			</div>
		</aside>
	</div>
</div>
</template>

<style lang="scss" scoped>
.layout {
	display: grid;
	grid-template-columns: 1fr minmax(0, 720px) 1fr;
	align-items: stretch;
	gap: 1rem;
	max-width: 1250px;
	margin: 0 auto;
	padding: 1.5rem 0.75rem 0;

	@media (max-width: 1199px) {
		grid-template-columns: minmax(0, 720px) clamp(240px, 26vw, 280px);
		justify-content: center;
		gap: 0.75rem;

		.col.left {
			display: none;
		}
	}

	@media (max-width: 899px) {
		grid-template-columns: minmax(0, 1fr);

		.col.left,
		.col.right {
			display: none;
		}
	}
}

.col {
	min-width: 0;

	&.center {
		grid-column: 2 / 3;

		@media (max-width: 1199px) {
			grid-column: 1 / 2;
		}

		@media (max-width: 899px) {
			grid-column: 1 / -1;
		}
	}

	&.left {
		grid-column: 1 / 2;
	}

	&.right {
		grid-column: 3 / 4;

		@media (max-width: 1199px) {
			grid-column: 2 / 3;
		}
	}
}

.sticky {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	position: sticky;
	overflow-y: auto;
	top: calc(4rem + 0.5rem);
	max-height: calc(100vh - 5rem);

	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: var(--radius-full);
		background: rgb(156 163 175 / 35%);
	}
}

.mobile-search {
	display: none;
	margin-bottom: 1rem;

	@media (max-width: 899px) {
		display: block;
	}
}

.desktop-search {
	@media (max-width: 899px) {
		display: none;
	}
}

.state-tip {
	padding: 2.5rem 1rem;
	font-size: 0.95rem;
	text-align: center;
	color: var(--font-color-2);

	&.error {
		color: #E26060;
	}

	.retry {
		margin-left: 0.5rem;
		padding: 0.25rem 0.75rem;
		border: 1px solid var(--c-border);
		border-radius: var(--radius-md);
		background: var(--c-bg-2);
		font-size: 0.85rem;
		color: inherit;
		cursor: pointer;

		&:hover {
			border-color: var(--main-color);
			color: var(--main-color);
		}
	}
}

.moment-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.moment {
	display: flex;
	gap: 0.85rem;
	position: relative;
	padding: 1.25rem 0;
	border-bottom: 1px dashed var(--c-border);

	&:last-child {
		border-bottom: none;
	}
}

.avatar-link {
	display: block;
	flex-shrink: 0;
	width: 44px;
	height: 44px;
}

.avatar {
	width: 44px;
	height: 44px;
	border: 1px solid var(--c-border);
	border-radius: 8px;
	background: var(--c-bg-2);
	transition: transform 0.3s ease;
	object-fit: cover;

	&:hover {
		transform: scale(1.05);
	}
}

.bubble {
	flex: 1;
	min-width: 0;
}

.meta-top {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	margin-bottom: 0.35rem;
}

.nickname {
	font-size: 0.95rem;
	font-weight: 600;
	text-decoration: none;
	color: var(--main-color);

	&:hover {
		text-decoration: underline;
	}
}

.sub-author {
	font-size: 0.78rem;
	color: var(--font-color-3);
}

.post-title {
	display: block;
	overflow-wrap: anywhere;
	margin-bottom: 0.4rem;
	font-size: 1rem;
	font-weight: 600;
	line-height: 1.45;
	text-decoration: none;
	color: var(--font-color);
	transition: color 0.2s ease;

	&:hover {
		color: var(--main-color);
	}
}

.summary {
	display: -webkit-box;
	overflow: hidden;
	margin: 0 0 0.35rem;
	font-size: 0.88rem;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.6;
	color: var(--font-color-2);
	-webkit-box-orient: vertical;

	&.expanded {
		display: block;
		overflow: visible;
		-webkit-line-clamp: unset;
		line-clamp: unset;
	}
}

.expand-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	margin-bottom: 0.4rem;
	padding: 0.1rem 0.45rem;
	border: none;
	border-radius: var(--radius-md);
	background: transparent;
	font-size: 0.75rem;
	color: var(--main-color);
	transition: background 0.2s ease;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
	}

	:deep(svg) {
		width: 0.7rem;
		height: 0.7rem;
	}
}

.cover-wrap {
	display: block;
	overflow: hidden;
	margin: 0.4rem 0 0.6rem;
	border: 1px solid var(--c-border);
	border-radius: 12px;
	background: var(--c-bg-2);
}

.cover {
	display: block;
	width: 100%;
	max-height: 280px;
	transition: transform 0.4s ease;
	object-fit: cover;

	&:hover {
		transform: scale(1.02);
	}
}

.meta-bottom {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.meta-left {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.date {
	font-size: 0.78rem;
	color: var(--font-color-3);
}

.archs {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
}

.arch-tag {
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.45rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-md);
	background: var(--c-bg-2);
	font-size: 0.7rem;

	.icon {
		width: 0.8rem;
		height: 0.8rem;
		color: var(--main-color);
	}
}

.load-more-wrap {
	display: flex;
	justify-content: center;
	margin: 1rem 0 0.5rem;
}

.load-more {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.55rem 1.1rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-md);
	background: var(--card-bg);
	font-size: 0.85rem;
	font-weight: 600;
	color: var(--font-color-2);
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: var(--main-color);
		box-shadow: 0 4px 14px rgb(0 0 0 / 8%);
		color: var(--main-color);
		transform: translateY(-1px);

		:deep(svg) {
			transform: translateY(2px);
		}
	}

	:deep(svg) {
		width: 0.9rem;
		height: 0.9rem;
		transition: transform 0.2s ease;
	}
}

.end-tip {
	padding: 1.5rem 1rem 0.5rem;
	font-size: 0.8rem;
	letter-spacing: 0.1em;
	text-align: center;
	color: var(--font-color-3);
	user-select: none;
}

.failed-sources {
	margin: 1.5rem 0 0.5rem;
	padding: 0.75rem 1rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius-md);
	background: var(--c-bg-2);
	font-size: 0.85rem;
	color: var(--font-color-2);

	summary {
		cursor: pointer;
		user-select: none;
	}

	ul {
		margin: 0.6rem 0 0;
		padding-left: 1.25rem;

		li + li {
			margin-top: 0.25rem;
		}
	}

	a {
		text-decoration: none;
		color: var(--main-color);

		&:hover {
			text-decoration: underline;
		}
	}

	.err-msg {
		color: var(--font-color-3);
	}
}

@media (max-width: 600px) {
	.layout {
		padding: 1rem 0.5rem 0;
	}

	.moment {
		gap: 0.65rem;
		padding: 1rem 0;
	}

	.avatar,
	.avatar-link {
		width: 38px;
		height: 38px;
	}

	.post-title {
		font-size: 0.95rem;
	}

	.summary {
		font-size: 0.85rem;
	}

	.cover {
		max-height: 220px;
	}
}
</style>
