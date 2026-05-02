import { recentComments, toPublicComment } from '../../utils/comments'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const limit = Math.min(50, Math.max(1, Number(query.limit) || 9))
	const includeReply = query.includeReply === '1' || query.includeReply === 'true'
	const list = await recentComments(limit, includeReply)
	return {
		items: list.map(c => toPublicComment(c, false)),
	}
})
