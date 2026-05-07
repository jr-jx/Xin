import blogConfig from '../../../blog.config'
import { isAdmin } from '../../utils/adminAuth'
import {
	getCommentAvatarProxy,
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
	const admin = isAdmin(event)
	const includeHidden = admin && (query.includeHidden === '1' || query.includeHidden === 'true')

	const { parents, children, total, parentTotal, hasMore } = await listBySlug(slug, page, pageSize, includeHidden)

	const { ipHashSalt } = useRuntimeConfig()
	const ipHash = hashIp(getClientIp(event), ipHashSalt as string)

	const liked = new Set<string>()
	await Promise.all([...parents, ...children].map(async (c) => {
		if (await hasLiked(ipHash, slug, c.id))
			liked.add(c.id)
	}))

	const childrenByRoot = new Map<string, typeof children>()
	for (const child of children) {
		const rootId = child.rid || child.pid
		if (!rootId)
			continue
		childrenByRoot.set(rootId, [...(childrenByRoot.get(rootId) || []), child])
	}

	const avatarProxy = await getCommentAvatarProxy()
	const items = parents.map(p => ({
		...toPublicComment(p, liked.has(p.id), avatarProxy),
		children: (childrenByRoot.get(p.id) || []).map(c => toPublicComment(c, liked.has(c.id), avatarProxy)),
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
