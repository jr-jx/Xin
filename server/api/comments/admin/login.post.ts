import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import { issueToken, setAdminCookie } from '../../../utils/adminAuth'
import { enforce } from '../../../utils/rateLimit'

export default defineEventHandler(async (event) => {
	const body = await readBody<{ password?: string }>(event)
	const { commentAdminPassword, commentJwtSecret, ipHashSalt } = useRuntimeConfig()

	const ipHash = hashIp(getClientIp(event), ipHashSalt as string)
	enforce(ipHash, 'comment:login', [
		{ windowMs: 60_000, max: 5 },
		{ windowMs: 3_600_000, max: 30 },
	])

	if (!commentAdminPassword)
		throw createError({ statusCode: 503, statusMessage: '管理员密码未配置' })

	const input = String(body?.password || '')
	const a = Buffer.from(input.padEnd(64, '\0').slice(0, 64))
	const b = Buffer.from(String(commentAdminPassword).padEnd(64, '\0').slice(0, 64))
	const matched = input.length === String(commentAdminPassword).length && timingSafeEqual(a, b)
	if (!matched)
		throw createError({ statusCode: 401, statusMessage: '密码错误' })

	const token = issueToken(commentJwtSecret as string, { role: 'admin' })
	setAdminCookie(event, token)
	return { ok: true }
})
