<script setup lang="ts">
const commentsStore = useCommentsStore()

useSeoMeta({
	title: '最近评论',
	description: '伍拾柒博客最近评论',
})

const { comments, loading, error, hasComments } = storeToRefs(commentsStore)

onMounted(async () => {
	if (hasComments.value && commentsStore.lastUpdated) {
		const timeDiff = Date.now() - commentsStore.lastUpdated.getTime()
		if (timeDiff < 5 * 60 * 1000)
			return
	}
	await commentsStore.fetchRecentComments(50, true)
})
</script>

<template>
<div v-fade-up class="recentcomments-page">
	<PageBanner
		title="最近评论"
		desc="博客里的新讨论"
		footer="Comments"
		image="https://cdn.lightxi.com/cloudreve/uploads/2025/08/03/S9ethiQA_9298cf4b972a1ea927236a66a18e4e27.jpg"
	/>
	<div class="container">
		<div v-if="loading && !hasComments" class="state">
			<Icon name="ph:circle-notch-bold" class="spin" />
			<span>正在加载评论…</span>
		</div>

		<div v-else-if="error" class="state error-state">
			<Icon name="ph:warning-circle-bold" />
			<span>{{ error }}</span>
		</div>

		<div v-else-if="hasComments" class="comment-feed">
			<NuxtLink
				v-for="(comment, index) in comments"
				:key="comment.id"
				v-fade-up="36 * index"
				:to="`${comment.url}#${comment.id}`"
				class="feed-item"
			>
				<img class="avatar" :src="comment.avatar" :alt="comment.nick" loading="lazy">
				<div class="feed-body">
					<div class="feed-meta">
						<strong>{{ comment.nick }}</strong>
						<span v-if="comment.isAdmin" class="badge">博主</span>
						<span v-if="comment.replyToNick" class="reply-mark">回复 @{{ comment.replyToNick }}</span>
						<time>{{ formatDate(new Date(comment.created || Date.now())) }}</time>
					</div>
					<p>{{ comment.commentText }}</p>
					<div class="feed-foot">
						<span>
							<Icon name="ph:article-bold" />
							{{ comment.url }}
						</span>
						<span>
							<Icon name="ph:heart-bold" />
							{{ comment.likes || 0 }}
						</span>
					</div>
				</div>
			</NuxtLink>
		</div>

		<div v-else class="state empty-state">
			<Icon name="ph:chat-circle-dots-bold" />
			<span>暂无评论</span>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.container {
	margin: 0 auto;
	padding: 1rem 0.5rem 0;
}

.comment-feed {
	display: flex;
	flex-direction: column;
	gap: 0.45rem;
}

.feed-item {
	display: grid;
	grid-template-columns: 2.75rem minmax(0, 1fr);
	gap: 0.75rem;
	padding: 0.85rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	text-decoration: none;
	color: inherit;

	&:hover {
		border-color: var(--main-color);
		background: var(--c-bg-1);

		strong {
			color: var(--main-color);
		}
	}

	@media (max-width: 520px) {
		grid-template-columns: 2.35rem minmax(0, 1fr);
		padding: 0.7rem;
	}
}

.avatar {
	width: 2.75rem;
	height: 2.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	object-fit: cover;

	@media (max-width: 520px) {
		width: 2.35rem;
		height: 2.35rem;
	}
}

.feed-body {
	min-width: 0;

	p {
		display: -webkit-box;
		overflow: hidden;
		margin: 0.35rem 0 0.55rem;
		font-size: 0.9rem;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		line-height: 1.55;
		text-overflow: ellipsis;
		color: var(--font-color-2);
		-webkit-box-orient: vertical;
	}
}

.feed-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35rem 0.5rem;
	min-width: 0;

	strong {
		overflow: hidden;
		max-width: 12rem;
		font-size: 0.9rem;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--font-color);
		transition: color 0.2s;
	}

	time {
		margin-left: auto;
		font-size: 0.74rem;
		white-space: nowrap;
		color: var(--font-color-3);
	}
}

.badge,
.reply-mark {
	display: inline-flex;
	align-items: center;
	min-height: 1.1rem;
	padding: 0.08rem 0.36rem;
	border-radius: var(--radius-sm);
	font-size: 0.66rem;
	line-height: 1;
}

.badge {
	border: 1px solid var(--main-color);
	background: var(--main-color-bg);
	color: var(--main-color);
}

.reply-mark {
	background: var(--main-color-bg);
	color: var(--main-color);
}

.feed-foot {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem 0.8rem;
	font-size: 0.74rem;
	color: var(--font-color-3);

	span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		min-width: 0;

		&:first-child {
			overflow: hidden;
			max-width: 100%;
			white-space: nowrap;
			text-overflow: ellipsis;
		}
	}
}

.state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	min-height: 10rem;
	padding: 2rem;
	border: 1px dashed var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	font-size: 0.9rem;
	color: var(--font-color-3);

	button {
		padding: 0.25rem 0.65rem;
		border: 1px solid currentcolor;
		border-radius: var(--radius-sm);
	}
}

.error-state {
	color: var(--error, #EF4444);
}

.empty-state {
	background: color-mix(in srgb, var(--card-bg) 42%, transparent);
}

.spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
