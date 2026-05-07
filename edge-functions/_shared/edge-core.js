import { sha1Base64Url, sha1Hex, sha256Base64Url } from './edge-crypto.js'

export const BINDING_NAMES = {
	comments: 'XIN_COMMENTS_KV',
	friends: 'XIN_FRIENDS_KV',
}

export class HttpError extends Error {
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

export function error(status, statusMessage) {
	return json({ statusCode: status, statusMessage, message: statusMessage }, status)
}

export async function readJson(request) {
	try {
		return await request.json()
	}
	catch {
		return null
	}
}

export function env(context, name, fallback = '') {
	return String(context?.env?.[name] ?? globalThis[name] ?? fallback)
}

export function runtime(context) {
	return {
		ipHashSalt: env(context, 'NUXT_IP_HASH_SALT', 'xin-friends-likes-v1'),
		commentAdminPassword: env(context, 'NUXT_COMMENT_ADMIN_PASSWORD'),
		commentJwtSecret: env(context, 'NUXT_COMMENT_JWT_SECRET', 'xin-comment-jwt-dev-secret-change-me'),
		commentKeywordBlacklist: env(context, 'NUXT_COMMENT_KEYWORD_BLACKLIST'),
		commentAvatarProxy: env(context, 'NUXT_COMMENT_AVATAR_PROXY', 'https://weavatar.com/avatar'),
	}
}

export function getBinding(context, bucket) {
	const name = BINDING_NAMES[bucket]
	return name ? context?.env?.[name] || globalThis[name] || null : null
}

export function isBinding(value) {
	return !!value && typeof value.get === 'function' && typeof value.put === 'function'
}

export function kv(context, bucket) {
	const binding = getBinding(context, bucket)
	if (!isBinding(binding))
		throw new Error(`${BINDING_NAMES[bucket]} binding is not configured`)
	return binding
}

export function isMissingBindingError(err) {
	return String(err?.message || err).includes('binding is not configured')
}

function safePart(value) {
	return String(value).replace(/\W/g, '_')
}

export async function safeKey(bucket, namespace, key) {
	const raw = `${bucket}:${namespace}:${key}`
	const readable = `xin_${safePart(bucket)}_${safePart(namespace)}_${safePart(key)}`
	if (readable.length <= 512)
		return readable
	const hash = await sha1Hex(raw)
	return `xin_${safePart(bucket)}_${safePart(namespace).slice(0, 80)}_${hash}`
}

export async function storeGet(context, bucket, namespace, key) {
	const value = await kv(context, bucket).get(await safeKey(bucket, namespace, key))
	if (value == null || value === '')
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

export async function storeSet(context, bucket, namespace, key, value) {
	await kv(context, bucket).put(await safeKey(bucket, namespace, key), JSON.stringify(value))
}

export async function storeRemove(context, bucket, namespace, key) {
	const binding = kv(context, bucket)
	const fullKey = await safeKey(bucket, namespace, key)
	if (typeof binding.delete === 'function')
		await binding.delete(fullKey)
	else if (typeof binding.remove === 'function')
		await binding.remove(fullKey)
	else
		await binding.put(fullKey, '')
}

export function getClientIp(request) {
	return request.headers.get('x-nf-client-connection-ip')
		|| request.headers.get('cf-connecting-ip')
		|| request.headers.get('x-real-ip')
		|| request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
		|| 'unknown'
}

export async function hashIp(ip, salt) {
	return sha256Base64Url(`${salt}:${ip}`, 22)
}

export async function encodeLink(link) {
	return sha1Base64Url(link, 22)
}

export async function enforceRateLimit(context, ipHash, scope, rules, bucket = 'comments') {
	for (const rule of rules) {
		const key = `${scope}:${rule.windowMs}:${ipHash}`
		const now = Date.now()
		const current = await storeGet(context, bucket, 'ratelimit', key)
		if (!current || now - current.windowStart > rule.windowMs) {
			await storeSet(context, bucket, 'ratelimit', key, { windowStart: now, count: 1 })
			continue
		}
		current.count += 1
		if (current.count > rule.max)
			throw new HttpError(429, '请求过于频繁，稍后再试')
		await storeSet(context, bucket, 'ratelimit', key, current)
	}
}

export function withErrorHandling(handler) {
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
