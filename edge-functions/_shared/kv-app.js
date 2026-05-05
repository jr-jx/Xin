const COMMENT_PAGE_SIZE = 20
const COMMENT_MAX_LENGTH = 2000
const GRAVATAR_MIRROR = 'https://cravatar.cn/avatar'
const GRAVATAR_DEFAULT = 'identicon'
const RECENT_MAX = 200
const COOKIE_NAME = 'xin_admin'
const ADMIN_MAX_AGE = 60 * 60 * 24
const REACTION_KEYS = ['heart', 'fire', 'thumbs-up', 'smile']

const BINDING_NAMES = {
	comments: 'XIN_COMMENTS_KV',
	friends: 'XIN_FRIENDS_KV',
}

class HttpError extends Error {
	constructor(status, message) {
		super(message)
		this.status = status
	}
}

export function json(data, status = 200, headers = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...headers,
		},
	})
}

function error(status, statusMessage) {
	return json({ statusCode: status, statusMessage, message: statusMessage }, status)
}

async function readJson(request) {
	try {
		return await request.json()
	}
	catch {
		return null
	}
}

function env(context, name, fallback = '') {
	return String(context?.env?.[name] ?? globalThis[name] ?? fallback)
}

function runtime(context) {
	return {
		ipHashSalt: env(context, 'NUXT_IP_HASH_SALT', 'xin-friends-likes-v1'),
		commentAdminPassword: env(context, 'NUXT_COMMENT_ADMIN_PASSWORD'),
		commentJwtSecret: env(context, 'NUXT_COMMENT_JWT_SECRET', 'xin-comment-jwt-dev-secret-change-me'),
		commentKeywordBlacklist: env(context, 'NUXT_COMMENT_KEYWORD_BLACKLIST'),
	}
}

function getBinding(context, bucket) {
	const name = BINDING_NAMES[bucket]
	return name ? context?.env?.[name] || globalThis[name] || null : null
}

function isBinding(value) {
	return !!value && typeof value.get === 'function' && typeof value.put === 'function'
}

function kv(context, bucket) {
	const binding = getBinding(context, bucket)
	if (!isBinding(binding))
		throw new Error(`${BINDING_NAMES[bucket]} binding is not configured`)
	return binding
}

function safePart(value) {
	return String(value).replace(/\W/g, '_')
}

function bytesToHex(bytes) {
	return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
}

function bytesToBase64Url(bytes) {
	let binary = ''
	for (const byte of bytes)
		binary += String.fromCharCode(byte)
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToString(value) {
	const base64 = String(value).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(String(value).length / 4) * 4, '=')
	const binary = atob(base64)
	const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
	return new TextDecoder().decode(bytes)
}

async function digest(algorithm, value) {
	const data = new TextEncoder().encode(value)
	return new Uint8Array(await crypto.subtle.digest(algorithm, data))
}

async function sha1Base64Url(value, length) {
	return bytesToBase64Url(await digest('SHA-1', value)).slice(0, length)
}

async function sha1Hex(value) {
	return bytesToHex(await digest('SHA-1', value))
}

async function sha256Base64Url(value, length) {
	return bytesToBase64Url(await digest('SHA-256', value)).slice(0, length)
}

// Small MD5 implementation for Gravatar compatibility in the edge runtime.
function md5(input) {
	function add32(a, b) {
		return (a + b) & 0xFFFFFFFF
	}
	function cmn(q, a, b, x, s, t) {
		a = add32(add32(a, q), add32(x, t))
		return add32((a << s) | (a >>> (32 - s)), b)
	}
	function ff(a, b, c, d, x, s, t) {
		return cmn((b & c) | (~b & d), a, b, x, s, t)
	}
	function gg(a, b, c, d, x, s, t) {
		return cmn((b & d) | (c & ~d), a, b, x, s, t)
	}
	function hh(a, b, c, d, x, s, t) {
		return cmn(b ^ c ^ d, a, b, x, s, t)
	}
	function ii(a, b, c, d, x, s, t) {
		return cmn(c ^ (b | ~d), a, b, x, s, t)
	}
	function md5cycle(state, block) {
		let [a, b, c, d] = state
		a = ff(a, b, c, d, block[0], 7, -680876936)
		d = ff(d, a, b, c, block[1], 12, -389564586)
		c = ff(c, d, a, b, block[2], 17, 606105819)
		b = ff(b, c, d, a, block[3], 22, -1044525330)
		a = ff(a, b, c, d, block[4], 7, -176418897)
		d = ff(d, a, b, c, block[5], 12, 1200080426)
		c = ff(c, d, a, b, block[6], 17, -1473231341)
		b = ff(b, c, d, a, block[7], 22, -45705983)
		a = ff(a, b, c, d, block[8], 7, 1770035416)
		d = ff(d, a, b, c, block[9], 12, -1958414417)
		c = ff(c, d, a, b, block[10], 17, -42063)
		b = ff(b, c, d, a, block[11], 22, -1990404162)
		a = ff(a, b, c, d, block[12], 7, 1804603682)
		d = ff(d, a, b, c, block[13], 12, -40341101)
		c = ff(c, d, a, b, block[14], 17, -1502002290)
		b = ff(b, c, d, a, block[15], 22, 1236535329)
		a = gg(a, b, c, d, block[1], 5, -165796510)
		d = gg(d, a, b, c, block[6], 9, -1069501632)
		c = gg(c, d, a, b, block[11], 14, 643717713)
		b = gg(b, c, d, a, block[0], 20, -373897302)
		a = gg(a, b, c, d, block[5], 5, -701558691)
		d = gg(d, a, b, c, block[10], 9, 38016083)
		c = gg(c, d, a, b, block[15], 14, -660478335)
		b = gg(b, c, d, a, block[4], 20, -405537848)
		a = gg(a, b, c, d, block[9], 5, 568446438)
		d = gg(d, a, b, c, block[14], 9, -1019803690)
		c = gg(c, d, a, b, block[3], 14, -187363961)
		b = gg(b, c, d, a, block[8], 20, 1163531501)
		a = gg(a, b, c, d, block[13], 5, -1444681467)
		d = gg(d, a, b, c, block[2], 9, -51403784)
		c = gg(c, d, a, b, block[7], 14, 1735328473)
		b = gg(b, c, d, a, block[12], 20, -1926607734)
		a = hh(a, b, c, d, block[5], 4, -378558)
		d = hh(d, a, b, c, block[8], 11, -2022574463)
		c = hh(c, d, a, b, block[11], 16, 1839030562)
		b = hh(b, c, d, a, block[14], 23, -35309556)
		a = hh(a, b, c, d, block[1], 4, -1530992060)
		d = hh(d, a, b, c, block[4], 11, 1272893353)
		c = hh(c, d, a, b, block[7], 16, -155497632)
		b = hh(b, c, d, a, block[10], 23, -1094730640)
		a = hh(a, b, c, d, block[13], 4, 681279174)
		d = hh(d, a, b, c, block[0], 11, -358537222)
		c = hh(c, d, a, b, block[3], 16, -722521979)
		b = hh(b, c, d, a, block[6], 23, 76029189)
		a = hh(a, b, c, d, block[9], 4, -640364487)
		d = hh(d, a, b, c, block[12], 11, -421815835)
		c = hh(c, d, a, b, block[15], 16, 530742520)
		b = hh(b, c, d, a, block[2], 23, -995338651)
		a = ii(a, b, c, d, block[0], 6, -198630844)
		d = ii(d, a, b, c, block[7], 10, 1126891415)
		c = ii(c, d, a, b, block[14], 15, -1416354905)
		b = ii(b, c, d, a, block[5], 21, -57434055)
		a = ii(a, b, c, d, block[12], 6, 1700485571)
		d = ii(d, a, b, c, block[3], 10, -1894986606)
		c = ii(c, d, a, b, block[10], 15, -1051523)
		b = ii(b, c, d, a, block[1], 21, -2054922799)
		a = ii(a, b, c, d, block[8], 6, 1873313359)
		d = ii(d, a, b, c, block[15], 10, -30611744)
		c = ii(c, d, a, b, block[6], 15, -1560198380)
		b = ii(b, c, d, a, block[13], 21, 1309151649)
		a = ii(a, b, c, d, block[4], 6, -145523070)
		d = ii(d, a, b, c, block[11], 10, -1120210379)
		c = ii(c, d, a, b, block[2], 15, 718787259)
		b = ii(b, c, d, a, block[9], 21, -343485551)
		state[0] = add32(a, state[0])
		state[1] = add32(b, state[1])
		state[2] = add32(c, state[2])
		state[3] = add32(d, state[3])
	}
	function md5blk(bytes) {
		const out = []
		for (let i = 0; i < 64; i += 4)
			out[i >> 2] = bytes[i] + (bytes[i + 1] << 8) + (bytes[i + 2] << 16) + (bytes[i + 3] << 24)
		return out
	}
	const bytes = new TextEncoder().encode(input)
	const state = [1732584193, -271733879, -1732584194, 271733878]
	let i = 0
	for (; i + 64 <= bytes.length; i += 64)
		md5cycle(state, md5blk(bytes.slice(i, i + 64)))
	const tail = new Uint8Array(64)
	tail.set(bytes.slice(i))
	tail[bytes.length - i] = 0x80
	if (bytes.length - i > 55) {
		md5cycle(state, md5blk(tail))
		tail.fill(0)
	}
	const bitLen = bytes.length * 8
	for (let j = 0; j < 8; j++)
		tail[56 + j] = (bitLen >>> (j * 8)) & 0xFF
	md5cycle(state, md5blk(tail))
	const out = []
	for (const word of state) {
		for (let j = 0; j < 4; j++)
			out.push((word >>> (j * 8)) & 0xFF)
	}
	return bytesToHex(out)
}

async function safeKey(bucket, namespace, key) {
	const raw = `${bucket}:${namespace}:${key}`
	const readable = `xin_${safePart(bucket)}_${safePart(namespace)}_${safePart(key)}`
	if (readable.length <= 512)
		return readable
	const hash = await sha1Hex(raw)
	return `xin_${safePart(bucket)}_${safePart(namespace).slice(0, 80)}_${hash}`
}

async function storeGet(context, bucket, namespace, key) {
	const value = await kv(context, bucket).get(await safeKey(bucket, namespace, key))
	if (value == null)
		return null
	if (typeof value !== 'string')
		return value
	try {
		return JSON.parse(value)
	}
	catch {
		return value
	}
}

async function storeSet(context, bucket, namespace, key, value) {
	await kv(context, bucket).put(await safeKey(bucket, namespace, key), JSON.stringify(value))
}

async function storeRemove(context, bucket, namespace, key) {
	const binding = kv(context, bucket)
	const fullKey = await safeKey(bucket, namespace, key)
	if (typeof binding.delete === 'function')
		await binding.delete(fullKey)
	else if (typeof binding.remove === 'function')
		await binding.remove(fullKey)
	else
		await binding.put(fullKey, '')
}

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
	return sha1Base64Url(normalizeSlug(slug), 16)
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
	const { ipHash, mail, createdAt, updatedAt, html, ...rest } = rec
	return {
		...rest,
		comment: html,
		commentText: String(html || '').replace(/<[^>]+>/g, '').slice(0, 140),
		content: rec.content,
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

function getClientIp(request) {
	return request.headers.get('x-nf-client-connection-ip')
		|| request.headers.get('cf-connecting-ip')
		|| request.headers.get('x-real-ip')
		|| request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		|| 'unknown'
}

async function hashIp(ip, salt) {
	return sha256Base64Url(`${salt}:${ip}`, 22)
}

async function encodeLink(link) {
	return sha1Base64Url(link, 22)
}

function randomHex(bytesLength) {
	const bytes = new Uint8Array(bytesLength)
	crypto.getRandomValues(bytes)
	return bytesToHex(bytes)
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

async function enforceRateLimit(context, ipHash, scope, rules) {
	for (const rule of rules) {
		const key = `${scope}:${rule.windowMs}:${ipHash}`
		const now = Date.now()
		const current = await storeGet(context, 'comments', 'ratelimit', key)
		if (!current || now - current.windowStart > rule.windowMs) {
			await storeSet(context, 'comments', 'ratelimit', key, { windowStart: now, count: 1 })
			continue
		}
		current.count += 1
		if (current.count > rule.max)
			throw new HttpError(429, '请求过于频繁，稍后再试')
		await storeSet(context, 'comments', 'ratelimit', key, current)
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

function isReactionKey(value) {
	return REACTION_KEYS.includes(value)
}

function emptyCounts() {
	return { 'heart': 0, 'fire': 0, 'thumbs-up': 0, 'smile': 0 }
}

async function countKey(linkHash, key) {
	return `count:${linkHash}:${key}`
}

async function ipKey(ipHash, linkHash, key) {
	return `ip:${ipHash}:${linkHash}:${key}`
}

async function getCountsFor(context, links) {
	const result = {}
	await Promise.all(links.map(async (link) => {
		const linkHash = await encodeLink(link)
		const counts = emptyCounts()
		await Promise.all(REACTION_KEYS.map(async (key) => {
			const raw = await storeGet(context, 'friends', 'friends-like', await countKey(linkHash, key))
			counts[key] = typeof raw === 'number' ? raw : 0
		}))
		result[link] = counts
	}))
	return result
}

async function getLikedByIp(context, ipHash, links) {
	const result = {}
	await Promise.all(links.map(async (link) => {
		const linkHash = await encodeLink(link)
		const liked = []
		await Promise.all(REACTION_KEYS.map(async (key) => {
			if (await storeGet(context, 'friends', 'friends-like', await ipKey(ipHash, linkHash, key)))
				liked.push(key)
		}))
		result[link] = liked
	}))
	return result
}

async function tryBumpLike(context, ipHash, link, key) {
	const linkHash = await encodeLink(link)
	const likedKey = await ipKey(ipHash, linkHash, key)
	const counterKey = await countKey(linkHash, key)
	const already = await storeGet(context, 'friends', 'friends-like', likedKey)
	const current = await storeGet(context, 'friends', 'friends-like', counterKey) ?? 0
	if (already)
		return { ok: false, count: current }
	const next = current + 1
	await storeSet(context, 'friends', 'friends-like', counterKey, next)
	await storeSet(context, 'friends', 'friends-like', likedKey, 1)
	return { ok: true, count: next }
}

function parseLinks(input) {
	if (Array.isArray(input))
		return input.filter(link => typeof link === 'string' && link.startsWith('http'))
	if (typeof input !== 'string' || !input)
		return []
	try {
		const arr = JSON.parse(base64UrlToString(input))
		if (Array.isArray(arr))
			return arr.filter(link => typeof link === 'string' && link.startsWith('http'))
	}
	catch {}
	return input.split(',').map(item => item.trim()).filter(item => item.startsWith('http'))
}

async function hmacSign(secret, payload) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	)
	return bytesToBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))))
}

function constantEqual(a, b) {
	if (a.length !== b.length)
		return false
	let diff = 0
	for (let i = 0; i < a.length; i++)
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
	return diff === 0
}

async function issueToken(secret, data = {}) {
	const body = { ...data, exp: Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE }
	const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(body)))
	const sig = await hmacSign(secret, payload)
	return `${payload}.${sig}`
}

async function verifyToken(secret, token) {
	if (!token || !token.includes('.'))
		return null
	const [payload, sig] = token.split('.')
	if (!payload || !sig)
		return null
	const expected = await hmacSign(secret, payload)
	if (!constantEqual(sig, expected))
		return null
	try {
		const body = JSON.parse(base64UrlToString(payload))
		if (!body.exp || body.exp * 1000 < Date.now())
			return null
		return body
	}
	catch {
		return null
	}
}

function getCookie(request, name) {
	const cookie = request.headers.get('cookie') || ''
	for (const part of cookie.split(';')) {
		const [rawName, ...rest] = part.trim().split('=')
		if (rawName === name)
			return decodeURIComponent(rest.join('=') || '')
	}
	return ''
}

function secureCookiePart(request) {
	const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')
	return proto === 'https' ? '; Secure' : ''
}

async function isAdmin(context) {
	const token = getCookie(context.request, COOKIE_NAME)
	if (!token)
		return false
	return !!(await verifyToken(runtime(context).commentJwtSecret, token))
}

async function requireAdmin(context) {
	if (!(await isAdmin(context)))
		throw new HttpError(401, 'Unauthorized')
}

function withErrorHandling(handler) {
	return async (context) => {
		try {
			return await handler(context)
		}
		catch (err) {
			const status = err?.status || 500
			return error(status, err?.message || String(err))
		}
	}
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

	const nick = String(body.nick || '').trim()
	const mail = String(body.mail || '').trim().toLowerCase()
	const link = String(body.link || '').trim()
	const content = String(body.content || '').trim()
	const blacklist = config.commentKeywordBlacklist.split(',').map(item => item.trim()).filter(Boolean)
	checkSpam({ nick, mail, link, content }, blacklist)

	let pid = body.pid || null
	let rid = body.rid || null
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
		url: String(body.url || slug),
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

export const handleLikes = withErrorHandling(async (context) => {
	const { request } = context
	const ipHash = await hashIp(getClientIp(request), runtime(context).ipHashSalt)
	if (request.method === 'GET') {
		const links = parseLinks(new URL(request.url).searchParams.get('links'))
		if (!links.length)
			return json({ counts: {}, likedByMe: {} })
		const [counts, likedByMe] = await Promise.all([
			getCountsFor(context, links),
			getLikedByIp(context, ipHash, links),
		])
		return json({ counts, likedByMe })
	}
	if (request.method !== 'POST')
		return error(405, 'method not allowed')
	await enforceRateLimit(context, ipHash, 'friends-like:post', [{ windowMs: 1000, max: 10 }])
	const body = await readJson(request)
	if (!body?.link || typeof body.link !== 'string' || !body.link.startsWith('http'))
		return error(400, 'Invalid link')
	if (!isReactionKey(body.key))
		return error(400, 'Invalid reaction key')
	const result = await tryBumpLike(context, ipHash, body.link, body.key)
	if (!result.ok)
		return json({ error: 'duplicate', count: result.count }, 409)
	return json({ count: result.count })
})

export const handleAdminLogin = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	const config = runtime(context)
	const ipHash = await hashIp(getClientIp(context.request), config.ipHashSalt)
	try {
		await enforceRateLimit(context, ipHash, 'comment:login', [
			{ windowMs: 60000, max: 5 },
			{ windowMs: 3600000, max: 30 },
		])
	}
	catch (err) {
		if (!String(err?.message || '').includes('binding is not configured'))
			throw err
	}
	if (!config.commentAdminPassword)
		return error(503, '管理员密码未配置')
	const body = await readJson(context.request)
	const input = String(body?.password || '')
	if (input.length !== config.commentAdminPassword.length || !constantEqual(input, config.commentAdminPassword))
		return error(401, '密码错误')
	const token = await issueToken(config.commentJwtSecret, { role: 'admin' })
	return json({ ok: true }, 200, {
		'set-cookie': `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${ADMIN_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secureCookiePart(context.request)}`,
	})
})

export const handleAdminLogout = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	return json({ ok: true }, 200, {
		'set-cookie': `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secureCookiePart(context.request)}`,
	})
})

export const handleAdminMe = withErrorHandling(async context => json({ isAdmin: await isAdmin(context) }))

export const handleKvHealth = withErrorHandling(async (context) => {
	if (context.request.method !== 'GET')
		return error(405, 'method not allowed')
	await requireAdmin(context)
	const url = new URL(context.request.url)
	const write = url.searchParams.get('write') === '1' || url.searchParams.get('write') === 'true'
	const buckets = ['comments', 'friends']
	const results = []
	for (const bucket of buckets) {
		const binding = getBinding(context, bucket)
		const status = {
			bucket,
			bindingName: BINDING_NAMES[bucket],
			available: isBinding(binding),
			mode: isBinding(binding) ? 'direct' : 'missing',
			source: isBinding(binding) ? `context.env.${BINDING_NAMES[bucket]}` : '',
			methods: isBinding(binding) ? ['get', 'put', 'delete', 'remove'].filter(method => typeof binding[method] === 'function') : [],
			writeOk: false,
			readOk: false,
			deleteOk: false,
		}
		if (write && isBinding(binding)) {
			const key = await safeKey(bucket, 'diag', `${Date.now()}_${Math.random().toString(36).slice(2)}`)
			await binding.put(key, JSON.stringify({ ok: true }))
			status.writeOk = true
			status.readOk = (await binding.get(key)) != null
			if (typeof binding.delete === 'function') {
				await binding.delete(key)
				status.deleteOk = true
			}
			else if (typeof binding.remove === 'function') {
				await binding.remove(key)
				status.deleteOk = true
			}
		}
		results.push(status)
	}
	return json({ write, buckets: results })
})
