import { isAdmin } from '../../../utils/adminAuth'

export default defineEventHandler((event) => {
	return { isAdmin: isAdmin(event) }
})
