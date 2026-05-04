import { createHash, randomBytes } from 'node:crypto'
import DOMPurify from 'isomorphic-dompurify'
import { marked } from 'marked'
import blogConfig from '../../blog.config'
import { getEdgeKvStore } from './edgeKv'

/** 服务端评论记录（完整存储字段） */
export interface CommentRecord {
	id: string
	slug: string
	url: string
	nick: string
	mailMd5: string
	/** 原始邮箱，仅服务端使用，不返回给前端 */
	mail?: string
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
	likes: number
	isAdmin: boolean
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

export function gravatarUrl(mailMd5: string): string {
	const base = blogConfig.comment.gravatarMirror.replace(/\/$/, '')
	const d = blogConfig.comment.gravatarDefault
	return `${base}/${mailMd5}?d=${d}&s=80`
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

function recordKey(slug: string, id: string): string {
	return `posts:${slugKey(slug)}:${id}`
}

function indexKey(slug: string): string {
	return `index:${slugKey(slug)}`
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
}

/** 分页读取某文章评论（含子评论） */
export async function listBySlug(slug: string, page: number, pageSize: number, includeHidden = false) {
	const idx = await readIndex(slug)
	const all = (await Promise.all(idx.map(id => getComment(slug, id)))).filter((x): x is CommentRecord => !!x)
	const visible = includeHidden ? all : all.filter(c => !c.hidden || c.pid)
	const parents = visible.filter(c => !c.pid).sort((a, b) => b.createdAt - a.createdAt)
	const total = visible.length
	const parentTotal = parents.length
	const start = (page - 1) * pageSize
	const pagedParents = parents.slice(start, start + pageSize)
	const pagedParentIds = new Set(pagedParents.map(p => p.id))
	// 挂载所有属于这些根评论的子评论
	const children = visible.filter(c => c.rid && pagedParentIds.has(c.rid))
		.sort((a, b) => a.createdAt - b.createdAt)
	return {
		parents: pagedParents,
		children,
		total,
		parentTotal,
		hasMore: start + pageSize < parentTotal,
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
		out.push(c)
	}
	return out
}

/** 转成给前端用的安全对象（去除 ipHash / mail 等敏感字段） */
export function toPublicComment(rec: CommentRecord, likedByMe = false) {
	const { ipHash, mail, createdAt, updatedAt, content, html, ...rest } = rec
	return {
		...rest,
		comment: html,
		commentText: html.replace(/<[^>]+>/g, '').slice(0, 140),
		content,
		avatar: gravatarUrl(rec.mailMd5),
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
