<script lang="ts" setup>
import { storeToRefs } from 'pinia'

interface DanmakuProps {
	maxTextLength?: number
	class?: string
}

const props = withDefaults(defineProps<DanmakuProps>(), {
	maxTextLength: 50,
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
	try {
		const appConfig = useAppConfig()
		if (appConfig.twikoo?.envId) {
			await commentsStore.fetchRecentComments(
				appConfig.twikoo.envId,
				9,
				false,
			)
		}
	}
	catch (error) {
		console.error('Failed to fetch comments:', error)
	}
})

onErrorCaptured((error) => {
	console.error('Comment component error:', error)
	return false
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
	<Icon name="mdi:comment-text-outline" class="empty-icon" />
	<div class="empty-text">
		暂无评论
	</div>
</div>

<div
	v-else
	class="comment-grid"
	aria-label="评论列表"
>
	<NuxtLink
		v-for="item in limitedComments"
		:key="item.id"
		:to="`${item.url}#${item.id}`"
		class="comment-card"
		@click="handlePostClick"
	>
		<div class="comment-header">
			<img
				class="comment-avatar"
				:src="item.avatar"
				:alt="item.nick"
				loading="lazy"
			>
			<span class="comment-nick">{{ item.nick }}</span>
			<time class="comment-date">{{ formatDate(new Date(item.created || '')) }}</time>
		</div>
		<p class="comment-text">
			{{ truncateText(item.commentText) }}
		</p>
	</NuxtLink>
</div>
</template>

<style lang="scss" scoped>
.comment-grid {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
}

.comment-card {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.75rem;
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

.comment-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.comment-avatar {
	width: 2rem;
	height: 2rem;
	border-radius: var(--radius-full);
	object-fit: cover;
}

.comment-nick {
	font-size: 0.8rem;
	font-weight: 600;
	color: var(--font-color);
	transition: color 0.2s ease;
}

.comment-date {
	margin-left: auto;
	font-size: 0.7rem;
	color: var(--font-color-3);
}

.comment-text {
	display: -webkit-box;
	overflow: hidden;
	margin: 0;
	font-size: 0.8rem;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.5;
	color: var(--font-color-2);
	-webkit-box-orient: vertical;
}

.comment-empty {
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
</style>
