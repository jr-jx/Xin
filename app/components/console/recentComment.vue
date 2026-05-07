<script lang="ts" setup>
import { storeToRefs } from 'pinia'

interface RecentCommentProps {
	maxTextLength?: number
	class?: string
}

const props = withDefaults(defineProps<RecentCommentProps>(), {
	maxTextLength: 54,
})

const consoleStore = useConsoleStore()
const commentsStore = useCommentsStore()
const { comments, loading } = storeToRefs(commentsStore)

const limitedComments = computed(() => (comments.value ? comments.value.slice(0, 9) : []))
const hasComments = computed(() => comments.value && comments.value.length > 0)

function truncateText(text: string, maxLength: number = props.maxTextLength): string {
	if (!text || typeof text !== 'string')
		return ''
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

onMounted(async () => {
	await commentsStore.fetchRecentComments(9, true)
})

function handlePostClick() {
	consoleStore.showConsole = !consoleStore.showConsole
}
</script>

<template>
<div
	v-if="!hasComments && !loading"
	class="comment-empty"
	aria-live="polite"
>
	<Icon name="ph:chat-circle-dots-bold" class="empty-icon" />
	<div class="empty-text">
		暂无评论
	</div>
</div>

<div
	v-else
	class="comment-feed"
	aria-label="评论列表"
>
	<div v-if="loading && !hasComments" class="comment-loading">
		<Icon name="ph:circle-notch-bold" class="spin" />
		加载中…
	</div>
	<template v-else>
		<NuxtLink
			v-for="item in limitedComments"
			:key="item.id"
			:to="`${item.url}#${item.id}`"
			class="comment-card"
			@click="handlePostClick"
		>
			<img
				class="comment-avatar"
				:src="item.avatar"
				:alt="item.nick"
				loading="lazy"
			>
			<div class="comment-body">
				<div class="comment-header">
					<span class="comment-nick">{{ item.nick }}</span>
					<span v-if="item.replyToNick" class="reply-chip">回复</span>
					<time class="comment-date">{{ formatDate(new Date(item.created || Date.now())) }}</time>
				</div>
				<p class="comment-text">
					{{ truncateText(item.commentText) }}
				</p>
			</div>
		</NuxtLink>
	</template>
</div>
</template>

<style lang="scss" scoped>
.comment-feed {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.comment-card {
	display: grid;
	grid-template-columns: 2rem minmax(0, 1fr);
	gap: 0.55rem;
	padding: 0.65rem;
	border-radius: var(--radius);
	text-decoration: none;
	color: inherit;
	transition: background-color 0.2s ease;

	&:hover {
		background-color: var(--c-bg-2);

		.comment-nick {
			color: var(--main-color);
		}
	}
}

.comment-avatar {
	width: 2rem;
	height: 2rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	object-fit: cover;
}

.comment-body {
	min-width: 0;
}

.comment-header {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	min-width: 0;
}

.comment-nick {
	overflow: hidden;
	font-size: 0.8rem;
	font-weight: 700;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);
	transition: color 0.2s ease;
}

.reply-chip {
	flex-shrink: 0;
	padding: 0.05rem 0.28rem;
	border-radius: var(--radius-sm);
	background: var(--main-color-bg);
	font-size: 0.62rem;
	color: var(--main-color);
}

.comment-date {
	flex-shrink: 0;
	margin-left: auto;
	font-size: 0.68rem;
	color: var(--font-color-3);
}

.comment-text {
	display: -webkit-box;
	overflow: hidden;
	margin: 0.28rem 0 0;
	font-size: 0.8rem;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.5;
	color: var(--font-color-2);
	-webkit-box-orient: vertical;
}

.comment-empty,
.comment-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	padding: 2rem;
	text-align: center;
	color: var(--font-color-3);
}

.empty-icon {
	opacity: 0.5;
	width: 2rem;
	height: 2rem;
}

.empty-text {
	font-size: 0.875rem;
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
