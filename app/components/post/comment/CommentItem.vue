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
	(e: 'reply', c: Comment): void
	(e: 'like', c: Comment): void
	(e: 'remove', c: Comment): void
}>()

const timeText = computed(() => formatDate(new Date(props.comment.created || Date.now())))
</script>

<template>
<div :id="comment.id" class="comment-item" :data-depth="depth">
	<a class="avatar-wrap" :href="comment.link || undefined" target="_blank" rel="noopener nofollow">
		<img class="avatar" :src="comment.avatar" :alt="comment.nick" loading="lazy">
	</a>

	<div class="body">
		<div class="meta">
			<a v-if="comment.link" class="nick" :href="comment.link" target="_blank" rel="noopener nofollow">
				{{ comment.nick }}
			</a>
			<span v-else class="nick">{{ comment.nick }}</span>
			<span v-if="comment.isAdmin" class="badge admin">博主</span>
			<span class="time">{{ timeText }}</span>
		</div>

		<div class="content prose" v-html="comment.comment" />

		<div class="actions">
			<button type="button" class="act" :class="{ liked: comment.liked }" @click="emit('like', comment)">
				<Icon :name="comment.liked ? 'ph:heart-fill' : 'ph:heart-bold'" />
				<span>{{ comment.likes || 0 }}</span>
			</button>
			<button type="button" class="act" @click="emit('reply', comment)">
				<Icon name="ph:arrow-bend-up-left-bold" />
				<span>回复</span>
			</button>
			<button v-if="isAdmin" type="button" class="act danger" @click="emit('remove', comment)">
				<Icon name="ph:trash" />
				<span>删除</span>
			</button>
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
				@remove="emit('remove', $event)"
			/>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.comment-item {
	display: flex;
	gap: 0.75rem;
	padding: 0.75rem;
	border-radius: var(--radius);
	transition: background 0.2s;
	animation: comment-fade-in 0.35s ease-out both;
	scroll-margin: var(--space-12);

	&:hover {
		background: color-mix(in srgb, var(--c-bg-2) 60%, transparent);
	}
}

@keyframes comment-fade-in {
	from {
		opacity: 0;
		transform: translateY(4px);
	}

	to {
		opacity: 1;
		transform: none;
	}
}

.avatar-wrap {
	flex-shrink: 0;
}

.avatar {
	width: 2.5rem;
	height: 2.5rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-full);
	box-shadow: 0 2px 6px -4px rgb(0 0 0 / 25%);
	background: var(--c-bg-2);
	transition: transform 0.2s, box-shadow 0.2s;
	object-fit: cover;

	&:hover {
		box-shadow: 0 4px 10px -4px rgb(0 0 0 / 30%);
		transform: scale(1.06);
	}
}

.body {
	flex: 1;
	min-width: 0;
}

.meta {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.8rem;

	.nick {
		font-weight: 600;
		text-decoration: none;
		color: var(--font-color);

		&:hover { color: var(--main-color); }
	}

	.badge {
		padding: 0.05rem 0.35rem;
		border-radius: var(--radius-sm);
		font-size: 0.65rem;
		line-height: 1.3;

		&.admin {
			box-shadow: 0 2px 6px -3px color-mix(in srgb, var(--main-color) 60%, transparent);
			background: linear-gradient(135deg, var(--main-color), color-mix(in srgb, var(--main-color) 70%, #FFF));
			color: #FFF;
		}
	}

	.time {
		margin-left: auto;
		font-size: 0.75rem;
		color: var(--font-color-3);
	}
}

.content {
	overflow-wrap: anywhere;
	margin: 0.3rem 0 0.4rem;
	font-size: 0.9rem;
	line-height: 1.65;
	color: var(--font-color);

	:deep(p) { margin: 0.2em 0; }

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
		padding: 0.5rem;
		border-radius: var(--radius);
		background: var(--c-bg-2);
	}

	:deep(blockquote) {
		margin: 0.4em 0;
		padding: 0.2em 0.6em;
		border-left: 3px solid var(--border-color);
		color: var(--font-color-2);
	}

	:deep(a) {
		text-decoration: underline;
		color: var(--main-color);
	}
}

.actions {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.75rem;
}

.act {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.25rem 0.5rem;
	border: none;
	border-radius: var(--radius-sm);
	background: transparent;
	font-size: 0.75rem;
	color: var(--font-color-3);
	transition: background 0.15s, color 0.15s, transform 0.15s;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
		color: var(--main-color);
	}

	&:active {
		transform: scale(0.94);
	}

	&.liked {
		color: var(--main-color);

		:deep(svg) {
			animation: heart-pop 0.3s ease-out;
		}
	}

	&.danger:hover {
		color: var(--error-color, #EF4444);
	}
}

.children {
	margin-top: 0.25rem;
	padding-left: 0.5rem;
	border-left: 2px solid color-mix(in srgb, var(--border-color) 70%, transparent);
}

@keyframes heart-pop {
	0% { transform: scale(1); }
	50% { transform: scale(1.3); }
	100% { transform: scale(1); }
}
</style>
