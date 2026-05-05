import {
	encodeLink,
	enforceRateLimit,
	error,
	getClientIp,
	hashIp,
	isMissingBindingError,
	json,
	readJson,
	runtime,
	storeGet,
	storeSet,
	withErrorHandling,
} from './edge-core.js'
import { base64UrlToString } from './edge-crypto.js'

const REACTION_KEYS = ['heart', 'fire', 'thumbs-up', 'smile']

function isReactionKey(value) {
	return REACTION_KEYS.includes(value)
}

function emptyCounts() {
	return { 'heart': 0, 'fire': 0, 'thumbs-up': 0, 'smile': 0 }
}

function countKey(linkHash, key) {
	return `count:${linkHash}:${key}`
}

function ipKey(ipHash, linkHash, key) {
	return `ip:${ipHash}:${linkHash}:${key}`
}

async function getCountsFor(context, links) {
	const result = {}
	await Promise.all(links.map(async (link) => {
		const linkHash = await encodeLink(link)
		const counts = emptyCounts()
		await Promise.all(REACTION_KEYS.map(async (key) => {
			const raw = await storeGet(context, 'friends', 'friends-like', countKey(linkHash, key))
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
			if (await storeGet(context, 'friends', 'friends-like', ipKey(ipHash, linkHash, key)))
				liked.push(key)
		}))
		result[link] = liked
	}))
	return result
}

async function tryBumpLike(context, ipHash, link, key) {
	const linkHash = await encodeLink(link)
	const likedKey = ipKey(ipHash, linkHash, key)
	const counterKey = countKey(linkHash, key)
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

export const handleLikes = withErrorHandling(async (context) => {
	const { request } = context
	const ipHash = await hashIp(getClientIp(request), runtime(context).ipHashSalt)
	if (request.method === 'GET') {
		const links = parseLinks(new URL(request.url).searchParams.get('links'))
		if (!links.length)
			return json({ counts: {}, likedByMe: {} })
		try {
			const [counts, likedByMe] = await Promise.all([
				getCountsFor(context, links),
				getLikedByIp(context, ipHash, links),
			])
			return json({ counts, likedByMe })
		}
		catch (err) {
			if (!isMissingBindingError(err))
				throw err
			return json({ counts: {}, likedByMe: {} })
		}
	}
	if (request.method !== 'POST')
		return error(405, 'method not allowed')
	await enforceRateLimit(context, ipHash, 'friends-like:post', [{ windowMs: 1000, max: 10 }], 'friends')
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
