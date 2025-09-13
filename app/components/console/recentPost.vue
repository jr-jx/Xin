<script lang="ts" setup>
interface RecentPostProps {
	maxPosts?: number
	class?: string
}

const props = withDefaults(defineProps<RecentPostProps>(), {
	maxPosts: 8,
})

const consoleStore = useConsoleStore()

// 直接使用 useContentLoader 确保数据在所有页面都能正确加载
const { publishedPosts, postsPending: loading } = useContentLoader()

const recentPosts = computed(() =>
	publishedPosts.value.slice(0, props.maxPosts),
)

const hasPosts = computed(() => recentPosts.value.length > 0)

function formatPostDate(date?: string): string {
	if (!date)
		return ''
	const d = new Date(date as string)
	return d.toISOString().split('T')[0] || ''
}

function handlePostClick() {
	consoleStore.showConsole = !consoleStore.showConsole
}
</script>

<template>
<div
	class="recent-posts-container"
	:class="props.class"
	role="region"
	aria-label="最近文章"
>
	<div
		v-if="!hasPosts && !loading"
		class="recent-posts-empty"
		role="status"
		aria-live="polite"
	>
		<Icon name="mdi:file-document-outline" class="empty-icon" />
		<div class="empty-text">
			暂无文章
		</div>
	</div>

	<div
		v-if="loading"
		class="recent-posts-loading"
		role="status"
		aria-live="polite"
	>
		<div
			class="loading-spinner"
			aria-hidden="true"
		/>
		<div class="loading-text">
			加载文章中...
		</div>
	</div>

	<div
		v-if="hasPosts"
		class="timeline-container"
		role="list"
		aria-label="文章时间轴"
	>
		<div
			v-for="(post, index) in recentPosts"
			:key="post.path"
			class="timeline-item"
			:data-post-index="index"
			role="listitem"
			:aria-label="`文章：${post.title || '未命名文章'}`"
		>
			<div class="timeline-date-section">
				<div class="timeline-date">
					{{ formatPostDate(post.date) }}
				</div>
			</div>

			<div class="timeline-connector">
				<div class="timeline-dot" :class="{ first: index === 0, last: index === recentPosts.length - 1 }" />
				<div v-if="index < recentPosts.length - 1" class="timeline-line" />
			</div>

			<div class="timeline-content-section">
				<NuxtLink
					:to="post.path"
					:aria-label="`阅读文章：${post.title || '未命名文章'}`"
					class="post-link"
					@click="handlePostClick"
				>
					<div class="post-title">
						{{ post.title || '未命名文章' }}
					</div>
				</NuxtLink>
			</div>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
$p-border-radius: 4px;
$p-transition-fast: 0.2s ease;
$p-transition-normal: 0.3s ease;

.recent-posts-container {
	position: relative;
	overflow: hidden;
	min-height: 200px;
}

.timeline-container {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	position: relative;
	width: 100%;
	min-height: 180px;
}

.timeline-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	position: relative;
	padding: 0.5rem;
	border-radius: $p-border-radius;
	transition: all $p-transition-normal;

	&:hover {
		.timeline-dot {
			box-shadow: 0 0 8px var(--main-color);
			transform: scale(1.2);
		}

		.timeline-line {
			opacity: 1;
		}

		.post-title {
			color: var(--main-color);
		}
	}
}

.timeline-date-section {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 80px;
	padding: 0.15rem;
	border-radius: $p-border-radius;
	transition: all $p-transition-normal;
}

.timeline-date {
	font-size: 0.7rem;
	font-weight: 600;
	line-height: 1.2;
	text-align: center;
	color: var(--font-color-3);
}

.timeline-connector {
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;
	min-width: 20px;
	margin: 0 0.5rem;
}

.timeline-dot {
	position: relative;
	width: 8px;
	height: 8px;
	border: 2px solid var(--card-bg);
	border-radius: 50%;
	background: var(--main-color);
	transition: all $p-transition-fast;
	z-index: 2;

	&.first {
		box-shadow: 0 0 0 2px var(--main-color-bg);
		background: var(--main-color);
	}

	&.last {
		background: var(--main-color);
	}
}

.timeline-line {
	position: absolute;
	opacity: 0.6;
	top: 8px;
	left: 50%;
	width: 2px;
	height: 3.13rem;
	border-radius: 1px;
	background: var(--main-color);
	transform: translateX(-50%);
	transition: opacity $p-transition-fast;
}

.timeline-content-section {
	flex: 1;
	min-width: 0;
}

.post-link {
	display: block;
	position: relative;
	width: auto;
	padding: 0.25rem 0;
	text-decoration: none;
	color: inherit;
	transition: all $p-transition-fast;

	&:hover {
		.post-title {
			color: var(--main-color);
		}
	}
}

.post-title {
	display: -webkit-box;
	overflow: hidden;
	font-size: 0.8rem;
	font-weight: 600;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.4;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);
	transition: color $p-transition-fast;
	-webkit-box-orient: vertical;
}

.recent-posts-empty,
.recent-posts-loading {
	display: flex;
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
