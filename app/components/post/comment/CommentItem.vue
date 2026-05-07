<script setup lang="ts">
import type { Comment } from '~/types/comment'
import { formatDate } from '~/utils/date'

interface Props {
	comment: Comment & { children?: Comment[] }
	isAdmin?: boolean
	depth?: number
}

const props = withDefaults(defineProps<Props>(), {
	isAdmin: false,
	depth: 0,
})

const emit = defineEmits<{
	(e: 'reply', comment: Comment): void
	(e: 'like', comment: Comment): void
	(e: 'copy', comment: Comment): void
	(e: 'pin', comment: Comment): void
	(e: 'hide', comment: Comment): void
	(e: 'restore', comment: Comment): void
	(e: 'remove', comment: Comment): void
}>()

const timeText = computed(() => formatDate(new Date(props.comment.created || Date.now())))
const isChild = computed(() => props.depth > 0)
</script>

<template>
<article :id="comment.id" class="comment-item" :class="{ child: isChild, hidden: comment.hidden, pinned: comment.pinned }">
	<a class="avatar-wrap" :href="comment.link || undefined" target="_blank" rel="noopener nofollow">
		<img class="avatar" :src="comment.avatar" :alt="comment.nick" loading="lazy">
	</a>

	<div class="body">
		<div class="meta">
			<div class="name-line">
				<a v-if="comment.link" class="nick" :href="comment.link" target="_blank" rel="noopener nofollow">
					{{ comment.nick }}
				</a>
				<span v-else class="nick">{{ comment.nick }}</span>
				<span v-if="comment.isAdmin" class="badge admin">博主</span>
				<span v-if="comment.pinned && !isChild" class="badge pinned">
					<Icon name="ph:push-pin-fill" />
					置顶
				</span>
				<span v-if="comment.hidden" class="badge hidden-badge">
					<Icon name="ph:eye-slash-bold" />
					已隐藏
				</span>
			</div>
			<time class="time">{{ timeText }}</time>
		</div>

		<div v-if="comment.replyToNick" class="reply-target">
			<Icon name="ph:arrow-bend-up-left-bold" />
			回复 @{{ comment.replyToNick }}
		</div>

		<div class="content prose" v-html="comment.comment" />

		<div class="actions">
			<button type="button" class="act" :class="{ liked: comment.liked }" :disabled="comment.liked" @click="emit('like', comment)">
				<Icon :name="comment.liked ? 'ph:heart-fill' : 'ph:heart-bold'" />
				<span>{{ comment.likes || 0 }}</span>
			</button>
			<button type="button" class="act" @click="emit('reply', comment)">
				<Icon name="ph:arrow-bend-up-left-bold" />
				<span>回复</span>
			</button>
			<button type="button" class="act" @click="emit('copy', comment)">
				<Icon name="ph:link-bold" />
				<span>分享</span>
			</button>
			<template v-if="isAdmin">
				<button v-if="!isChild" type="button" class="act admin-act" @click="emit('pin', comment)">
					<Icon :name="comment.pinned ? 'ph:push-pin-slash-bold' : 'ph:push-pin-bold'" />
					<span>{{ comment.pinned ? '取消置顶' : '置顶' }}</span>
				</button>
				<button v-if="comment.hidden" type="button" class="act admin-act" @click="emit('restore', comment)">
					<Icon name="ph:eye-bold" />
					<span>恢复</span>
				</button>
				<button v-else type="button" class="act admin-act" @click="emit('hide', comment)">
					<Icon name="ph:eye-slash-bold" />
					<span>隐藏</span>
				</button>
				<button type="button" class="act danger" @click="emit('remove', comment)">
					<Icon name="ph:trash-bold" />
					<span>删除</span>
				</button>
			</template>
		</div>

		<div v-if="comment.children?.length" class="children">
			<PostCommentItem
				v-for="child in comment.children"
				:key="child.id"
				:comment="child"
				:is-admin="isAdmin"
				:depth="depth + 1"
				@reply="emit('reply', $event)"
				@like="emit('like', $event)"
				@copy="emit('copy', $event)"
				@pin="emit('pin', $event)"
				@hide="emit('hide', $event)"
				@restore="emit('restore', $event)"
				@remove="emit('remove', $event)"
			/>
		</div>
	</div>
</article>
</template>

<style lang="scss" scoped>
.comment-item {
	display: grid;
	grid-template-columns: 2.75rem minmax(0, 1fr);
	gap: 0.75rem;
	position: relative;
	padding: 0.85rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	transition: background-color 0.2s, border-color 0.2s, opacity 0.2s;
	scroll-margin: var(--space-12);

	&::before {
		content: none;
	}

	&:hover {
		border-color: var(--main-color);
		background-color: var(--c-bg-1);
	}

	&.child {
		grid-template-columns: 2.25rem minmax(0, 1fr);
		padding: 0.75rem 0 0.75rem 0.75rem;
		border: none;
		border-radius: 0;
		background: transparent;
	}

	&.hidden {
		opacity: 0.68;
	}

	&.pinned:not(.child) {
		border-color: var(--main-color);
	}

	@media (max-width: 560px) {
		grid-template-columns: 2.35rem minmax(0, 1fr);
		padding-inline: 0.4rem;
	}
}

.avatar-wrap {
	display: block;
	position: relative;
	width: fit-content;
	height: fit-content;
	z-index: 1;
}

.avatar {
	width: 2.75rem;
	height: 2.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-full);
	background: var(--c-bg-2);
	object-fit: cover;

	.child & {
		width: 2.25rem;
		height: 2.25rem;
	}

	@media (max-width: 560px) {
		width: 2.35rem;
		height: 2.35rem;
	}
}

.body {
	min-width: 0;
}

.meta {
	display: flex;
	align-items: flex-start;
	gap: 0.75rem;
	min-width: 0;
}

.name-line {
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.35rem;
	min-width: 0;
}

.nick {
	overflow: hidden;
	max-width: 12rem;
	font-size: 0.9rem;
	font-weight: 700;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);

	&:hover {
		color: var(--main-color);
	}
}

.time {
	flex-shrink: 0;
	padding-top: 0.1rem;
	font-size: 0.74rem;
	white-space: nowrap;
	color: var(--font-color-3);
}

.badge {
	display: inline-flex;
	align-items: center;
	gap: 0.2rem;
	min-height: 1.1rem;
	padding: 0.08rem 0.36rem;
	border-radius: var(--radius-sm);
	font-size: 0.65rem;
	line-height: 1;

	&.admin {
		border: 1px solid var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	&.pinned {
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}

.hidden-badge {
	background: var(--c-bg-2);
	color: var(--error, #EF4444);
}

.reply-target {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	margin-top: 0.35rem;
	font-size: 0.76rem;
	color: var(--font-color-3);
}

.content {
	overflow-wrap: anywhere;
	margin: 0.42rem 0 0.5rem;
	font-size: 0.9rem;
	line-height: 1.65;
	color: var(--font-color);

	:deep(p) {
		margin: 0.2em 0;
	}

	:deep(img) {
		max-width: 100%;
		border-radius: var(--radius-sm);
	}

	:deep(code) {
		padding: 0.1em 0.3em;
		border-radius: var(--radius-sm);
		background: var(--c-bg-2);
		font-size: 0.85em;
	}

	:deep(pre) {
		overflow: auto;
		padding: 0.65rem;
		border-radius: var(--radius);
		background: var(--c-bg-2);
	}

	:deep(blockquote) {
		margin: 0.4em 0;
		padding: 0.2em 0.6em;
		border-left: 3px solid var(--main-color);
		color: var(--font-color-2);
	}

	:deep(a) {
		text-decoration: underline;
		color: var(--main-color);
	}
}

.actions {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.75rem;
}

.act {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	min-height: 1.75rem;
	padding: 0.25rem 0.5rem;
	border-radius: var(--radius-sm);
	font-size: 0.74rem;
	color: var(--font-color-3);

	&:hover:not(:disabled) {
		background: var(--c-bg-2);
		color: var(--main-color);
	}

	&:active:not(:disabled) {
		opacity: 0.75;
	}

	&:disabled {
		cursor: default;
	}

	&.liked {
		color: var(--main-color);

		:deep(svg) {
			animation: heart-pop 0.3s ease-out;
		}
	}

	&.admin-act {
		color: var(--font-color-2);
	}

	&.danger:hover {
		color: var(--error, #EF4444);
	}
}

.children {
	margin-top: 0.5rem;
	padding-left: 0.5rem;
	border-left: 1px solid var(--border-color);
}

@keyframes heart-pop {
	0% { transform: scale(1); }
	50% { transform: scale(1.3); }
	100% { transform: scale(1); }
}
</style>
