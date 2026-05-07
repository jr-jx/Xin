import { createHash, randomBytes } from 'node:crypto'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import blogConfig from '../../blog.config'
import { getEdgeKvStore } from './edgeKv'
import { encodeLink } from './requestIdentity'

/** 服务端评论记录（完整存储字段） */
export interface CommentRecord {
	id: string
	slug: string
	url: string
	nick: string
	mailMd5: string
	/** 原始邮箱，仅服务端使用，不返回给前端 */
	mail?: string
	/** 外部资料头像，优先于邮箱头像代理 */
	avatar?: string
	link: string
	content: string
	html: string
	ua: string
	pid: string | null
	rid: string | null
	ipHash: string
	createdAt: number
	updatedAt: number
	hidden: boolean
	pinned?: boolean
	likes: number
	isAdmin: boolean
	replyToNick?: string
}

export type CommentAdminStatus = 'all' | 'visible' | 'hidden' | 'pinned'
export type CommentAdminKind = 'all' | 'root' | 'reply'

export interface CommentAdminStats {
	total: number
	visible: number
	hidden: number
	pinned: number
	roots: number
	replies: number
}

export interface CommentAdminListOptions {
	slugs: string[]
	page: number
	pageSize: number
	status: CommentAdminStatus
	kind: CommentAdminKind
	keyword?: string
}

export interface CommentAdminSettings {
	avatarProxy: string
}

interface CommentViewIndex {
	roots: string[]
	pinnedRoots: string[]
	children: Record<string, string[]>
	total: number
	parentTotal: number
}

interface CommentSlugIndex extends CommentViewIndex {
	version: number
	updatedAt: number
	adminRoots: string[]
	adminPinnedRoots: string[]
	adminChildren: Record<string, string[]>
	adminTotal: number
	adminParentTotal: number
}

/** 规范化 slug：统一成 `/posts/xxx` 形式，并去掉尾斜杠 */
export function normalizeSlug(slug: string): string {
	if (!slug)
		return ''
	let s = slug.trim()
	if (!s.startsWith('/'))
		s = `/${s}`
	if (s.length > 1 && s.endsWith('/'))
		s = s.slice(0, -1)
	return s
}

/** slug → 安全的 key 片段（短、URL 安全、稳定） */
export function slugKey(slug: string): string {
	return createHash('sha1').update(normalizeSlug(slug)).digest('base64url').slice(0, 16)
}

export function md5(input: string): string {
	return createHash('md5').update(input).digest('hex')
}

const AVATAR_HASH_TOKEN = /\{hash\}|\{HASH\}|HASH/g
const HAS_AVATAR_HASH_TOKEN = /\{hash\}|\{HASH\}|HASH/

function configuredAvatarProxy(): string {
	try {
		const config = useRuntimeConfig()
		return String(config.commentAvatarProxy || blogConfig.comment.avatarProxy)
	}
	catch {
		return blogConfig.comment.avatarProxy
	}
}

export function normalizeAvatarProxy(value: unknown): string {
	const raw = String(value || '').trim()
	if (!raw)
		throw new Error('头像代理地址不能为空')

	const candidate = raw.replace(AVATAR_HASH_TOKEN, '00000000000000000000000000000000')
	let url: URL
	try {
		url = new URL(candidate)
	}
	catch {
		throw new Error('头像代理地址必须是有效 URL')
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:')
		throw new Error('头像代理地址必须使用 HTTP 或 HTTPS')

	return HAS_AVATAR_HASH_TOKEN.test(raw) ? raw : raw.replace(/\/$/, '')
}

function safeAvatarProxy(value: unknown, fallback = blogConfig.comment.avatarProxy): string {
	try {
		return normalizeAvatarProxy(value)
	}
	catch {
		return normalizeAvatarProxy(fallback)
	}
}

export function gravatarUrl(mailMd5: string, avatarProxy = configuredAvatarProxy()): string {
	const proxy = safeAvatarProxy(avatarProxy)
	if (HAS_AVATAR_HASH_TOKEN.test(proxy))
		return proxy.replace(AVATAR_HASH_TOKEN, mailMd5)
	return `${proxy}/${mailMd5}`
}

function safePublicAvatar(value?: string): string {
	const raw = String(value || '').trim()
	if (!raw)
		return ''
	try {
		const url = new URL(raw)
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : ''
	}
	catch {
		return ''
	}
}

export function newCommentId(): string {
	return `c_${Date.now().toString(36)}${randomBytes(4).toString('hex')}`
}

/** Markdown 渲染并消毒；禁用裸 HTML、远程加载脚本 */
export function renderMarkdown(md: string): { html: string, text: string } {
	const rawHtml = marked.parse(md, { async: false, breaks: true, gfm: true }) as string
	const safeHtml = DOMPurify.sanitize(rawHtml, {
		USE_PROFILES: { html: true },
		ALLOWED_TAGS: [
			'p',
			'br',
			'hr',
			'b',
			'i',
			'em',
			'strong',
			'del',
			'ins',
			'sub',
			'sup',
			'a',
			'img',
			'blockquote',
			'code',
			'pre',
			'kbd',
			'mark',
			'ul',
			'ol',
			'li',
			'dl',
			'dt',
			'dd',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'span',
			'div',
			'table',
			'thead',
			'tbody',
			'tr',
			'th',
			'td',
		],
		ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'loading', 'referrerpolicy', 'class'],
		FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'button', 'object', 'embed', 'video', 'audio'],
	})
	// 纯文本摘要
	const text = safeHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
	return { html: safeHtml, text }
}

// ==================== 存储 ====================

const STORE = 'comment:record'
const META = 'comment:meta'
const SLUG_INDEX_VERSION = 1
const SETTINGS_KEY = 'settings'

function recordKey(slug: string, id: string): string {
	return `posts:${slugKey(slug)}:${id}`
}

function indexKey(slug: string): string {
	return `index:${slugKey(slug)}`
}

function slugIndexKey(slug: string): string {
	return `slug-index:v${SLUG_INDEX_VERSION}:${slugKey(slug)}`
}

const RECENT_KEY = 'recent:index'
const RECENT_MAX = 200

function storage() {
	return getEdgeKvStore(STORE)
}
function metaStorage() {
	return getEdgeKvStore(META)
}

/** 读取文章下评论 id 列表（按创建时间倒序） */
async function readIndex(slug: string): Promise<string[]> {
	const list = await metaStorage().getItem<string[]>(indexKey(slug))
	return Array.isArray(list) ? list : []
}
async function writeIndex(slug: string, ids: string[]): Promise<void> {
	await metaStorage().setItem(indexKey(slug), ids)
}

async function readRecent(): Promise<Array<{ slug: string, id: string }>> {
	const list = await metaStorage().getItem<Array<{ slug: string, id: string }>>(RECENT_KEY)
	return Array.isArray(list) ? list : []
}
async function writeRecent(list: Array<{ slug: string, id: string }>): Promise<void> {
	await metaStorage().setItem(RECENT_KEY, list.slice(0, RECENT_MAX))
}

export async function readCommentSettings(): Promise<CommentAdminSettings> {
	const defaults = { avatarProxy: safeAvatarProxy(configuredAvatarProxy()) }
	const stored = await metaStorage().getItem<Partial<CommentAdminSettings>>(SETTINGS_KEY)
	return {
		avatarProxy: typeof stored?.avatarProxy === 'string'
			? safeAvatarProxy(stored.avatarProxy, defaults.avatarProxy)
			: defaults.avatarProxy,
	}
}

export async function updateCommentSettings(patch: Partial<CommentAdminSettings>): Promise<CommentAdminSettings> {
	const next = await readCommentSettings()
	if (Object.hasOwn(patch, 'avatarProxy'))
		next.avatarProxy = normalizeAvatarProxy(patch.avatarProxy)
	await metaStorage().setItem(SETTINGS_KEY, next)
	return next
}

export async function getCommentAvatarProxy(): Promise<string> {
	return (await readCommentSettings()).avatarProxy
}

function emptySlugIndex(): CommentSlugIndex {
	return {
		version: SLUG_INDEX_VERSION,
		updatedAt: Date.now(),
		roots: [],
		pinnedRoots: [],
		children: {},
		total: 0,
		parentTotal: 0,
		adminRoots: [],
		adminPinnedRoots: [],
		adminChildren: {},
		adminTotal: 0,
		adminParentTotal: 0,
	}
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isChildrenIndex(value: unknown): value is Record<string, string[]> {
	if (!value || typeof value !== 'object' || Array.isArray(value))
		return false
	return Object.values(value).every(isStringArray)
}

function isSlugIndex(value: unknown): value is CommentSlugIndex {
	const index = value as Partial<CommentSlugIndex>
	return !!index
		&& index.version === SLUG_INDEX_VERSION
		&& isStringArray(index.roots)
		&& isStringArray(index.pinnedRoots)
		&& isChildrenIndex(index.children)
		&& isStringArray(index.adminRoots)
		&& isStringArray(index.adminPinnedRoots)
		&& isChildrenIndex(index.adminChildren)
		&& typeof index.total === 'number'
		&& typeof index.parentTotal === 'number'
		&& typeof index.adminTotal === 'number'
		&& typeof index.adminParentTotal === 'number'
}

async function readSlugIndex(slug: string): Promise<CommentSlugIndex | null> {
	const index = await metaStorage().getItem<CommentSlugIndex>(slugIndexKey(slug))
	return isSlugIndex(index) ? index : null
}

async function writeSlugIndex(slug: string, index: CommentSlugIndex): Promise<void> {
	await metaStorage().setItem(slugIndexKey(slug), index)
}

function compareNewest(a: CommentRecord, b: CommentRecord): number {
	return b.createdAt - a.createdAt
}

function commentRootId(comment: CommentRecord): string {
	return comment.pid ? (comment.rid || comment.pid) : comment.id
}

function buildView(records: CommentRecord[], byId: Map<string, CommentRecord>): CommentViewIndex {
	const parents = records.filter(comment => !comment.pid)
	const pinnedRoots = parents.filter(comment => comment.pinned).sort(compareNewest).map(comment => comment.id)
	const roots = parents.filter(comment => !comment.pinned).sort(compareNewest).map(comment => comment.id)
	const parentIds = new Set([...pinnedRoots, ...roots])
	const children: Record<string, string[]> = {}

	for (const comment of records) {
		if (!comment.pid)
			continue
		const rootId = commentRootId(comment)
		if (!parentIds.has(rootId))
			continue
		children[rootId] ||= []
		children[rootId].push(comment.id)
	}

	for (const ids of Object.values(children)) {
		ids.sort((a, b) => {
			const left = byId.get(a)?.createdAt || 0
			const right = byId.get(b)?.createdAt || 0
			return left - right
		})
	}

	return {
		roots,
		pinnedRoots,
		children,
		total: records.length,
		parentTotal: parents.length,
	}
}

function buildSlugIndex(records: CommentRecord[]): CommentSlugIndex {
	if (!records.length)
		return emptySlugIndex()

	const byId = new Map(records.map(comment => [comment.id, comment]))
	const publicVisible = new Map<string, boolean>()
	const isPublicVisible = (comment: CommentRecord, visiting = new Set<string>()): boolean => {
		const cached = publicVisible.get(comment.id)
		if (cached !== undefined)
			return cached
		if (visiting.has(comment.id))
			return false
		if (comment.hidden) {
			publicVisible.set(comment.id, false)
			return false
		}
		if (!comment.pid) {
			publicVisible.set(comment.id, true)
			return true
		}
		visiting.add(comment.id)
		const parent = byId.get(comment.pid)
		const visible = !!parent && isPublicVisible(parent, visiting)
		visiting.delete(comment.id)
		publicVisible.set(comment.id, visible)
		return visible
	}

	const isAdminVisible = (comment: CommentRecord): boolean => {
		if (!comment.pid)
			return true
		const root = byId.get(commentRootId(comment))
		return !!root && !root.pid
	}

	const publicView = buildView(records.filter(comment => isPublicVisible(comment)), byId)
	const adminView = buildView(records.filter(comment => isAdminVisible(comment)), byId)

	return {
		version: SLUG_INDEX_VERSION,
		updatedAt: Date.now(),
		...publicView,
		adminRoots: adminView.roots,
		adminPinnedRoots: adminView.pinnedRoots,
		adminChildren: adminView.children,
		adminTotal: adminView.total,
		adminParentTotal: adminView.parentTotal,
	}
}

async function readAllBySlug(slug: string): Promise<CommentRecord[]> {
	const idx = await readIndex(slug)
	return (await Promise.all(idx.map(id => getComment(slug, id)))).filter((comment): comment is CommentRecord => !!comment)
}

async function rebuildSlugIndex(slug: string): Promise<CommentSlugIndex> {
	const index = buildSlugIndex(await readAllBySlug(slug))
	await writeSlugIndex(slug, index)
	return index
}

async function ensureSlugIndex(slug: string): Promise<CommentSlugIndex> {
	return (await readSlugIndex(slug)) || await rebuildSlugIndex(slug)
}

async function commentsByIds(slug: string, ids: string[]): Promise<CommentRecord[]> {
	if (!ids.length)
		return []
	return (await Promise.all(ids.map(id => getComment(slug, id)))).filter((comment): comment is CommentRecord => !!comment)
}

async function listByIndex(slug: string, page: number, pageSize: number, includeHidden: boolean, index: CommentSlugIndex) {
	const rootIds = includeHidden
		? [...index.adminPinnedRoots, ...index.adminRoots]
		: [...index.pinnedRoots, ...index.roots]
	const childrenIndex = includeHidden ? index.adminChildren : index.children
	const total = includeHidden ? index.adminTotal : index.total
	const parentTotal = includeHidden ? index.adminParentTotal : index.parentTotal
	const start = (page - 1) * pageSize
	const pagedRootIds = rootIds.slice(start, start + pageSize)
	const childIds = pagedRootIds.flatMap(id => childrenIndex[id] || [])
	const [parents, children] = await Promise.all([
		commentsByIds(slug, pagedRootIds),
		commentsByIds(slug, childIds),
	])

	return {
		parents,
		children,
		total,
		parentTotal,
		hasMore: start + pageSize < parentTotal,
		stale: parents.length !== pagedRootIds.length || children.length !== childIds.length,
	}
}

function shouldRebuildSlugIndex(patch: Partial<CommentRecord>): boolean {
	return 'hidden' in patch || 'pinned' in patch || 'pid' in patch || 'rid' in patch
}

/** 写入单条评论 */
export async function saveComment(rec: CommentRecord): Promise<void> {
	await storage().setItem(recordKey(rec.slug, rec.id), rec)
	const idx = await readIndex(rec.slug)
	if (!idx.includes(rec.id)) {
		idx.unshift(rec.id)
		await writeIndex(rec.slug, idx)
	}
	const recent = await readRecent()
	recent.unshift({ slug: rec.slug, id: rec.id })
	await writeRecent(recent)
	await rebuildSlugIndex(rec.slug)
}

export async function getComment(slug: string, id: string): Promise<CommentRecord | null> {
	return (await storage().getItem<CommentRecord>(recordKey(slug, id))) || null
}

export async function updateComment(slug: string, id: string, patch: Partial<CommentRecord>): Promise<CommentRecord | null> {
	const cur = await getComment(slug, id)
	if (!cur)
		return null
	const next = { ...cur, ...patch, updatedAt: Date.now() }
	await storage().setItem(recordKey(slug, id), next)
	if (shouldRebuildSlugIndex(patch))
		await rebuildSlugIndex(slug)
	return next
}

export async function deleteComment(slug: string, id: string): Promise<void> {
	await storage().removeItem(recordKey(slug, id))
	const idx = await readIndex(slug)
	const next = idx.filter(x => x !== id)
	if (next.length !== idx.length)
		await writeIndex(slug, next)
	const recent = (await readRecent()).filter(x => !(x.slug === slug && x.id === id))
	await writeRecent(recent)
	await rebuildSlugIndex(slug)
}

/** 分页读取某文章评论（含子评论） */
export async function listBySlug(slug: string, page: number, pageSize: number, includeHidden = false) {
	let index = await ensureSlugIndex(slug)
	let result = await listByIndex(slug, page, pageSize, includeHidden, index)
	if (result.stale) {
		index = await rebuildSlugIndex(slug)
		result = await listByIndex(slug, page, pageSize, includeHidden, index)
	}
	return {
		parents: result.parents,
		children: result.children,
		total: result.total,
		parentTotal: result.parentTotal,
		hasMore: result.hasMore,
	}
}

function emptyAdminStats(): CommentAdminStats {
	return {
		total: 0,
		visible: 0,
		hidden: 0,
		pinned: 0,
		roots: 0,
		replies: 0,
	}
}

function addAdminStats(stats: CommentAdminStats, comment: CommentRecord): void {
	stats.total += 1
	if (comment.hidden)
		stats.hidden += 1
	else
		stats.visible += 1
	if (comment.pinned)
		stats.pinned += 1
	if (comment.pid)
		stats.replies += 1
	else
		stats.roots += 1
}

function matchesAdminStatus(comment: CommentRecord, status: CommentAdminStatus): boolean {
	if (status === 'visible')
		return !comment.hidden
	if (status === 'hidden')
		return comment.hidden
	if (status === 'pinned')
		return !!comment.pinned
	return true
}

function matchesAdminKind(comment: CommentRecord, kind: CommentAdminKind): boolean {
	if (kind === 'root')
		return !comment.pid
	if (kind === 'reply')
		return !!comment.pid
	return true
}

function matchesAdminKeyword(comment: CommentRecord, keyword: string): boolean {
	if (!keyword)
		return true
	const haystack = [
		comment.id,
		comment.nick,
		comment.content,
		comment.replyToNick,
		comment.slug,
		comment.url,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase()
	return haystack.includes(keyword)
}

/** 管理员全站评论列表：基于文章 slug 批量读取，不受公开最近评论索引限制 */
export async function adminListComments(options: CommentAdminListOptions) {
	const slugs = [...new Set(options.slugs.map(slug => normalizeSlug(slug)).filter(Boolean))]
	const page = Math.max(1, Math.floor(options.page) || 1)
	const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize) || 20))
	const keyword = (options.keyword || '').trim().toLowerCase()
	const records = (await Promise.all(slugs.map(slug => readAllBySlug(slug)))).flat()
	const stats = emptyAdminStats()

	for (const comment of records)
		addAdminStats(stats, comment)

	const filtered = records
		.filter(comment => matchesAdminStatus(comment, options.status))
		.filter(comment => matchesAdminKind(comment, options.kind))
		.filter(comment => matchesAdminKeyword(comment, keyword))
		.sort(compareNewest)

	const start = (page - 1) * pageSize
	const items = filtered.slice(start, start + pageSize)

	return {
		items,
		total: filtered.length,
		page,
		pageSize,
		hasMore: start + pageSize < filtered.length,
		stats,
	}
}

/** 最近评论（全站） */
export async function recentComments(limit: number, includeReply: boolean): Promise<CommentRecord[]> {
	const list = await readRecent()
	const out: CommentRecord[] = []
	for (const ref of list) {
		if (out.length >= limit)
			break
		const c = await getComment(ref.slug, ref.id)
		if (!c || c.hidden)
			continue
		if (!includeReply && c.pid)
			continue
		if (c.pid) {
			const root = await getComment(c.slug, c.rid || c.pid)
			if (!root || root.hidden)
				continue
		}
		out.push(c)
	}
	return out
}

/** 转成给前端用的安全对象（去除 ipHash / mail 等敏感字段） */
export function toPublicComment(rec: CommentRecord, likedByMe = false, avatarProxy = configuredAvatarProxy()) {
	const {
		ipHash,
		mail,
		authProvider: _authProvider,
		authUserId: _authUserId,
		createdAt,
		updatedAt,
		content,
		html,
		avatar,
		...rest
	} = rec as CommentRecord & { authProvider?: string, authUserId?: string }
	return {
		...rest,
		comment: html,
		commentText: html.replace(/<[^>]+>/g, '').slice(0, 140),
		content,
		hidden: !!rec.hidden,
		pinned: !!rec.pinned,
		replyToNick: rec.replyToNick || '',
		avatar: safePublicAvatar(avatar) || gravatarUrl(rec.mailMd5, avatarProxy),
		relativeTime: '',
		created: createdAt,
		updated: updatedAt,
		liked: likedByMe,
	}
}

/** 点赞：同 IP 对同评论只能点一次 */
export async function tryLike(ipHash: string, slug: string, id: string): Promise<{ ok: boolean, likes: number }> {
	const rec = await getComment(slug, id)
	if (!rec)
		return { ok: false, likes: 0 }
	const key = `like:${ipHash}:${encodeLink(`${slug}#${id}`)}`
	const already = await metaStorage().getItem(key)
	if (already)
		return { ok: false, likes: rec.likes }
	const likes = (rec.likes || 0) + 1
	await updateComment(slug, id, { likes })
	await metaStorage().setItem(key, 1)
	return { ok: true, likes }
}

export async function hasLiked(ipHash: string, slug: string, id: string): Promise<boolean> {
	const key = `like:${ipHash}:${encodeLink(`${slug}#${id}`)}`
	return !!(await metaStorage().getItem(key))
}
