import { requireAdmin } from '../../utils/adminAuth'
import { getCommentAvatarProxy, normalizeSlug, toPublicComment, updateComment } from '../../utils/comments'

export default defineEventHandler(async (event) => {
	requireAdmin(event)

	const id = getRouterParam(event, 'id')
	const body = await readBody<{ slug?: string, pinned?: unknown, hidden?: unknown }>(event)
	const slug = normalizeSlug(String(body?.slug || ''))
	if (!id || !slug)
		throw createError({ statusCode: 400, statusMessage: 'id and slug required' })

	const patch: { pinned?: boolean, hidden?: boolean } = {}
	if (typeof body.pinned === 'boolean')
		patch.pinned = body.pinned
	if (typeof body.hidden === 'boolean')
		patch.hidden = body.hidden
	if (!Object.keys(patch).length)
		throw createError({ statusCode: 400, statusMessage: 'empty patch' })

	const comment = await updateComment(slug, id, patch)
	if (!comment)
		throw createError({ statusCode: 404, statusMessage: 'Not found' })

	return { comment: toPublicComment(comment, false, await getCommentAvatarProxy()) }
})
