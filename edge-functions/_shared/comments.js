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
const COMMENT_AVATAR_PROXY = 'https://weavatar.com/avatar'
const AVATAR_HASH_TOKEN = /\{hash\}|\{HASH\}|HASH/g
const HAS_AVATAR_HASH_TOKEN = /\{hash\}|\{HASH\}|HASH/
const RECENT_MAX = 200
const COMMENT_INDEX_VERSION = 1
const COMMENT_SETTINGS_KEY = 'settings'

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

async function slugIndexKey(slug) {
	return `slug-index:v${COMMENT_INDEX_VERSION}:${await slugKey(slug)}`
}

function emailMd5(mail) {
	return md5(String(mail || '').trim().toLowerCase()).toLowerCase()
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

function defaultAvatarProxy(context) {
	return runtime(context).commentAvatarProxy || COMMENT_AVATAR_PROXY
}

function normalizeAvatarProxy(value) {
	const raw = String(value || '').trim()
	if (!raw)
		throw new HttpError(400, '头像代理地址不能为空')

	const candidate = raw.replace(AVATAR_HASH_TOKEN, '00000000000000000000000000000000')
	let url
	try {
		url = new URL(candidate)
	}
	catch {
		throw new HttpError(400, '头像代理地址必须是有效 URL')
	}
	if (url.protocol !== 'http:' && url.protocol !== 'https:')
		throw new HttpError(400, '头像代理地址必须使用 HTTP 或 HTTPS')

	return HAS_AVATAR_HASH_TOKEN.test(raw) ? raw : raw.replace(/\/$/, '')
}

function safeAvatarProxy(value, fallback = COMMENT_AVATAR_PROXY) {
	try {
		return normalizeAvatarProxy(value)
	}
	catch {
		return normalizeAvatarProxy(fallback)
	}
}

async function readCommentSettings(context) {
	const defaultProxy = safeAvatarProxy(defaultAvatarProxy(context))
	const stored = await storeGet(context, 'comments', 'comment:meta', COMMENT_SETTINGS_KEY)
	return {
		avatarProxy: typeof stored?.avatarProxy === 'string'
			? safeAvatarProxy(stored.avatarProxy, defaultProxy)
			: defaultProxy,
	}
}

async function updateCommentSettings(context, patch) {
	const next = await readCommentSettings(context)
	if (Object.hasOwn(patch, 'avatarProxy'))
		next.avatarProxy = normalizeAvatarProxy(patch.avatarProxy)
	await storeSet(context, 'comments', 'comment:meta', COMMENT_SETTINGS_KEY, next)
	return next
}

async function getCommentAvatarProxy(context) {
	return (await readCommentSettings(context)).avatarProxy
}

function emptySlugIndex() {
	return {
		version: COMMENT_INDEX_VERSION,
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

function isStringArray(value) {
	return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function isChildrenIndex(value) {
	return !!value && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(isStringArray)
}

function isSlugIndex(value) {
	return !!value
		&& value.version === COMMENT_INDEX_VERSION
		&& isStringArray(value.roots)
		&& isStringArray(value.pinnedRoots)
		&& isChildrenIndex(value.children)
		&& isStringArray(value.adminRoots)
		&& isStringArray(value.adminPinnedRoots)
		&& isChildrenIndex(value.adminChildren)
		&& typeof value.total === 'number'
		&& typeof value.parentTotal === 'number'
		&& typeof value.adminTotal === 'number'
		&& typeof value.adminParentTotal === 'number'
}

async function readSlugIndex(context, slug) {
	const index = await storeGet(context, 'comments', 'comment:meta', await slugIndexKey(slug))
	return isSlugIndex(index) ? index : null
}

async function writeSlugIndex(context, slug, index) {
	await storeSet(context, 'comments', 'comment:meta', await slugIndexKey(slug), index)
}

function compareNewest(left, right) {
	return right.createdAt - left.createdAt
}

function commentRootId(comment) {
	return comment.pid ? (comment.rid || comment.pid) : comment.id
}

function buildView(records, byId) {
	const parents = records.filter(comment => !comment.pid)
	const pinnedRoots = parents.filter(comment => comment.pinned).sort(compareNewest).map(comment => comment.id)
	const roots = parents.filter(comment => !comment.pinned).sort(compareNewest).map(comment => comment.id)
	const parentIds = new Set([...pinnedRoots, ...roots])
	const children = {}

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
		ids.sort((left, right) => {
			const leftCreated = byId.get(left)?.createdAt || 0
			const rightCreated = byId.get(right)?.createdAt || 0
			return leftCreated - rightCreated
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

function buildSlugIndex(records) {
	if (!records.length)
		return emptySlugIndex()

	const byId = new Map(records.map(comment => [comment.id, comment]))
	const publicVisible = new Map()
	const isPublicVisible = (comment, visiting = new Set()) => {
		if (publicVisible.has(comment.id))
			return publicVisible.get(comment.id)
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

	const isAdminVisible = (comment) => {
		if (!comment.pid)
			return true
		const root = byId.get(commentRootId(comment))
		return !!root && !root.pid
	}

	const publicView = buildView(records.filter(comment => isPublicVisible(comment)), byId)
	const adminView = buildView(records.filter(comment => isAdminVisible(comment)), byId)

	return {
		version: COMMENT_INDEX_VERSION,
		updatedAt: Date.now(),
		...publicView,
		adminRoots: adminView.roots,
		adminPinnedRoots: adminView.pinnedRoots,
		adminChildren: adminView.children,
		adminTotal: adminView.total,
		adminParentTotal: adminView.parentTotal,
	}
}

async function readAllBySlug(context, slug) {
	const ids = await readIndex(context, slug)
	return (await Promise.all(ids.map(id => getComment(context, slug, id)))).filter(Boolean)
}

async function rebuildSlugIndex(context, slug) {
	const index = buildSlugIndex(await readAllBySlug(context, slug))
	await writeSlugIndex(context, slug, index)
	return index
}

async function ensureSlugIndex(context, slug) {
	return (await readSlugIndex(context, slug)) || await rebuildSlugIndex(context, slug)
}

async function commentsByIds(context, slug, ids) {
	if (!ids.length)
		return []
	return (await Promise.all(ids.map(id => getComment(context, slug, id)))).filter(Boolean)
}

async function listByIndex(context, slug, page, pageSize, includeHidden, index) {
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
		commentsByIds(context, slug, pagedRootIds),
		commentsByIds(context, slug, childIds),
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

function shouldRebuildSlugIndex(patch) {
	return Object.hasOwn(patch, 'hidden')
		|| Object.hasOwn(patch, 'pinned')
		|| Object.hasOwn(patch, 'pid')
		|| Object.hasOwn(patch, 'rid')
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
	await rebuildSlugIndex(context, rec.slug)
}

async function updateComment(context, slug, id, patch) {
	const cur = await getComment(context, slug, id)
	if (!cur)
		return null
	const next = { ...cur, ...patch, updatedAt: Date.now() }
	await storeSet(context, 'comments', 'comment:record', await recordKey(slug, id), next)
	if (shouldRebuildSlugIndex(patch))
		await rebuildSlugIndex(context, slug)
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
	await rebuildSlugIndex(context, slug)
}

async function listBySlug(context, slug, page, pageSize, includeHidden = false) {
	let index = await ensureSlugIndex(context, slug)
	let result = await listByIndex(context, slug, page, pageSize, includeHidden, index)
	if (result.stale) {
		index = await rebuildSlugIndex(context, slug)
		result = await listByIndex(context, slug, page, pageSize, includeHidden, index)
	}
	return {
		parents: result.parents,
		children: result.children,
		total: result.total,
		parentTotal: result.parentTotal,
		hasMore: result.hasMore,
	}
}

function emptyAdminStats() {
	return {
		total: 0,
		visible: 0,
		hidden: 0,
		pinned: 0,
		roots: 0,
		replies: 0,
	}
}

function addAdminStats(stats, comment) {
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

function matchesAdminStatus(comment, status) {
	if (status === 'visible')
		return !comment.hidden
	if (status === 'hidden')
		return comment.hidden
	if (status === 'pinned')
		return !!comment.pinned
	return true
}

function matchesAdminKind(comment, kind) {
	if (kind === 'root')
		return !comment.pid
	if (kind === 'reply')
		return !!comment.pid
	return true
}

function matchesAdminKeyword(comment, keyword) {
	if (!keyword)
		return true
	const haystack = [
		comment.id,
		comment.nick,
		comment.content,
		comment.replyToNick,
		comment.slug,
		comment.url,
	].filter(Boolean).join(' ').toLowerCase()
	return haystack.includes(keyword)
}

async function adminListComments(context, options) {
	const slugs = [...new Set((options.slugs || []).map(slug => normalizeSlug(slug)).filter(Boolean))]
	const page = Math.max(1, Math.floor(Number(options.page)) || 1)
	const pageSize = Math.min(100, Math.max(1, Math.floor(Number(options.pageSize)) || COMMENT_PAGE_SIZE))
	const keyword = String(options.keyword || '').trim().toLowerCase()
	const records = (await Promise.all(slugs.map(slug => readAllBySlug(context, slug)))).flat()
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
		if (comment.pid) {
			const root = await getComment(context, comment.slug, comment.rid || comment.pid)
			if (!root || root.hidden)
				continue
		}
		out.push(comment)
	}
	return out
}

function gravatarUrl(mailMd5, avatarProxy = COMMENT_AVATAR_PROXY) {
	const proxy = safeAvatarProxy(avatarProxy)
	if (HAS_AVATAR_HASH_TOKEN.test(proxy))
		return proxy.replace(AVATAR_HASH_TOKEN, mailMd5)
	return `${proxy}/${mailMd5}`
}

function safePublicAvatar(value) {
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

function toPublicComment(rec, likedByMe = false, avatarProxy = COMMENT_AVATAR_PROXY) {
	const { ipHash, mail, authProvider: _authProvider, authUserId: _authUserId, createdAt, updatedAt, content, html, avatar, ...rest } = rec
	return {
		...rest,
		comment: html,
		commentText: String(html || '').replace(/<[^>]+>/g, '').slice(0, 140),
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
		const includeHidden = (await isAdmin(context)) && (url.searchParams.get('includeHidden') === '1' || url.searchParams.get('includeHidden') === 'true')
		const { parents, children, total, parentTotal, hasMore } = await listBySlug(context, slug, page, pageSize, includeHidden)
		const liked = new Set()
		await Promise.all([...parents, ...children].map(async (comment) => {
			if (await hasLiked(context, ipHash, slug, comment.id))
				liked.add(comment.id)
		}))
		const childrenByRoot = new Map()
		for (const child of children) {
			const rootId = child.rid || child.pid
			if (!rootId)
				continue
			childrenByRoot.set(rootId, [...(childrenByRoot.get(rootId) || []), child])
		}
		const avatarProxy = await getCommentAvatarProxy(context)
		return json({
			items: parents.map(parent => ({
				...toPublicComment(parent, liked.has(parent.id), avatarProxy),
				children: (childrenByRoot.get(parent.id) || []).map(child => toPublicComment(child, liked.has(child.id), avatarProxy)),
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

	const mode = body?.mode === 'anonymous' ? 'anonymous' : 'manual'

	const nick = mode === 'anonymous'
		? '匿名访客'
		: String(body?.nick || '').trim()
	const mail = mode === 'anonymous' ? '' : String(body?.mail || '').trim().toLowerCase()
	const link = mode === 'anonymous' ? '' : String(body?.link || '').trim()
	const content = String(body?.content || '').trim()
	const blacklist = config.commentKeywordBlacklist.split(',').map(item => item.trim()).filter(Boolean)
	checkSpam({ nick, mail, link, content }, blacklist)

	let pid = body?.pid || null
	let rid = body?.rid || null
	let replyToNick = ''
	if (pid) {
		const parent = await getComment(context, slug, pid)
		if (!parent)
			return error(404, '被回复的评论不存在')
		rid = parent.rid || parent.id
		replyToNick = parent.nick
	}
	else {
		pid = null
		rid = null
	}

	const { html, text } = renderMarkdown(content)
	const mailMd5 = mail ? emailMd5(mail) : md5(`${nick}@anonymous`)
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
		pinned: false,
		likes: 0,
		isAdmin: await isAdmin(context),
		replyToNick,
	}
	await saveComment(context, rec)
	return json({ comment: toPublicComment(rec, false, await getCommentAvatarProxy(context)), text }, 201)
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
	const avatarProxy = await getCommentAvatarProxy(context)
	return json({ items: list.map(comment => toPublicComment(comment, false, avatarProxy)) })
})

export const handleAdminCommentList = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	await requireAdmin(context)

	const body = await readJson(context.request)
	const statuses = ['all', 'visible', 'hidden', 'pinned']
	const kinds = ['all', 'root', 'reply']
	const status = statuses.includes(body?.status) ? body.status : 'all'
	const kind = kinds.includes(body?.kind) ? body.kind : 'all'
	const slugs = Array.isArray(body?.slugs) ? body.slugs.filter(slug => typeof slug === 'string') : []
	const result = await adminListComments(context, {
		slugs,
		page: body?.page,
		pageSize: body?.pageSize,
		status,
		kind,
		keyword: typeof body?.keyword === 'string' ? body.keyword : '',
	})
	const avatarProxy = await getCommentAvatarProxy(context)

	return json({
		items: result.items.map(comment => toPublicComment(comment, false, avatarProxy)),
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
		hasMore: result.hasMore,
		stats: result.stats,
	})
})

export const handleAdminCommentSettings = withErrorHandling(async (context) => {
	if (context.request.method !== 'GET' && context.request.method !== 'PATCH' && context.request.method !== 'POST')
		return error(405, 'method not allowed')
	await requireAdmin(context)

	if (context.request.method === 'GET')
		return json(await readCommentSettings(context))

	const body = await readJson(context.request)
	return json(await updateCommentSettings(context, {
		avatarProxy: body?.avatarProxy,
	}))
})

export const handleDeleteComment = withErrorHandling(async (context) => {
	if (context.request.method !== 'DELETE' && context.request.method !== 'PATCH')
		return error(405, 'method not allowed')
	await requireAdmin(context)
	const url = new URL(context.request.url)
	const id = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')

	if (context.request.method === 'PATCH') {
		const body = await readJson(context.request)
		const slug = normalizeSlug(body?.slug || url.searchParams.get('slug') || '')
		if (!id || !slug)
			return error(400, 'id and slug required')
		const patch = {}
		if (typeof body?.pinned === 'boolean')
			patch.pinned = body.pinned
		if (typeof body?.hidden === 'boolean')
			patch.hidden = body.hidden
		if (!Object.keys(patch).length)
			return error(400, 'empty patch')
		const comment = await updateComment(context, slug, id, patch)
		if (!comment)
			return error(404, 'Not found')
		return json({ comment: toPublicComment(comment, false, await getCommentAvatarProxy(context)) })
	}

	const slug = normalizeSlug(url.searchParams.get('slug') || '')
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
