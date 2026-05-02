<script setup lang="ts">
import type { Comment } from '~/types/comment'
import blogConfig from '~~/blog.config'
import { useCommentAdmin, useComments } from '~/composables/useComments'

interface Props {
	/** 文章 slug（一般是路由 path，如 /posts/xxx） */
	slug?: string
	/** 文章 URL，用于邮件通知展示；不传时使用 slug */
	url?: string
}

const props = defineProps<Props>()
const route = useRoute()

const slug = computed(() => props.slug || route.path)
const url = computed(() => props.url || slug.value)

const {
	items,
	loading,
	submitting,
	error,
	parentTotal,
	hasMore,
	load,
	loadMore,
	submit,
	toggleLike,
	remove,
} = useComments(slug)

const { isAdmin, check, login, logout } = useCommentAdmin()

const editorRef = ref<any>(null)
const replyTo = ref<Comment | null>(null)

const showAdminPanel = ref(false)
const adminPassword = ref('')
const adminErr = ref<string | null>(null)
const adminLoggingIn = ref(false)
const currentMail = ref('')

const adminKeyword = (blogConfig.profile.email || '').trim().toLowerCase()
const isAdminKeywordMatched = computed(() => {
	const v = currentMail.value.trim().toLowerCase()
	return !!adminKeyword && v === adminKeyword
})

function onMailChange(v: string) {
	currentMail.value = v
}

function closeAdminPanel() {
	showAdminPanel.value = false
	adminErr.value = null
}

function onModalKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape')
		closeAdminPanel()
}

watch(showAdminPanel, (open) => {
	if (typeof document === 'undefined')
		return
	document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
	load(true)
	check()
})

function onReply(c: Comment) {
	replyTo.value = c
	nextTick(() => {
		document.querySelector('.comment-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	})
}

async function onSubmit(payload: { nick: string, mail: string, link: string, content: string }) {
	try {
		await submit({
			slug: slug.value,
			url: url.value,
			nick: payload.nick,
			mail: payload.mail || undefined,
			link: payload.link || undefined,
			content: payload.content,
			pid: replyTo.value?.id || null,
			rid: replyTo.value ? (replyTo.value.rid || replyTo.value.id) : null,
		})
		editorRef.value?.clearAfterSubmit?.()
		replyTo.value = null
	}
	catch (err: any) {
		const msg = err?.data?.statusMessage || err?.statusMessage || '发表失败'
		// eslint-disable-next-line no-alert
		alert(msg)
	}
}

async function onLogin() {
	if (adminLoggingIn.value)
		return
	adminErr.value = null
	adminLoggingIn.value = true
	try {
		await login(adminPassword.value)
		adminPassword.value = ''
		showAdminPanel.value = false
	}
	catch (err: any) {
		adminErr.value = err?.data?.statusMessage || '登录失败'
	}
	finally {
		adminLoggingIn.value = false
	}
}

async function onRemove(c: Comment) {
	// eslint-disable-next-line no-alert
	if (!confirm('确定删除这条评论？（隐藏，保留数据）'))
		return
	try {
		await remove(c, false)
	}
	catch (err: any) {
		// eslint-disable-next-line no-alert
		alert(err?.data?.statusMessage || '删除失败')
	}
}
</script>

<template>
<section id="comment" class="comment">
	<div class="comment-head">
		<h3 class="text-creative">
			<Icon name="icon-park-solid:comment" />
			评论区
			<span v-if="parentTotal > 0" class="count">（{{ parentTotal }}）</span>
		</h3>
		<div class="admin-ctrl">
			<Transition name="admin-btn-fade">
				<button
					v-if="!isAdmin && isAdminKeywordMatched"
					type="button"
					class="icon-btn"
					title="管理员登录"
					@click="showAdminPanel = true"
				>
					<Icon name="ph:lock-key" />
				</button>
				<button v-else-if="isAdmin" type="button" class="icon-btn active" title="退出管理" @click="logout">
					<Icon name="ph:lock-open" />
				</button>
			</Transition>
		</div>
	</div>

	<PostCommentEditor
		ref="editorRef"
		:submitting="submitting"
		:reply-to="replyTo ? { id: replyTo.id, nick: replyTo.nick } : null"
		@submit="onSubmit"
		@cancel="replyTo = null"
		@mail-change="onMailChange"
	/>

	<div class="comment-list">
		<div v-if="loading && items.length === 0" class="state">
			评论加载中…
		</div>
		<div v-else-if="error" class="state err">
			{{ error }}
			<button type="button" class="retry" @click="load(true)">
				重试
			</button>
		</div>
		<template v-else-if="items.length">
			<PostCommentItem
				v-for="c in items"
				:key="c.id"
				:comment="c"
				:is-admin="isAdmin"
				@reply="onReply"
				@like="toggleLike"
				@remove="onRemove"
			/>
			<div v-if="hasMore" class="load-more">
				<button type="button" :disabled="loading" @click="loadMore">
					{{ loading ? '加载中…' : '加载更多' }}
				</button>
			</div>
		</template>
		<div v-else class="state empty">
			暂无评论，来抢沙发吧～
		</div>
	</div>

	<Teleport to="body">
		<Transition name="admin-modal">
			<div
				v-if="showAdminPanel && !isAdmin"
				class="admin-modal"
				role="dialog"
				aria-modal="true"
				@keydown="onModalKeydown"
			>
				<div class="admin-modal-mask" @click="closeAdminPanel" />
				<div class="admin-modal-dialog">
					<div class="admin-modal-head">
						<Icon name="ph:lock-key" />
						<span>管理员登录</span>
						<button type="button" class="admin-modal-close" title="关闭" @click="closeAdminPanel">
							<Icon name="ph:x" />
						</button>
					</div>
					<input
						v-model="adminPassword"
						type="password"
						placeholder="请输入管理员密码"
						class="admin-modal-input"
						autofocus
						@keydown.enter="onLogin"
					>
					<div v-if="adminErr" class="admin-modal-err">
						{{ adminErr }}
					</div>
					<div class="admin-modal-actions">
						<button type="button" class="admin-modal-btn ghost" @click="closeAdminPanel">
							取消
						</button>
						<button type="button" class="admin-modal-btn primary" :disabled="adminLoggingIn" @click="onLogin">
							<Icon v-if="adminLoggingIn" name="ph:circle-notch-bold" class="spin" />
							{{ adminLoggingIn ? '登录中…' : '登录' }}
						</button>
					</div>
				</div>
			</div>
		</Transition>
	</Teleport>
</section>
</template>

<style lang="scss" scoped>
.comment {
	margin-top: 3rem;
	scroll-margin: var(--space-12);

	> .comment-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;

		> h3 {
			margin: 0;
			font-size: 1.25rem;

			.count {
				margin-left: 0.25rem;
				font-size: 0.85rem;
				font-weight: normal;
				color: var(--font-color-3);
			}
		}

		.admin-ctrl {
			margin-left: auto;
		}
	}
}

.icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	padding: 0;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--font-color-2);
	transition: all 0.15s;
	cursor: pointer;

	&:hover,
	&.active {
		background: var(--c-bg-2);
		color: var(--main-color);
	}
}

.admin-btn-fade-enter-active,
.admin-btn-fade-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}

.admin-btn-fade-enter-from,
.admin-btn-fade-leave-to {
	opacity: 0;
	transform: scale(0.85);
}

.comment-list {
	margin-top: 1rem;
}

.state {
	padding: 2rem;
	font-size: 0.85rem;
	text-align: center;
	color: var(--font-color-3);

	&.err {
		color: var(--error-color, #EF4444);
	}

	.retry {
		margin-left: 0.5rem;
		padding: 0.2rem 0.6rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--font-color-2);
		cursor: pointer;

		&:hover { color: var(--main-color); }
	}
}

.load-more {
	display: flex;
	justify-content: center;
	padding: 1rem 0;

	button {
		padding: 0.5rem 1.25rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--c-bg);
		font-size: 0.85rem;
		color: var(--font-color-2);
		transition: all 0.15s;
		cursor: pointer;

		&:hover:not(:disabled) {
			border-color: var(--main-color);
			color: var(--main-color);
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
}

/* ========= 管理员登录弹窗 ========= */
.admin-modal {
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	inset: 0;
	padding: 1rem;
	z-index: 9999;
}

.admin-modal-mask {
	position: absolute;
	inset: 0;
	background: rgb(0 0 0 / 45%);
	backdrop-filter: blur(2px);
}

.admin-modal-dialog {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	position: relative;
	width: 100%;
	max-width: 360px;
	padding: 1.25rem;
	border: var(--border);
	border-radius: var(--radius-md);
	box-shadow: 0 20px 50px -20px rgb(0 0 0 / 35%);
	background: var(--card-bg);
}

.admin-modal-head {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--font-color);

	> span { flex: 1; }
}

.admin-modal-close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	padding: 0;
	border: none;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--font-color-3);
	transition: background 0.15s, color 0.15s;
	cursor: pointer;

	&:hover {
		background: var(--c-bg-2);
		color: var(--main-color);
	}
}

.admin-modal-input {
	width: 100%;
	padding: 0.55rem 0.85rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	outline: none;
	background: var(--c-bg);
	font-size: 0.9rem;
	color: var(--font-color);
	transition: border-color 0.15s;

	&:focus { border-color: var(--main-color); }
}

.admin-modal-err {
	font-size: 0.8rem;
	color: var(--error-color, #EF4444);
}

.admin-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5rem;
}

.admin-modal-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.35rem;
	padding: 0.45rem 1rem;
	border: 1px solid transparent;
	border-radius: var(--radius);
	font-size: 0.85rem;
	transition: background 0.15s, border-color 0.15s, color 0.15s, transform 0.15s;
	cursor: pointer;

	&.ghost {
		border-color: var(--border-color);
		background: transparent;
		color: var(--font-color-2);

		&:hover {
			border-color: var(--main-color);
			color: var(--main-color);
		}
	}

	&.primary {
		background: var(--main-color);
		color: #FFF;

		&:hover:not(:disabled) { transform: translateY(-1px); }

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}

	.spin { animation: admin-modal-spin 1s linear infinite; }
}

@keyframes admin-modal-spin {
	to { transform: rotate(360deg); }
}

/* modal transition */
.admin-modal-enter-active,
.admin-modal-leave-active {
	transition: opacity 0.2s;

	.admin-modal-dialog {
		transition: transform 0.22s ease, opacity 0.22s ease;
	}
}

.admin-modal-enter-from,
.admin-modal-leave-to {
	opacity: 0;

	.admin-modal-dialog {
		opacity: 0;
		transform: translateY(8px) scale(0.96);
	}
}
</style>
