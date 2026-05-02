import { requireAdmin } from '../../utils/adminAuth'
import { deleteComment, getComment, normalizeSlug, updateComment } from '../../utils/comments'

export default defineEventHandler(async (event) => {
	requireAdmin(event)
	const id = getRouterParam(event, 'id')
	const query = getQuery(event)
	const slug = normalizeSlug(String(query.slug || ''))
	const hard = query.hard === '1' || query.hard === 'true'
	if (!id || !slug)
		throw createError({ statusCode: 400, statusMessage: 'id and slug required' })

	const cur = await getComment(slug, id)
	if (!cur)
		throw createError({ statusCode: 404, statusMessage: 'Not found' })

	if (hard)
		await deleteComment(slug, id)
	else
		await updateComment(slug, id, { hidden: true })

	return { ok: true }
})
