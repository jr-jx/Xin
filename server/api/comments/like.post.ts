import { normalizeSlug, tryLike } from '../../utils/comments'
import { enforce } from '../../utils/rateLimit'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ slug?: string, id?: string }>(event)
	const slug = normalizeSlug(String(body?.slug || ''))
	const id = String(body?.id || '')
	if (!slug || !id)
		throw createError({ statusCode: 400, statusMessage: 'slug and id required' })

	const { ipHashSalt } = useRuntimeConfig()
	const ipHash = hashIp(getClientIp(event), ipHashSalt as string)

	enforce(ipHash, 'comment:like', [
		{ windowMs: 5_000, max: 5 },
		{ windowMs: 60_000, max: 30 },
	])

	const result = await tryLike(ipHash, slug, id)
	if (!result.ok) {
		setResponseStatus(event, 409)
		return { error: 'duplicate', likes: result.likes }
	}
	return { likes: result.likes }
})
