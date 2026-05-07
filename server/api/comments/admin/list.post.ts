import type { CommentAdminKind, CommentAdminStatus } from '../../../utils/comments'
import { requireAdmin } from '../../../utils/adminAuth'
import { adminListComments, getCommentAvatarProxy, toPublicComment } from '../../../utils/comments'

const STATUSES: CommentAdminStatus[] = ['all', 'visible', 'hidden', 'pinned']
const KINDS: CommentAdminKind[] = ['all', 'root', 'reply']

export default defineEventHandler(async (event) => {
	requireAdmin(event)

	const body = await readBody<{
		slugs?: unknown
		page?: unknown
		pageSize?: unknown
		status?: unknown
		kind?: unknown
		keyword?: unknown
	}>(event)

	const status = STATUSES.includes(body.status as CommentAdminStatus)
		? body.status as CommentAdminStatus
		: 'all'
	const kind = KINDS.includes(body.kind as CommentAdminKind)
		? body.kind as CommentAdminKind
		: 'all'
	const slugs = Array.isArray(body.slugs)
		? body.slugs.filter((slug): slug is string => typeof slug === 'string')
		: []

	const result = await adminListComments({
		slugs,
		page: Number(body.page) || 1,
		pageSize: Number(body.pageSize) || 20,
		status,
		kind,
		keyword: typeof body.keyword === 'string' ? body.keyword : '',
	})
	const avatarProxy = await getCommentAvatarProxy()

	return {
		items: result.items.map(comment => toPublicComment(comment, false, avatarProxy)),
		total: result.total,
		page: result.page,
		pageSize: result.pageSize,
		hasMore: result.hasMore,
		stats: result.stats,
	}
})
