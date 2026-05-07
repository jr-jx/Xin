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
	total,
	hasMore,
	load,
	loadMore,
	submit,
	toggleLike,
	hide,
	restore,
	togglePin,
	remove,
	setIncludeHidden,
} = useComments(slug)

const { isAdmin, check: checkAdmin, login: loginAdmin, logout: logoutAdmin } = useCommentAdmin()

const editorRef = ref<any>(null)
const replyTo = ref<Comment | null>(null)

const showAdminPanel = ref(false)
const adminPassword = ref('')
const adminErr = ref<string | null>(null)
const adminLoggingIn = ref(false)
const currentMail = ref('')
const notice = ref<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
const pendingDeleteId = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let deleteTimer: ReturnType<typeof setTimeout> | undefined

const adminKeyword = (blogConfig.profile.email || '').trim().toLowerCase()
const isAdminKeywordMatched = computed(() => {
	const value = currentMail.value.trim().toLowerCase()
	return !!adminKeyword && value === adminKeyword
})

function setNotice(type: 'success' | 'error' | 'info', text: string) {
	notice.value = { type, text }
	if (noticeTimer)
		clearTimeout(noticeTimer)
	noticeTimer = setTimeout(() => {
		notice.value = null
	}, 2600)
}

function onMailChange(value: string) {
	currentMail.value = value
}

function closeAdminPanel() {
	showAdminPanel.value = false
	adminErr.value = null
}

function onModalKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape')
		closeAdminPanel()
}

watch(showAdminPanel, (open) => {
	if (typeof document === 'undefined')
		return
	document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(async () => {
	await Promise.all([load(true), checkAdmin()])
	if (isAdmin.value)
		await setIncludeHidden(true)
})

onBeforeUnmount(() => {
	if (typeof document !== 'undefined')
		document.body.style.overflow = ''
	if (noticeTimer)
		clearTimeout(noticeTimer)
	if (deleteTimer)
		clearTimeout(deleteTimer)
})

function onReply(comment: Comment) {
	replyTo.value = comment
	nextTick(() => {
		document.querySelector('.comment-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	})
}

async function onSubmit(payload: { mode: 'manual' | 'anonymous', nick: string, mail: string, link: string, content: string }) {
	try {
		const published = await submit({
			slug: slug.value,
			url: url.value,
			mode: payload.mode,
			nick: payload.nick,
			mail: payload.mail || undefined,
			link: payload.link || undefined,
			content: payload.content,
			pid: replyTo.value?.id || null,
			rid: replyTo.value ? (replyTo.value.rid || replyTo.value.id) : null,
		})
		editorRef.value?.clearAfterSubmit?.()
		replyTo.value = null
		setNotice('success', '评论已发布')
		await nextTick()
		document.getElementById(published.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || err?.statusMessage || '发表失败')
	}
}

async function onLogin() {
	if (adminLoggingIn.value)
		return
	adminErr.value = null
	adminLoggingIn.value = true
	try {
		await loginAdmin(adminPassword.value)
		await setIncludeHidden(true)
		adminPassword.value = ''
		showAdminPanel.value = false
		setNotice('success', '已进入管理模式')
	}
	catch (err: any) {
		adminErr.value = err?.data?.statusMessage || '登录失败'
	}
	finally {
		adminLoggingIn.value = false
	}
}

async function onLogout() {
	await logoutAdmin()
	await setIncludeHidden(false)
	setNotice('info', '已退出管理模式')
}

async function copyLink(comment: Comment) {
	if (typeof window === 'undefined' || !navigator?.clipboard) {
		setNotice('error', '当前浏览器不支持复制')
		return
	}
	const target = new URL(comment.url || slug.value, window.location.origin)
	target.hash = comment.id
	await navigator.clipboard.writeText(target.toString())
	setNotice('success', '评论链接已复制')
}

async function onTogglePin(comment: Comment) {
	try {
		await togglePin(comment)
		setNotice('success', comment.pinned ? '已取消置顶' : '已置顶评论')
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || '操作失败')
	}
}

async function onHide(comment: Comment) {
	try {
		await hide(comment)
		setNotice('success', '评论已隐藏')
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || '隐藏失败')
	}
}

async function onRestore(comment: Comment) {
	try {
		await restore(comment)
		setNotice('success', '评论已恢复')
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || '恢复失败')
	}
}

async function onHardDelete(comment: Comment) {
	if (pendingDeleteId.value !== comment.id) {
		pendingDeleteId.value = comment.id
		setNotice('info', '再次点击删除将永久删除')
		if (deleteTimer)
			clearTimeout(deleteTimer)
		deleteTimer = setTimeout(() => {
			pendingDeleteId.value = ''
		}, 4200)
		return
	}
	try {
		pendingDeleteId.value = ''
		if (deleteTimer)
			clearTimeout(deleteTimer)
		await remove(comment, true)
		setNotice('success', '评论已删除')
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || '删除失败')
	}
}
</script>

<template>
<section id="comment" class="comment">
	<div class="comment-head">
		<div class="comment-title">
			<span class="title-icon">
				<Icon name="ph:chat-circle-bold" />
			</span>
			<h3>评论</h3>
			<span class="count-pill">{{ total }}</span>
		</div>

		<div class="comment-tools">
			<Transition name="admin-btn-fade">
				<button
					v-if="!isAdmin && isAdminKeywordMatched"
					type="button"
					class="icon-btn"
					title="管理员登录"
					@click="showAdminPanel = true"
				>
					<Icon name="ph:lock-key-bold" />
				</button>
				<button v-else-if="isAdmin" type="button" class="icon-btn active" title="退出管理" @click="onLogout">
					<Icon name="ph:shield-check-bold" />
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

	<Transition name="comment-notice">
		<div v-if="notice" class="notice" :class="notice.type">
			<Icon :name="notice.type === 'error' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" />
			<span>{{ notice.text }}</span>
		</div>
	</Transition>

	<div class="comment-list">
		<div v-if="loading && items.length === 0" class="state">
			<Icon name="ph:circle-notch-bold" class="spin" />
			<span>评论加载中…</span>
		</div>
		<div v-else-if="error" class="state err">
			<Icon name="ph:warning-circle-bold" />
			<span>{{ error }}</span>
			<button type="button" class="retry" @click="load(true)">
				重试
			</button>
		</div>
		<template v-else-if="items.length">
			<PostCommentItem
				v-for="comment in items"
				:key="comment.id"
				:comment="comment"
				:is-admin="isAdmin"
				@reply="onReply"
				@like="toggleLike"
				@copy="copyLink"
				@pin="onTogglePin"
				@hide="onHide"
				@restore="onRestore"
				@remove="onHardDelete"
			/>
			<div v-if="hasMore" class="load-more">
				<button type="button" :disabled="loading" @click="loadMore">
					<Icon v-if="loading" name="ph:circle-notch-bold" class="spin" />
					<span>{{ loading ? '加载中…' : '加载更多讨论' }}</span>
				</button>
			</div>
		</template>
		<div v-else class="state empty">
			<Icon name="ph:chat-circle-dots-bold" />
			<span>暂无评论，来抢沙发吧</span>
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
						<Icon name="ph:lock-key-bold" />
						<span>管理员登录</span>
						<button type="button" class="admin-modal-close" title="关闭" @click="closeAdminPanel">
							<Icon name="ph:x-bold" />
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
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 3rem;
	scroll-margin: var(--space-12);
}

.comment-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.comment-title {
	display: flex;
	align-items: center;
	gap: 0.55rem;
	min-width: 0;

	h3 {
		margin: 0;
		font-size: 1.35rem;
		font-weight: 800;
		line-height: 1.2;
		color: var(--font-color);
	}
}

.title-icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.55rem;
	height: 1.55rem;
	font-size: 1.35rem;
	color: var(--font-color);
}

.count-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 1.4rem;
	min-width: 1.7rem;
	padding: 0 0.48rem;
	border-radius: var(--radius-pill);
	background: var(--font-color);
	font-size: 0.86rem;
	font-weight: 800;
	line-height: 1;
	color: var(--card-bg);
}

.comment-tools {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
}

.icon-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	padding: 0;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	color: var(--font-color-2);
	cursor: pointer;

	&:hover:not(:disabled),
	&.active {
		border-color: var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
}

.notice {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	gap: 0.35rem;
	padding: 0.45rem 0.7rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	font-size: 0.8rem;
	color: var(--font-color-2);

	&.success { color: var(--success, #10B981); }
	&.error { color: var(--error, #EF4444); }
	&.info { color: var(--main-color); }
}

.comment-list {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	position: relative;
}

.state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	min-height: 8rem;
	padding: 2rem;
	border: 1px dashed var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	font-size: 0.86rem;
	text-align: center;
	color: var(--font-color-3);

	&.err {
		color: var(--error, #EF4444);
	}

	.retry {
		padding: 0.22rem 0.65rem;
		border: 1px solid currentcolor;
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
	}
}

.load-more {
	display: flex;
	justify-content: center;
	padding: 1rem 0 0.25rem;

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.5rem 1.1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--card-bg);
		font-size: 0.82rem;
		color: var(--font-color-2);

		&:hover:not(:disabled) {
			border-color: var(--main-color);
			color: var(--main-color);
		}

		&:disabled {
			opacity: 0.55;
			cursor: not-allowed;
		}
	}
}

.spin {
	animation: comment-spin 1s linear infinite;
}

@keyframes comment-spin {
	to { transform: rotate(360deg); }
}

.admin-btn-fade-enter-active,
.admin-btn-fade-leave-active,
.comment-notice-enter-active,
.comment-notice-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}

.admin-btn-fade-enter-from,
.admin-btn-fade-leave-to,
.comment-notice-enter-from,
.comment-notice-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

.admin-modal {
	display: flex;
	align-items: center;
	justify-content: center;
	position: fixed;
	inset: 0;
	padding: 1rem;
	z-index: var(--z-modal);
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
	border-radius: var(--radius);
	box-shadow: var(--shadow-md);
	background: var(--card-bg);
}

.admin-modal-head {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.95rem;
	font-weight: 600;
	color: var(--font-color);

	> span {
		flex: 1;
	}
}

.admin-modal-close {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1.75rem;
	height: 1.75rem;
	padding: 0;
	border-radius: var(--radius-sm);
	color: var(--font-color-3);

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
	background: var(--c-bg-1);
	font-size: 0.9rem;
	color: var(--font-color);

	&:focus {
		border-color: var(--main-color);
	}
}

.admin-modal-err {
	font-size: 0.8rem;
	color: var(--error, #EF4444);
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

	&.ghost {
		border-color: var(--border-color);
		color: var(--font-color-2);

		&:hover {
			border-color: var(--main-color);
			color: var(--main-color);
		}
	}

	&.primary {
		background: var(--main-color);
		color: #FFF;

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
}

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
