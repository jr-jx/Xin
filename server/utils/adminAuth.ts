import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'xin_admin'
const MAX_AGE = 60 * 60 * 24 // 1 day

function sign(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('base64url')
}

/** 生成简单 HMAC 签名 token：`base64url(json).sig` */
export function issueToken(secret: string, data: Record<string, unknown> = {}): string {
	const body = { ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE }
	const payload = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url')
	const sig = sign(payload, secret)
	return `${payload}.${sig}`
}

export function verifyToken(secret: string, token: string): Record<string, unknown> | null {
	if (!token || !token.includes('.'))
		return null
	const [payload, sig] = token.split('.')
	if (!payload || !sig)
		return null
	const expected = sign(payload, secret)
	const a = Buffer.from(sig)
	const b = Buffer.from(expected)
	if (a.length !== b.length || !timingSafeEqual(a, b))
		return null
	try {
		const body = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { exp?: number }
		if (!body.exp || body.exp * 1000 < Date.now())
			return null
		return body
	}
	catch {
		return null
	}
}

export function setAdminCookie(event: H3Event, token: string): void {
	setCookie(event, COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.dev,
		path: '/',
		maxAge: MAX_AGE,
	})
}

export function clearAdminCookie(event: H3Event): void {
	deleteCookie(event, COOKIE_NAME, { path: '/' })
}

export function isAdmin(event: H3Event): boolean {
	const { commentJwtSecret } = useRuntimeConfig()
	const token = getCookie(event, COOKIE_NAME)
	if (!token)
		return false
	return !!verifyToken(commentJwtSecret as string, token)
}

export function requireAdmin(event: H3Event): void {
	if (!isAdmin(event))
		throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
}
