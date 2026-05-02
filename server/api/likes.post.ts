import {
	getClientIp,
	hashIp,
	isReactionKey,
	tryBumpLike,
} from '../utils/likes'

/** 轻量 in-memory 速率限制：同 IP 每秒最多 10 次 */
const rateLimit = new Map<string, { ts: number, n: number }>()
function allow(ipHash: string): boolean {
	const now = Date.now()
	const rec = rateLimit.get(ipHash)
	if (!rec || now - rec.ts > 1000) {
		rateLimit.set(ipHash, { ts: now, n: 1 })
		return true
	}
	rec.n += 1
	return rec.n <= 10
}

export default defineEventHandler(async (event) => {
	const body = await readBody<{ link?: string, key?: string }>(event)

	if (!body?.link || typeof body.link !== 'string' || !body.link.startsWith('http')) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid link' })
	}
	if (!isReactionKey(body.key)) {
		throw createError({ statusCode: 400, statusMessage: 'Invalid reaction key' })
	}

	const { ipHashSalt } = useRuntimeConfig()
	const ip = getClientIp(event)
	const ipHash = hashIp(ip, ipHashSalt as string)

	if (!allow(ipHash)) {
		throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
	}

	const result = await tryBumpLike(ipHash, body.link, body.key)

	if (!result.ok) {
		setResponseStatus(event, 409)
		return { error: 'duplicate', count: result.count }
	}

	return { count: result.count }
})
