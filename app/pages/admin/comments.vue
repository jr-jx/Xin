<script setup lang="ts">
import type { Article } from '~/types/article'
import type {
	Comment,
	CommentAdminKind,
	CommentAdminListResponse,
	CommentAdminSettings,
	CommentAdminStats,
	CommentAdminStatus,
} from '~/types/comment'
import { useCommentAdmin } from '~/composables/useComments'
import { formatDate } from '~/utils/date'

interface AdminPost {
	path: string
	title: string
}

const statusOptions: Array<{ value: CommentAdminStatus, label: string }> = [
	{ value: 'all', label: '全部' },
	{ value: 'visible', label: '可见' },
	{ value: 'hidden', label: '已隐藏' },
	{ value: 'pinned', label: '已置顶' },
]

const kindOptions: Array<{ value: CommentAdminKind, label: string }> = [
	{ value: 'all', label: '全部' },
	{ value: 'root', label: '主评论' },
	{ value: 'reply', label: '回复' },
]

function emptyStats(): CommentAdminStats {
	return {
		total: 0,
		visible: 0,
		hidden: 0,
		pinned: 0,
		roots: 0,
		replies: 0,
	}
}

useSeoMeta({
	title: '评论管理',
	robots: 'noindex,nofollow',
})

const { isAdmin, check, login, logout, getSettings, updateSettings } = useCommentAdmin()

const { data: posts } = useAsyncData(
	'comment-admin-posts',
	async () => {
		const rawPosts = await queryCollection('post').all()
		return (rawPosts as Article[])
			.filter(post => !post.draft)
			.map(post => ({
				path: post.path,
				title: post.title || post.path,
			}))
			.filter((post): post is AdminPost => !!post.path)
			.sort((left, right) => left.path.localeCompare(right.path))
	},
	{
		default: () => [],
	},
)

const postSlugs = computed(() => posts.value.map(post => post.path))
const postTitleMap = computed(() => new Map(posts.value.map(post => [post.path, post.title])))

const items = ref<Comment[]>([])
const loading = ref(false)
const error = ref('')
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(false)
const stats = ref<CommentAdminStats>(emptyStats())
const status = ref<CommentAdminStatus>('all')
const kind = ref<CommentAdminKind>('all')
const keyword = ref('')
const appliedKeyword = ref('')
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const settingsError = ref('')
const settings = ref<CommentAdminSettings>({ avatarProxy: 'https://weavatar.com/avatar' })
const avatarProxyDraft = ref('')

const adminPassword = ref('')
const adminErr = ref('')
const adminLoggingIn = ref(false)
const actionId = ref('')
const pendingDeleteId = ref('')
const notice = ref<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
let noticeTimer: ReturnType<typeof setTimeout> | undefined
let deleteTimer: ReturnType<typeof setTimeout> | undefined

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const canPrev = computed(() => page.value > 1 && !loading.value)
const canNext = computed(() => hasMore.value && !loading.value)
const hasArticles = computed(() => postSlugs.value.length > 0)
const settingsDirty = computed(() => avatarProxyDraft.value.trim() !== settings.value.avatarProxy)

const statCards = computed(() => [
	{ label: '全部评论', value: stats.value.total, icon: 'ph:chats-circle-bold' },
	{ label: '可见', value: stats.value.visible, icon: 'ph:eye-bold' },
	{ label: '已隐藏', value: stats.value.hidden, icon: 'ph:eye-slash-bold' },
	{ label: '已置顶', value: stats.value.pinned, icon: 'ph:push-pin-bold' },
	{ label: '主评论', value: stats.value.roots, icon: 'ph:chat-centered-text-bold' },
	{ label: '回复', value: stats.value.replies, icon: 'ph:arrow-bend-up-left-bold' },
])

function setNotice(type: 'success' | 'error' | 'info', text: string) {
	notice.value = { type, text }
	if (noticeTimer)
		clearTimeout(noticeTimer)
	noticeTimer = setTimeout(() => {
		notice.value = null
	}, 2600)
}

function postTitle(slug?: string) {
	if (!slug)
		return '未知文章'
	return postTitleMap.value.get(slug) || slug
}

function commentTime(comment: Comment) {
	return formatDate(new Date(comment.created || Date.now()))
}

function commentLink(comment: Comment) {
	return `${comment.url || comment.slug || ''}#${comment.id}`
}

async function loadSettings() {
	if (!isAdmin.value)
		return
	settingsLoading.value = true
	settingsError.value = ''
	try {
		const res = await getSettings()
		settings.value = res
		avatarProxyDraft.value = res.avatarProxy
	}
	catch (err: any) {
		settingsError.value = err?.data?.statusMessage || err?.statusMessage || '设置加载失败'
	}
	finally {
		settingsLoading.value = false
	}
}

async function saveSettings() {
	if (settingsSaving.value || !settingsDirty.value)
		return
	settingsSaving.value = true
	settingsError.value = ''
	try {
		const res = await updateSettings({ avatarProxy: avatarProxyDraft.value.trim() })
		settings.value = res
		avatarProxyDraft.value = res.avatarProxy
		setNotice('success', '头像代理已保存')
		await loadComments()
	}
	catch (err: any) {
		settingsError.value = err?.data?.statusMessage || err?.statusMessage || '设置保存失败'
	}
	finally {
		settingsSaving.value = false
	}
}

function resetSettings() {
	avatarProxyDraft.value = settings.value.avatarProxy
	settingsError.value = ''
}

async function loadComments(reset = false) {
	if (!isAdmin.value || !hasArticles.value)
		return
	if (reset)
		page.value = 1
	loading.value = true
	error.value = ''
	try {
		const res = await $fetch<CommentAdminListResponse>('/api/comments/admin/list', {
			method: 'POST',
			body: {
				slugs: postSlugs.value,
				page: page.value,
				pageSize: pageSize.value,
				status: status.value,
				kind: kind.value,
				keyword: appliedKeyword.value,
			},
		})
		items.value = res.items
		total.value = res.total
		page.value = res.page
		pageSize.value = res.pageSize
		hasMore.value = res.hasMore
		stats.value = res.stats
		if (page.value > totalPages.value) {
			page.value = totalPages.value
			await loadComments()
		}
	}
	catch (err: any) {
		error.value = err?.data?.statusMessage || err?.statusMessage || '加载失败'
	}
	finally {
		loading.value = false
	}
}

async function onLogin() {
	if (adminLoggingIn.value)
		return
	adminErr.value = ''
	adminLoggingIn.value = true
	try {
		await login(adminPassword.value)
		adminPassword.value = ''
		setNotice('success', '已进入评论管理')
		await Promise.all([loadSettings(), loadComments(true)])
	}
	catch (err: any) {
		adminErr.value = err?.data?.statusMessage || err?.statusMessage || '登录失败'
	}
	finally {
		adminLoggingIn.value = false
	}
}

async function onLogout() {
	await logout()
	items.value = []
	total.value = 0
	stats.value = emptyStats()
	settings.value = { avatarProxy: 'https://weavatar.com/avatar' }
	avatarProxyDraft.value = ''
	settingsError.value = ''
	setNotice('info', '已退出管理')
}

function applySearch() {
	appliedKeyword.value = keyword.value.trim()
	loadComments(true)
}

function clearSearch() {
	keyword.value = ''
	appliedKeyword.value = ''
	loadComments(true)
}

async function goPage(nextPage: number) {
	page.value = Math.max(1, Math.min(totalPages.value, nextPage))
	await loadComments()
}

async function patchComment(comment: Comment, patch: { pinned?: boolean, hidden?: boolean }, success: string) {
	if (actionId.value)
		return
	actionId.value = comment.id
	try {
		await $fetch<{ comment: Comment }>(`/api/comments/${comment.id}`, {
			method: 'PATCH',
			body: {
				slug: comment.slug,
				...patch,
			},
		})
		setNotice('success', success)
		await loadComments()
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || err?.statusMessage || '操作失败')
	}
	finally {
		actionId.value = ''
	}
}

async function togglePin(comment: Comment) {
	await patchComment(comment, { pinned: !comment.pinned }, comment.pinned ? '已取消置顶' : '已置顶评论')
}

async function hideComment(comment: Comment) {
	await patchComment(comment, { hidden: true }, '评论已隐藏')
}

async function restoreComment(comment: Comment) {
	await patchComment(comment, { hidden: false }, '评论已恢复')
}

async function deleteComment(comment: Comment) {
	if (pendingDeleteId.value !== comment.id) {
		pendingDeleteId.value = comment.id
		setNotice('info', '再次点击将永久删除')
		if (deleteTimer)
			clearTimeout(deleteTimer)
		deleteTimer = setTimeout(() => {
			pendingDeleteId.value = ''
		}, 4200)
		return
	}
	if (actionId.value)
		return
	actionId.value = comment.id
	try {
		pendingDeleteId.value = ''
		await $fetch(`/api/comments/${comment.id}`, {
			method: 'DELETE',
			params: {
				slug: comment.slug,
				hard: 1,
			},
		})
		setNotice('success', '评论已删除')
		await loadComments()
	}
	catch (err: any) {
		setNotice('error', err?.data?.statusMessage || err?.statusMessage || '删除失败')
	}
	finally {
		actionId.value = ''
	}
}

async function copyLink(comment: Comment) {
	if (typeof window === 'undefined' || !navigator?.clipboard) {
		setNotice('error', '当前浏览器不支持复制')
		return
	}
	const target = new URL(comment.url || comment.slug || '/', window.location.origin)
	target.hash = comment.id
	await navigator.clipboard.writeText(target.toString())
	setNotice('success', '评论链接已复制')
}

watch([status, kind], () => {
	if (isAdmin.value)
		loadComments(true)
})

watch(postSlugs, () => {
	if (isAdmin.value)
		loadComments(true)
})

onMounted(async () => {
	await check()
	if (isAdmin.value)
		await Promise.all([loadSettings(), loadComments(true)])
})

onBeforeUnmount(() => {
	if (noticeTimer)
		clearTimeout(noticeTimer)
	if (deleteTimer)
		clearTimeout(deleteTimer)
})
</script>

<template>
<main v-fade-up class="comment-admin">
	<div class="admin-head">
		<div>
			<p class="eyebrow">
				<Icon name="ph:shield-check-bold" />
				评论管理
			</p>
			<h1>评论审核工作台</h1>
			<p>{{ isAdmin ? `${stats.total} 条文章评论` : '使用评论管理员密码登录' }}</p>
		</div>
		<div class="head-actions">
			<NuxtLink class="icon-button" to="/recentcomments" title="最近评论">
				<Icon name="ph:clock-counter-clockwise-bold" />
			</NuxtLink>
			<button v-if="isAdmin" type="button" class="text-button" @click="onLogout">
				<Icon name="ph:sign-out-bold" />
				退出
			</button>
		</div>
	</div>

	<Transition name="notice-fade">
		<div v-if="notice" class="notice" :class="notice.type">
			<Icon :name="notice.type === 'error' ? 'ph:warning-circle-bold' : 'ph:check-circle-bold'" />
			<span>{{ notice.text }}</span>
		</div>
	</Transition>

	<section v-if="!isAdmin" class="login-panel">
		<div class="login-box">
			<div class="login-title">
				<Icon name="ph:lock-key-bold" />
				<span>管理员登录</span>
			</div>
			<input
				v-model="adminPassword"
				type="password"
				placeholder="请输入管理员密码"
				autocomplete="current-password"
				@keydown.enter="onLogin"
			>
			<p v-if="adminErr" class="login-error">
				{{ adminErr }}
			</p>
			<button type="button" class="primary-button" :disabled="adminLoggingIn" @click="onLogin">
				<Icon v-if="adminLoggingIn" name="ph:circle-notch-bold" class="spin" />
				{{ adminLoggingIn ? '登录中…' : '登录' }}
			</button>
		</div>
	</section>

	<template v-else>
		<section class="stats-grid" aria-label="评论统计">
			<div v-for="card in statCards" :key="card.label" class="stat-card">
				<Icon :name="card.icon" />
				<div>
					<strong>{{ card.value }}</strong>
					<span>{{ card.label }}</span>
				</div>
			</div>
		</section>

		<section class="settings-panel" aria-label="评论设置">
			<div class="settings-title">
				<Icon name="ph:user-circle-gear-bold" />
				<strong>头像代理</strong>
			</div>
			<form class="settings-form" @submit.prevent="saveSettings">
				<label class="settings-field">
					<span>代理地址</span>
					<div class="proxy-input">
						<Icon name="ph:link-simple-bold" />
						<input
							v-model="avatarProxyDraft"
							type="url"
							placeholder="https://weavatar.com/avatar"
							autocomplete="off"
							:disabled="settingsLoading || settingsSaving"
						>
					</div>
				</label>
				<div class="settings-actions">
					<button type="button" class="icon-button" title="还原" :disabled="settingsSaving || !settingsDirty" @click="resetSettings">
						<Icon name="ph:arrow-counter-clockwise-bold" />
					</button>
					<button type="submit" class="text-button primary" :disabled="settingsSaving || !settingsDirty">
						<Icon v-if="settingsSaving" name="ph:circle-notch-bold" class="spin" />
						<Icon v-else name="ph:floppy-disk-bold" />
						保存
					</button>
				</div>
			</form>
			<p v-if="settingsError" class="settings-error">
				{{ settingsError }}
			</p>
		</section>

		<section class="toolbar" aria-label="评论筛选">
			<div class="filter-group">
				<button
					v-for="option in statusOptions"
					:key="option.value"
					type="button"
					class="seg-button"
					:class="{ active: status === option.value }"
					@click="status = option.value"
				>
					{{ option.label }}
				</button>
			</div>
			<div class="filter-group">
				<button
					v-for="option in kindOptions"
					:key="option.value"
					type="button"
					class="seg-button"
					:class="{ active: kind === option.value }"
					@click="kind = option.value"
				>
					{{ option.label }}
				</button>
			</div>
			<div class="search-box">
				<Icon name="ph:magnifying-glass-bold" />
				<input
					v-model="keyword"
					type="search"
					placeholder="搜索昵称、内容、文章路径"
					@keydown.enter="applySearch"
				>
				<button v-if="keyword || appliedKeyword" type="button" title="清空搜索" @click="clearSearch">
					<Icon name="ph:x-bold" />
				</button>
				<button type="button" class="search-submit" @click="applySearch">
					搜索
				</button>
			</div>
		</section>

		<section class="list-panel">
			<div class="list-head">
				<div>
					<strong>{{ total }} 条结果</strong>
					<span>第 {{ page }} / {{ totalPages }} 页</span>
				</div>
				<button type="button" class="icon-button" :disabled="loading" title="重新加载" @click="loadComments()">
					<Icon name="ph:arrows-clockwise-bold" :class="{ spin: loading }" />
				</button>
			</div>

			<div v-if="loading && !items.length" class="state">
				<Icon name="ph:circle-notch-bold" class="spin" />
				<span>正在加载评论…</span>
			</div>
			<div v-else-if="error" class="state error">
				<Icon name="ph:warning-circle-bold" />
				<span>{{ error }}</span>
				<button type="button" @click="loadComments()">
					重试
				</button>
			</div>
			<div v-else-if="!hasArticles" class="state">
				<Icon name="ph:article-bold" />
				<span>没有可管理的文章</span>
			</div>
			<div v-else-if="items.length" class="comment-table-wrap">
				<table class="comment-table">
					<thead>
						<tr>
							<th>评论</th>
							<th>文章</th>
							<th>状态</th>
							<th>时间</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="comment in items" :key="comment.id" :class="{ muted: comment.hidden }">
							<td>
								<div class="comment-cell">
									<img :src="comment.avatar" :alt="comment.nick" loading="lazy">
									<div>
										<div class="comment-meta">
											<strong>{{ comment.nick }}</strong>
											<span v-if="comment.isAdmin" class="badge admin">博主</span>
											<span v-if="comment.pid" class="badge reply">回复</span>
										</div>
										<p>{{ comment.commentText }}</p>
									</div>
								</div>
							</td>
							<td>
								<NuxtLink class="post-link" :to="comment.url || comment.slug || '/'">
									{{ postTitle(comment.slug) }}
								</NuxtLink>
								<span class="slug">{{ comment.slug }}</span>
							</td>
							<td>
								<div class="status-list">
									<span class="badge" :class="comment.hidden ? 'hidden' : 'visible'">
										{{ comment.hidden ? '已隐藏' : '可见' }}
									</span>
									<span v-if="comment.pinned" class="badge pinned">置顶</span>
								</div>
							</td>
							<td>
								<time :title="new Date(comment.created || Date.now()).toLocaleString()">
									{{ commentTime(comment) }}
								</time>
							</td>
							<td>
								<div class="row-actions">
									<button type="button" title="复制链接" @click="copyLink(comment)">
										<Icon name="ph:link-bold" />
									</button>
									<NuxtLink :to="commentLink(comment)" title="跳转原文">
										<Icon name="ph:arrow-square-out-bold" />
									</NuxtLink>
									<button v-if="!comment.pid" type="button" :disabled="actionId === comment.id" :title="comment.pinned ? '取消置顶' : '置顶'" @click="togglePin(comment)">
										<Icon :name="comment.pinned ? 'ph:push-pin-slash-bold' : 'ph:push-pin-bold'" />
									</button>
									<button v-if="comment.hidden" type="button" :disabled="actionId === comment.id" title="恢复" @click="restoreComment(comment)">
										<Icon name="ph:eye-bold" />
									</button>
									<button v-else type="button" :disabled="actionId === comment.id" title="隐藏" @click="hideComment(comment)">
										<Icon name="ph:eye-slash-bold" />
									</button>
									<button type="button" class="danger" :disabled="actionId === comment.id" title="永久删除" @click="deleteComment(comment)">
										<Icon name="ph:trash-bold" />
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>

				<div class="comment-cards">
					<article v-for="comment in items" :key="`card-${comment.id}`" class="comment-card" :class="{ muted: comment.hidden }">
						<div class="card-head">
							<img :src="comment.avatar" :alt="comment.nick" loading="lazy">
							<div>
								<strong>{{ comment.nick }}</strong>
								<time>{{ commentTime(comment) }}</time>
							</div>
							<span class="badge" :class="comment.hidden ? 'hidden' : 'visible'">
								{{ comment.hidden ? '已隐藏' : '可见' }}
							</span>
						</div>
						<p>{{ comment.commentText }}</p>
						<NuxtLink class="post-link" :to="comment.url || comment.slug || '/'">
							{{ postTitle(comment.slug) }}
						</NuxtLink>
						<div class="row-actions">
							<button type="button" title="复制链接" @click="copyLink(comment)">
								<Icon name="ph:link-bold" />
							</button>
							<NuxtLink :to="commentLink(comment)" title="跳转原文">
								<Icon name="ph:arrow-square-out-bold" />
							</NuxtLink>
							<button v-if="!comment.pid" type="button" :disabled="actionId === comment.id" :title="comment.pinned ? '取消置顶' : '置顶'" @click="togglePin(comment)">
								<Icon :name="comment.pinned ? 'ph:push-pin-slash-bold' : 'ph:push-pin-bold'" />
							</button>
							<button v-if="comment.hidden" type="button" :disabled="actionId === comment.id" title="恢复" @click="restoreComment(comment)">
								<Icon name="ph:eye-bold" />
							</button>
							<button v-else type="button" :disabled="actionId === comment.id" title="隐藏" @click="hideComment(comment)">
								<Icon name="ph:eye-slash-bold" />
							</button>
							<button type="button" class="danger" :disabled="actionId === comment.id" title="永久删除" @click="deleteComment(comment)">
								<Icon name="ph:trash-bold" />
							</button>
						</div>
					</article>
				</div>
			</div>
			<div v-else class="state">
				<Icon name="ph:chat-circle-dots-bold" />
				<span>没有匹配的评论</span>
			</div>

			<div class="pager">
				<button type="button" :disabled="!canPrev" @click="goPage(page - 1)">
					<Icon name="ph:caret-left-bold" />
					上一页
				</button>
				<span>{{ page }} / {{ totalPages }}</span>
				<button type="button" :disabled="!canNext" @click="goPage(page + 1)">
					下一页
					<Icon name="ph:caret-right-bold" />
				</button>
			</div>
		</section>
	</template>
</main>
</template>

<style lang="scss" scoped>
.comment-admin {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	width: min(1180px, 100%);
	margin: 0 auto;
	padding: 2rem 0.5rem 3rem;
}

.admin-head {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 1rem;

	h1 {
		margin: 0.25rem 0 0;
		font-size: 1.6rem;
		line-height: 1.2;
		color: var(--font-color);
	}

	p:not(.eyebrow) {
		margin-top: 0.35rem;
		font-size: 0.86rem;
		color: var(--font-color-3);
	}

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.eyebrow,
.head-actions,
.login-title,
.notice,
.settings-title,
.settings-form,
.proxy-input,
.settings-actions,
.filter-group,
.search-box,
.list-head,
.pager,
.row-actions,
.comment-meta,
.status-list,
.card-head {
	display: flex;
	align-items: center;
}

.eyebrow {
	gap: 0.35rem;
	margin: 0;
	font-size: 0.78rem;
	font-weight: 700;
	color: var(--main-color);
}

.head-actions {
	justify-content: flex-end;
	gap: 0.5rem;
}

.icon-button,
.text-button,
.primary-button,
.seg-button,
.search-box button,
.row-actions button,
.row-actions a,
.pager button,
.state button {
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	color: var(--font-color-2);
	transition: border-color 0.2s, background-color 0.2s, color 0.2s, opacity 0.2s;
	cursor: pointer;

	&:hover:not(:disabled) {
		border-color: var(--main-color);
		color: var(--main-color);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
}

.icon-button,
.row-actions button,
.row-actions a {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	padding: 0;
}

.text-button,
.primary-button,
.pager button,
.state button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	min-height: 2rem;
	padding: 0.4rem 0.85rem;
	font-size: 0.82rem;
}

.primary-button {
	border-color: var(--main-color);
	background: var(--main-color);
	color: #FFF;

	&:hover:not(:disabled) {
		color: #FFF;
	}
}

.text-button.primary {
	border-color: var(--main-color);
	background: var(--main-color);
	color: #FFF;

	&:hover:not(:disabled) {
		color: #FFF;
	}
}

.notice {
	align-self: flex-start;
	gap: 0.35rem;
	padding: 0.45rem 0.7rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
	font-size: 0.82rem;

	&.success { color: var(--success, #10B981); }
	&.error { color: var(--error, #EF4444); }
	&.info { color: var(--main-color); }
}

.login-panel {
	display: grid;
	place-items: center;
	min-height: 42vh;
}

.login-box {
	display: flex;
	flex-direction: column;
	gap: 0.75rem;
	width: min(380px, 100%);
	padding: 1.25rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	box-shadow: var(--shadow-md);
	background: var(--card-bg);

	input {
		width: 100%;
		padding: 0.58rem 0.8rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--c-bg-1);
		font-size: 0.9rem;
		color: var(--font-color);

		&:focus {
			border-color: var(--main-color);
		}
	}
}

.login-title {
	gap: 0.45rem;
	font-weight: 700;
	color: var(--font-color);
}

.login-error {
	margin: 0;
	font-size: 0.8rem;
	color: var(--error, #EF4444);
}

.stats-grid {
	display: grid;
	grid-template-columns: repeat(6, minmax(0, 1fr));
	gap: 0.6rem;

	@media (max-width: 920px) {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 560px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

.stat-card {
	display: flex;
	align-items: center;
	gap: 0.65rem;
	min-width: 0;
	padding: 0.8rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);

	> svg {
		flex: 0 0 auto;
		font-size: 1.15rem;
		color: var(--main-color);
	}

	strong,
	span {
		display: block;
	}

	strong {
		font-size: 1.2rem;
		line-height: 1;
		color: var(--font-color);
	}

	span {
		margin-top: 0.25rem;
		font-size: 0.74rem;
		color: var(--font-color-3);
	}
}

.settings-panel {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: center;
	gap: 0.75rem;
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
}

.settings-title {
	gap: 0.45rem;
	font-size: 0.9rem;
	color: var(--font-color);

	svg {
		color: var(--main-color);
	}
}

.settings-form {
	justify-content: flex-end;
	gap: 0.6rem;
	min-width: 0;

	@media (max-width: 760px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.settings-field {
	display: flex;
	flex: 1;
	align-items: center;
	gap: 0.5rem;
	min-width: 0;

	> span {
		flex: 0 0 auto;
		font-size: 0.78rem;
		font-weight: 700;
		color: var(--font-color-3);
	}

	@media (max-width: 560px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.proxy-input {
	flex: 1;
	gap: 0.45rem;
	min-width: 0;
	padding: 0.35rem 0.55rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-1);

	svg {
		flex: 0 0 auto;
		color: var(--font-color-3);
	}

	input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		font-size: 0.84rem;
		color: var(--font-color);
	}
}

.settings-actions {
	justify-content: flex-end;
	gap: 0.45rem;
}

.settings-error {
	grid-column: 1 / -1;
	margin: -0.25rem 0 0;
	font-size: 0.78rem;
	color: var(--error, #EF4444);
}

.toolbar {
	display: grid;
	grid-template-columns: auto auto minmax(280px, 1fr);
	gap: 0.65rem;
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);

	@media (max-width: 960px) {
		grid-template-columns: 1fr;
	}
}

.filter-group {
	overflow: hidden;
	width: fit-content;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-1);

	@media (max-width: 560px) {
		width: 100%;
	}
}

.seg-button {
	min-height: 2rem;
	padding: 0.35rem 0.7rem;
	border: 0;
	border-radius: 0;
	background: transparent;
	font-size: 0.8rem;

	&.active {
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	@media (max-width: 560px) {
		flex: 1;
	}
}

.search-box {
	gap: 0.45rem;
	min-width: 0;
	padding: 0.25rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-1);

	input {
		flex: 1;
		min-width: 0;
		border: 0;
		background: transparent;
		font-size: 0.84rem;
		color: var(--font-color);
	}

	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1.65rem;
		min-width: 1.65rem;
		padding: 0 0.5rem;
		border: 0;
		background: transparent;
	}

	.search-submit {
		border-radius: var(--radius-sm);
		background: var(--main-color);
		font-size: 0.78rem;
		color: #FFF;
	}
}

.list-panel {
	overflow: hidden;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--card-bg);
}

.list-head {
	justify-content: space-between;
	gap: 1rem;
	padding: 0.75rem 0.85rem;
	border-bottom: 1px solid var(--border-color);

	strong,
	span {
		display: block;
	}

	strong {
		font-size: 0.92rem;
		color: var(--font-color);
	}

	span {
		margin-top: 0.2rem;
		font-size: 0.76rem;
		color: var(--font-color-3);
	}
}

.state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.45rem;
	min-height: 12rem;
	padding: 2rem;
	font-size: 0.86rem;
	text-align: center;
	color: var(--font-color-3);

	&.error {
		color: var(--error, #EF4444);
	}
}

.comment-table-wrap {
	overflow-x: auto;
}

.comment-table {
	width: 100%;
	min-width: 920px;
	border-collapse: collapse;

	th,
	td {
		padding: 0.75rem 0.85rem;
		border-bottom: 1px solid var(--border-color);
		vertical-align: top;
		text-align: left;
	}

	th {
		background: var(--c-bg-1);
		font-size: 0.74rem;
		font-weight: 700;
		color: var(--font-color-3);
	}

	td {
		font-size: 0.82rem;
		color: var(--font-color-2);
	}

	tr.muted {
		opacity: 0.68;
	}

	@media (max-width: 760px) {
		display: none;
	}
}

.comment-cell {
	display: grid;
	grid-template-columns: 2.25rem minmax(0, 1fr);
	gap: 0.65rem;
	min-width: 18rem;

	img {
		width: 2.25rem;
		height: 2.25rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		object-fit: cover;
	}

	p {
		display: -webkit-box;
		overflow: hidden;
		margin: 0.25rem 0 0;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		line-height: 1.5;
		-webkit-box-orient: vertical;
	}
}

.comment-meta {
	flex-wrap: wrap;
	gap: 0.3rem;

	strong {
		overflow: hidden;
		max-width: 12rem;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--font-color);
	}
}

.post-link {
	display: block;
	overflow: hidden;
	max-width: 14rem;
	font-weight: 700;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);

	&:hover {
		color: var(--main-color);
	}
}

.slug {
	display: block;
	overflow: hidden;
	max-width: 14rem;
	margin-top: 0.25rem;
	font-size: 0.72rem;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color-3);
}

.status-list {
	flex-wrap: wrap;
	gap: 0.3rem;
}

.badge {
	display: inline-flex;
	align-items: center;
	min-height: 1.15rem;
	padding: 0.12rem 0.38rem;
	border-radius: var(--radius-sm);
	font-size: 0.66rem;
	line-height: 1;

	&.admin,
	&.visible {
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	&.reply,
	&.pinned {
		background: var(--c-bg-2);
		color: var(--font-color-2);
	}

	&.hidden {
		background: rgb(239 68 68 / 10%);
		color: var(--error, #EF4444);
	}
}

.row-actions {
	flex-wrap: wrap;
	gap: 0.3rem;

	.danger {
		color: var(--error, #EF4444);

		&:hover:not(:disabled) {
			border-color: var(--error, #EF4444);
			color: var(--error, #EF4444);
		}
	}
}

.comment-cards {
	display: none;
	flex-direction: column;
	gap: 0.5rem;
	padding: 0.65rem;

	@media (max-width: 760px) {
		display: flex;
	}
}

.comment-card {
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-1);

	&.muted {
		opacity: 0.68;
	}

	p {
		margin: 0.65rem 0;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--font-color-2);
	}
}

.card-head {
	gap: 0.55rem;

	img {
		width: 2.35rem;
		height: 2.35rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		object-fit: cover;
	}

	div {
		flex: 1;
		min-width: 0;
	}

	strong,
	time {
		display: block;
	}

	strong {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: var(--font-color);
	}

	time {
		margin-top: 0.18rem;
		font-size: 0.74rem;
		color: var(--font-color-3);
	}
}

.pager {
	justify-content: center;
	gap: 0.65rem;
	padding: 0.85rem;
	border-top: 1px solid var(--border-color);

	span {
		font-size: 0.8rem;
		color: var(--font-color-3);
	}
}

.spin {
	animation: admin-spin 1s linear infinite;
}

.notice-fade-enter-active,
.notice-fade-leave-active {
	transition: opacity 0.2s, transform 0.2s;
}

.notice-fade-enter-from,
.notice-fade-leave-to {
	opacity: 0;
	transform: translateY(-4px);
}

@keyframes admin-spin {
	to { transform: rotate(360deg); }
}
</style>
