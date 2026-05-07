import type { CommentAdminSettings } from '../../../utils/comments'
import { requireAdmin } from '../../../utils/adminAuth'
import { updateCommentSettings } from '../../../utils/comments'

export default defineEventHandler(async (event) => {
	requireAdmin(event)
	const body = await readBody<Partial<CommentAdminSettings> | null>(event)
	try {
		return await updateCommentSettings({
			avatarProxy: body?.avatarProxy,
		})
	}
	catch (err) {
		throw createError({
			statusCode: 400,
			statusMessage: err instanceof Error ? err.message : '设置保存失败',
		})
	}
})
