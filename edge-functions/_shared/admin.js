import {
	BINDING_NAMES,
	enforceRateLimit,
	error,
	getBinding,
	getClientIp,
	hashIp,
	HttpError,
	isBinding,
	isMissingBindingError,
	json,
	readJson,
	runtime,
	safeKey,
	withErrorHandling,
} from './edge-core.js'
import { base64UrlToString, bytesToBase64Url, constantEqual, hmacSign } from './edge-crypto.js'

const COOKIE_NAME = 'xin_admin'
const ADMIN_MAX_AGE = 60 * 60 * 24

async function issueToken(secret, data = {}) {
	const body = { ...data, exp: Math.floor(Date.now() / 1000) + ADMIN_MAX_AGE }
	const payload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(body)))
	const sig = await hmacSign(secret, payload)
	return `${payload}.${sig}`
}

async function verifyToken(secret, token) {
	if (!token || !token.includes('.'))
		return null
	const [payload, sig] = token.split('.')
	if (!payload || !sig)
		return null
	const expected = await hmacSign(secret, payload)
	if (!constantEqual(sig, expected))
		return null
	try {
		const body = JSON.parse(base64UrlToString(payload))
		if (!body.exp || body.exp * 1000 < Date.now())
			return null
		return body
	}
	catch {
		return null
	}
}

function getCookie(request, name) {
	const cookie = request.headers.get('cookie') || ''
	for (const part of cookie.split(';')) {
		const [rawName, ...rest] = part.trim().split('=')
		if (rawName === name)
			return decodeURIComponent(rest.join('=') || '')
	}
	return ''
}

function secureCookiePart(request) {
	const proto = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.replace(':', '')
	return proto === 'https' ? '; Secure' : ''
}

export async function isAdmin(context) {
	const token = getCookie(context.request, COOKIE_NAME)
	if (!token)
		return false
	return !!(await verifyToken(runtime(context).commentJwtSecret, token))
}

export async function requireAdmin(context) {
	if (!(await isAdmin(context)))
		throw new HttpError(401, 'Unauthorized')
}

export const handleAdminLogin = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	const config = runtime(context)
	const ipHash = await hashIp(getClientIp(context.request), config.ipHashSalt)
	try {
		await enforceRateLimit(context, ipHash, 'comment:login', [
			{ windowMs: 60000, max: 5 },
			{ windowMs: 3600000, max: 30 },
		])
	}
	catch (err) {
		if (!isMissingBindingError(err))
			throw err
	}
	if (!config.commentAdminPassword)
		return error(503, '管理员密码未配置')
	const body = await readJson(context.request)
	const input = String(body?.password || '')
	if (input.length !== config.commentAdminPassword.length || !constantEqual(input, config.commentAdminPassword))
		return error(401, '密码错误')
	const token = await issueToken(config.commentJwtSecret, { role: 'admin' })
	return json({ ok: true }, 200, {
		'set-cookie': `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${ADMIN_MAX_AGE}; Path=/; HttpOnly; SameSite=Lax${secureCookiePart(context.request)}`,
	})
})

export const handleAdminLogout = withErrorHandling(async (context) => {
	if (context.request.method !== 'POST')
		return error(405, 'method not allowed')
	return json({ ok: true }, 200, {
		'set-cookie': `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secureCookiePart(context.request)}`,
	})
})

export const handleAdminMe = withErrorHandling(async context => json({ isAdmin: await isAdmin(context) }))

export const handleKvHealth = withErrorHandling(async (context) => {
	if (context.request.method !== 'GET')
		return error(405, 'method not allowed')
	await requireAdmin(context)
	const url = new URL(context.request.url)
	const write = url.searchParams.get('write') === '1' || url.searchParams.get('write') === 'true'
	const buckets = ['comments', 'friends']
	const results = []
	for (const bucket of buckets) {
		const binding = getBinding(context, bucket)
		const status = {
			bucket,
			bindingName: BINDING_NAMES[bucket],
			available: isBinding(binding),
			mode: isBinding(binding) ? 'direct' : 'missing',
			source: isBinding(binding) ? `context.env.${BINDING_NAMES[bucket]}` : `missing:${BINDING_NAMES[bucket]}`,
			methods: isBinding(binding) ? ['get', 'put', 'delete', 'remove'].filter(method => typeof binding[method] === 'function') : [],
			localFallback: false,
			proxyConfigured: false,
			writeOk: false,
			readOk: false,
			deleteOk: false,
		}
		if (write && isBinding(binding)) {
			try {
				const key = await safeKey(bucket, 'diag', `${Date.now()}_${Math.random().toString(36).slice(2)}`)
				await binding.put(key, JSON.stringify({ ok: true }))
				status.writeOk = true
				status.readOk = (await binding.get(key)) != null
				if (typeof binding.delete === 'function') {
					await binding.delete(key)
					status.deleteOk = true
				}
				else if (typeof binding.remove === 'function') {
					await binding.remove(key)
					status.deleteOk = true
				}
			}
			catch (err) {
				status.error = err instanceof Error ? err.message : String(err)
			}
		}
		results.push(status)
	}
	return json({ write, buckets: results })
})
