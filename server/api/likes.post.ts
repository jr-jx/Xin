import {
	getClientIp,
	hashIp,
	isReactionKey,
	tryBumpLike,
} from '../utils/likes'
import { enforce } from '../utils/rateLimit'

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

	await enforce(ipHash, 'friends-like:post', [{ windowMs: 1000, max: 10 }])

	const result = await tryBumpLike(ipHash, body.link, body.key)

	if (!result.ok) {
		setResponseStatus(event, 409)
		return { error: 'duplicate', count: result.count }
	}

	return { count: result.count }
})
