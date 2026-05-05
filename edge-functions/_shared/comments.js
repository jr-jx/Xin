import { isAdmin, requireAdmin } from './admin.js'
import {
	encodeLink,
	enforceRateLimit,
	error,
	getClientIp,
	hashIp,
	HttpError,
	json,
	readJson,
	runtime,
	storeGet,
	storeRemove,
	storeSet,
	withErrorHandling,
} from './edge-core.js'
import { md5, randomHex } from './edge-crypto.js'

const COMMENT_PAGE_SIZE = 20
const COMMENT_MAX_LENGTH = 2000
const GRAVATAR_MIRROR = 'https://cravatar.cn/avatar'
const GRAVATAR_DEFAULT = 'identicon'
const RECENT_MAX = 200

function normalizeSlug(slug) {
	if (!slug)
		return ''
	let value = String(slug).trim()
	if (!value.startsWith('/'))
		value = `/${value}`
	if (value.length > 1 && value.endsWith('/'))
		value = value.slice(0, -1)
	return value
}

async function slugKey(slug) {
	return encodeLink(normalizeSlug(slug)).then(value => value.slice(0, 16))
}

async function recordKey(slug, id) {
	return `posts:${await slugKey(slug)}:${id}`
}

async function indexKey(slug) {
	return `index:${await slugKey(slug)}`
}

async function readIndex(context, slug) {
	const list = await storeGet(context, 'comments', 'comment:meta', await indexKey(slug))
	return Array.isArray(list) ? list : []
}

async function writeIndex(context, slug, ids) {
	await storeSet(context, 'comments', 'comment:meta', await indexKey(slug), ids)
}

async function readRecent(context) {
	const list = await storeGet(context, 'comments', 'comment:meta', 'recent:index')
	return Array.isArray(list) ? list : []
}

async function writeRecent(context, list) {
	await storeSet(context, 'comments', 'comment:meta', 'recent:index', list.slice(0, RECENT_MAX))
}

async function getComment(context, slug, id) {
	return await storeGet(context, 'comments', 'comment:record', await recordKey(slug, id))
}

async function saveComment(context, rec) {
	await storeSet(context, 'comments', 'comment:record', await recordKey(rec.slug, rec.id), rec)
	const idx = await readIndex(context, rec.slug)
	if (!idx.includes(rec.id)) {
		idx.unshift(rec.id)
		await writeIndex(context, rec.slug, idx)
	}
	const recent = await readRecent(context)
	recent.unshift({ slug: rec.slug, id: rec.id })
	await writeRecent(context, recent)
}

async function updateComment(context, slug, id, patch) {
	const cur = await getComment(context, slug, id)
	if (!cur)
		return null
	const next = { ...cur, ...patch, updatedAt: Date.now() }
	await storeSet(context, 'comments', 'comment:record', await recordKey(slug, id), next)
	return next
}

async function deleteComment(context, slug, id) {
	await storeRemove(context, 'comments', 'comment:record', await recordKey(slug, id))
	const idx = await readIndex(context, slug)
	const next = idx.filter(item => item !== id)
	if (next.length !== idx.length)
		await writeIndex(context, slug, next)
	const recent = (await readRecent(context)).filter(item => !(item.slug === slug && item.id === id))
	await writeRecent(context, recent)
}

async function listBySlug(context, slug, page, pageSize, includeHidden = false) {
	const idx = await readIndex(context, slug)
	const all = (await Promise.all(idx.map(id => getComment(context, slug, id)))).filter(Boolean)
	const visible = includeHidden ? all : all.filter(comment => !comment.hidden || comment.pid)
	const parents = visible.filter(comment => !comment.pid).sort((a, b) => b.createdAt - a.createdAt)
	const total = visible.length
	const parentTotal = parents.length
	const start = (page - 1) * pageSize
	const pagedParents = parents.slice(start, start + pageSize)
	const pagedParentIds = new Set(pagedParents.map(parent => parent.id))
	const children = visible.filter(comment => comment.rid && pagedParentIds.has(comment.rid)).sort((a, b) => a.createdAt - b.createdAt)
	return {
		parents: pagedParents,
		children,
		total,
		parentTotal,
		hasMore: start + pageSize < parentTotal,
	}
}

async function recentComments(context, limit, includeReply) {
	const list = await readRecent(context)
	const out = []
	for (const ref of list) {
		if (out.length >= limit)
			break
		const comment = await getComment(context, ref.slug, ref.id)
		if (!comment || comment.hidden)
			continue
		if (!includeReply && comment.pid)
			continue
		out.push(comment)
	}
	return out
}

function gravatarUrl(mailMd5) {
	return `${GRAVATAR_MIRROR}/${mailMd5}?d=${GRAVATAR_DEFAULT}&s=80`
}

function toPublicComment(rec, likedByMe = false) {
	const { ipHash, mail, createdAt, updatedAt, content, html, ...rest } = rec
	return {
		...rest,
		comment: html,
		commentText: String(html || '').replace(/<[^>]+>/g, '').slice(0, 140),
		content,
		avatar: gravatarUrl(rec.mailMd5),
		relativeTime: '',
		created: createdAt,
		updated: updatedAt,
		liked: likedByMe,
	}
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, char => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		'\'': '&#39;',
	}[char]))
}

function renderMarkdown(content) {
	const text = String(content || '').trim()
	const html = text.split(/\n{2,}/).map(part => `<p>${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('')
	return { html, text }
}

function newCommentId() {
	return `c_${Date.now().toString(36)}${randomHex(4)}`
}

function checkSpam(input, blacklistKeywords = []) {
	const nick = input.nick || ''
	const mail = input.mail || ''
	const link = input.link || ''
	const content = input.content || ''
	if (!nick.trim())
		throw new HttpError(400, '昵称不能为空')
	if (nick.length > 40)
		throw new HttpError(400, '昵称过长')
	if (mail && (mail.length > 120 || !/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(mail)))
		throw new HttpError(400, '邮箱格式不正确')
	if (link && (link.length > 200 || !/^https?:\/\//.test(link)))
		throw new HttpError(400, '网址格式不正确')
	if (!content.trim())
		throw new HttpError(400, '评论内容不能为空')
	if (content.length > COMMENT_MAX_LENGTH)
		throw new HttpError(400, `评论长度超过 ${COMMENT_MAX_LENGTH} 字`)
	if ((content.match(/\bhttps?:\/\/\S+/gi) || []).length > 3)
		throw new HttpError(400, '包含过多链接')
	const lower = content.toLowerCase()
	for (const keyword of blacklistKeywords) {
		if (keyword && lower.includes(keyword.toLowerCase()))
			throw new HttpError(403, '内容包含禁用关键词')
	}
}

async function hasLiked(context, ipHash, slug, id) {
	const link = await encodeLink(`${slug}#${id}`)
	return !!(await storeGet(context, 'comments', 'comment:meta', `like:${ipHash}:${link}`))
}

async function tryLike(context, ipHash, slug, id) {
	const rec = await getComment(context, slug, id)
	if (!rec)
		return { ok: false, likes: 0 }
	const link = await encodeLink(`${slug}#${id}`)
	const key = `like:${ipHash}:${link}`
	if (await storeGet(context, 'comments', 'comment:meta', key))
		return { ok: false, likes: rec.likes || 0 }
	const likes = (rec.likes || 0) + 1
	await updateComment(context, slug, id, { likes })
	await storeSet(context, 'comments', 'comment:meta', key, 1)
	return { ok: true, likes }
}

export const handleComments = withErrorHandling(async (context) => {
	const { request } = context
	const url = new URL(request.url)
	const config = runtime(context)
	const ipHash = await hashIp(getClientIp(request), config.ipHashSalt)

	if (request.method === 'GET') {
		const slug = normalizeSlug(url.searchParams.get('slug') || '')
		if (!slug)
			return error(400, 'slug required')
		const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
		const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || COMMENT_PAGE_SIZE))
		const { parents, children, total, parentTotal, hasMore } = await listBySlug(context, slug, page, pageSize, false)
		const liked = new Set()
		await Promise.all([...parents, ...children].map(async (comment) => {
			if (await hasLiked(context, ipHash, slug, comment.id))
				liked.add(comment.id)
		}))
		return json({
			items: parents.map(parent => ({
				...toPublicComment(parent, liked.has(parent.id)),
				children: children.filter(child => child.rid === parent.id).map(child => toPublicComment(child, liked.has(child.id))),
			})),
			total,
			parentTotal,
			page,
			pageSize,
			hasMore,
		})
	}

	if (request.method !== 'POST')
		return error(405, 'method not allowed')

	await enforceRateLimit(context, ipHash, 'comment:post', [
		{ windowMs: 30000, max: 2 },
		{ windowMs: 60000, max: 3 },
		{ windowMs: 3600000, max: 20 },
	])

	const body = await readJson(request)
	const slug = normalizeSlug(body?.slug || '')
	if (!slug)
		return error(400, 'slug required')

	const nick = String(body?.nick || '').trim()
	const mail = String(body?.mail || '').trim().toLowerCase()
	const link = String(body?.link || '').trim()
	const content = String(body?.content || '').trim()
	const blacklist = config.commentKeywordBlacklist.split(',').map(item => item.trim()).filter(Boolean)
	checkSpam({ nick, mail, link, content }, blacklist)

	let pid = body?.pid || null
	let rid = body?.rid || null
	if (pid) {
		const parent = await getComment(context, slug, pid)
		if (!parent)
			return error(404, '被回复的评论不存在')
		rid = parent.rid || parent.id
	}
	else {
		pid = null
		rid = null
	}

	const { html, text } = renderMarkdown(content)
	const mailMd5 = mail ? md5(mail) : md5(`${nick}@anonymous`)
	const now = Date.now()
	const rec = {
		id: newCommentId(),
		slug,
		url: String(body?.url || slug),
		nick,
		mail: mail || undefined,
		mailMd5,
		link,
		content,
		html,
		ua: String(request.headers.get('user-agent') || '').slice(0, 300),
		pid,
		rid,
		ipHash,
		createdAt: now,
		updatedAt: now,
		hidden: false,
		likes: 0,
		isAdmin: await isAdmin(context),
	}
	await saveComment(context, rec)
	return json({ comment: toPublicComment(rec, false), text }, 201)
})

export const handleCommentLike = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	const body = await readJson(context.request)
	const slug = normalizeSlug(body?.slug || '')
	const id = String(body?.id || '')
	if (!slug || !id)
		return error(400, 'slug and id required')
	const ipHash = await hashIp(getClientIp(context.request), runtime(context).ipHashSalt)
	await enforceRateLimit(context, ipHash, 'comment:like', [
		{ windowMs: 5000, max: 5 },
		{ windowMs: 60000, max: 30 },
	])
	const result = await tryLike(context, ipHash, slug, id)
	if (!result.ok)
		return json({ error: 'duplicate', likes: result.likes }, 409)
	return json({ likes: result.likes })
})

export const handleRecentComments = withErrorHandling(async (context) => {
	if (context.request.method !== 'GET')
		return error(405, 'method not allowed')
	const url = new URL(context.request.url)
	const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 9))
	const includeReply = url.searchParams.get('includeReply') === '1' || url.searchParams.get('includeReply') === 'true'
	const list = await recentComments(context, limit, includeReply)
	return json({ items: list.map(comment => toPublicComment(comment, false)) })
})

export const handleDeleteComment = withErrorHandling(async (context) => {
	if (context.request.method !== 'DELETE')
		return error(405, 'method not allowed')
	await requireAdmin(context)
	const url = new URL(context.request.url)
	const slug = normalizeSlug(url.searchParams.get('slug') || '')
	const id = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
	const hard = url.searchParams.get('hard') === '1' || url.searchParams.get('hard') === 'true'
	if (!id || !slug)
		return error(400, 'id and slug required')
	const cur = await getComment(context, slug, id)
	if (!cur)
		return error(404, 'Not found')
	if (hard)
		await deleteComment(context, slug, id)
	else
		await updateComment(context, slug, id, { hidden: true })
	return json({ ok: true })
})
