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
	class="danmaku-empty"
	role="status"
	aria-live="polite"
>
	<Icon name="mdi:comment-text-outline" class="empty-icon" />
	<div class="empty-text">
		暂无评论
	</div>
</div>

<div
	v-if="loading"
	class="danmaku-loading"
	aria-live="polite"
>
	<div
		class="loading-spinner"
		aria-hidden="true"
	/>
	<div class="loading-text">
		加载评论中...
	</div>
</div>

<div
	v-if="hasComments"
	class="danmaku-area"
	aria-label="评论列表"
>
	<!-- 弹幕项 -->
	<div
		v-for="danmaku in limitedComments"
		:key="danmaku.id"
		class="danmaku-item"
		:data-comment-id="danmaku.id"
		:aria-label="`评论由 ${danmaku.nick} 发布`"
	>
		<div class="danmaku-avatar-section">
			<div class="danmaku-avatar">
				<img
					:src="danmaku.avatar"
					:alt="`${danmaku.nick} 的头像`"
					loading="lazy"
				>
			</div>
		</div>

		<div class="danmaku-content-section">
			<header class="danmaku-header">
				<h4 class="danmaku-title">
					{{ danmaku.nick }}
				</h4>
				<time
					class="danmaku-date"
					:datetime="danmaku.created?.toString() || ''"
				>
					{{ formatDate(new Date(danmaku.created || '')) }}
				</time>
			</header>

			<!-- 中间分割线 -->
			<hr class="danmaku-divider" aria-hidden="true">

			<!-- 下部：评论内容 -->
			<NuxtLink
				:to="`${danmaku.url}#${danmaku.id}`"
				class="danmaku-text"
				:aria-label="`查看评论详情：${truncateText(danmaku.commentText)}`"
				tabindex="0"
				@click="handlePostClick"
			>
				{{ truncateText(danmaku.commentText) }}
				<div
					class="danmaku-text-border"
					aria-hidden="true"
				/>
			</NuxtLink>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.danmaku-area {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(3, 1fr);
	gap: 0.5rem;
	width: 100%;
	min-height: 180px;
	padding: 0.5rem;
}

.danmaku-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	position: relative;
	padding: 0.5rem;
	border-radius: 4px;
	transition: all 0.3s ease;

	.danmaku-divider {
		transition: all 0.5s ease;
	}

	&:hover {
		.danmaku-divider {
			width: 0;
			margin-left: 100%;
		}

		.danmaku-title {
			color: var(--main-color);
		}
	}
}

.danmaku-avatar-section {
	display: flex;
	align-items: center;
	justify-content: center;
	min-width: 40px;
	padding: 0.15rem;
	border-radius: 4px;
	transition: all 0.3s ease;
}

.danmaku-divider {
	position: relative;
	width: 100%;
	height: 1px;
	margin: 0.25rem 0;
	border-radius: 1px;
	background: var(--main-color-bg);
}

.danmaku-content-section {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.25rem;
}

.danmaku-header {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8rem;
	font-weight: 700;
}

.danmaku-title {
	font-weight: 600;
	line-height: 1.2;
	color: var(--font-color);
	transition: color 0.3s ease;
}

.danmaku-date {
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-3);
}

.danmaku-text {
	position: relative;
	width: auto;
	padding: 0.25rem 0;
	font-size: 0.8rem;
	line-height: 1.4;
	color: var(--font-color);
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		color: var(--main-color);

		.danmaku-text-border {
			width: 100%;
		}
	}
}

.danmaku-text-border {
	position: absolute;
	bottom: 0;
	left: 0;
	width: 0;
	height: 1px;
	border-radius: 1px;
	background: var(--main-color-bg);
	transition: width 0.3s ease;

	&.active {
		width: 100%;
	}
}

.danmaku-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	width: 60px;
	height: 60px;
	padding: 0.1rem;
	border: 1px solid var(--main-color-bg);
	border-radius: 50%;
	background: var(--c-bg-2);

	img {
		width: calc(100% - 0.2rem);
		height: calc(100% - 0.2rem);
		border-radius: 50%;
		transition: all 0.2s ease;
		object-fit: cover;
	}
}

.danmaku-empty,
.danmaku-loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: absolute;
	top: 50%;
	left: 50%;
	min-width: 120px;
	padding: 1rem;
	border: var(--border);
	border-radius: 4px;
	background: var(--card-bg);
	text-align: center;
	color: var(--font-color-3);
	transform: translate(-50%, -50%);
}

.empty-icon {
	opacity: 0.7;
	margin-bottom: 0.5rem;
	font-size: 1.5rem;
}

.empty-text,
.loading-text {
	margin: 0;
	font-size: 0.875rem;
	font-weight: 500;
}

.loading-spinner {
	width: 20px;
	height: 20px;
	margin-bottom: 0.5rem;
	border: 2px solid var(--border-color);
	border-top: 2px solid var(--main-color);
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
	.danmaku-container {
		min-height: 160px;
		padding: 0.75rem;
	}

	.danmaku-area {
		grid-template-columns: repeat(2, 1fr);
		grid-template-rows: repeat(5, 1fr);
		gap: 0.4rem;
		min-height: 140px;
		padding: 0.25rem;
	}

	.danmaku-item {
		padding: 0.3rem;
	}

	.danmaku-header {
		font-size: 0.7rem;
	}

	.danmaku-title {
		font-size: 0.75rem;
	}

	.danmaku-date {
		font-size: 0.65rem;
	}

	.danmaku-text {
		font-size: 0.75rem;
	}

	.danmaku-avatar {
		width: 32px;
		height: 32px;
	}

	.danmaku-avatar-section {
		min-width: 36px;
		padding: 0.1rem;
	}
}

@media (max-width: 480px) {
	.danmaku-container {
		min-height: 140px;
		padding: 0.5rem;
	}

	.danmaku-area {
		grid-template-columns: 1fr;
		grid-template-rows: repeat(9, 1fr);
		gap: 0.3rem;
		padding: 0.2rem;
	}

	.danmaku-item {
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.25rem;
	}

	.danmaku-content-section {
		width: 100%;
	}

	.danmaku-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		font-size: 0.65rem;
	}

	.danmaku-title {
		font-size: 0.7rem;
	}

	.danmaku-date {
		font-size: 0.6rem;
	}

	.danmaku-text {
		padding: 0.2rem 0;
		font-size: 0.7rem;
	}

	.danmaku-avatar {
		width: 28px;
		height: 28px;
	}

	.danmaku-avatar-section {
		align-self: flex-start;
		min-width: auto;
		padding: 0.08rem;
	}
}

@media (prefers-contrast: high) {
	.danmaku-item {
		border: 2px solid var(--font-color);
	}

	.danmaku-avatar-section {
		border: 2px solid var(--main-color);
	}

	.danmaku-divider {
		height: 2px;
		background: var(--font-color);
	}
}
</style>
