import { requireAdmin } from '../../../utils/adminAuth'
import { readCommentSettings } from '../../../utils/comments'

export default defineEventHandler(async (event) => {
	requireAdmin(event)
	return await readCommentSettings()
})
