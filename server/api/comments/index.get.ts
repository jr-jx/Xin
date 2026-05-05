import blogConfig from '../../../blog.config'
import {
	hasLiked,
	listBySlug,
	normalizeSlug,
	toPublicComment,
} from '../../utils/comments'
import { getClientIp, hashIp } from '../../utils/requestIdentity'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const slug = normalizeSlug(String(query.slug || ''))
	if (!slug)
		throw createError({ statusCode: 400, statusMessage: 'slug required' })

	const page = Math.max(1, Number(query.page) || 1)
	const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || blogConfig.comment.pageSize))

	const { parents, children, total, parentTotal, hasMore } = await listBySlug(slug, page, pageSize, false)

	const { ipHashSalt } = useRuntimeConfig()
	const ipHash = hashIp(getClientIp(event), ipHashSalt as string)

	const liked = new Set<string>()
	await Promise.all([...parents, ...children].map(async (c) => {
		if (await hasLiked(ipHash, slug, c.id))
			liked.add(c.id)
	}))

	// 构建树：父 + 挂载 children
	const items = parents.map(p => ({
		...toPublicComment(p, liked.has(p.id)),
		children: children
			.filter(c => c.rid === p.id)
			.map(c => toPublicComment(c, liked.has(c.id))),
	}))

	return {
		items,
		total,
		parentTotal,
		page,
		pageSize,
		hasMore,
	}
})
