import type { H3Event } from 'h3'
import { createHash } from 'node:crypto'

/** 从请求头提取客户端 IP（考虑 Netlify / Cloudflare / 反向代理） */
export function getClientIp(event: H3Event): string {
	const req = event.node.req
	const headers = req.headers
	const pick = (name: string): string | undefined => {
		const v = headers[name]
		return Array.isArray(v) ? v[0] : v
	}
	return (
		pick('x-nf-client-connection-ip')
		|| pick('cf-connecting-ip')
		|| pick('x-real-ip')
		|| pick('x-forwarded-for')?.split(',')[0]?.trim()
		|| req.socket?.remoteAddress
		|| 'unknown'
	)
}

/** 对 IP 加盐 SHA-256 取前 22 位 base64url，作为持久化指纹 */
export function hashIp(ip: string, salt: string): string {
	return createHash('sha256')
		.update(`${salt}:${ip}`)
		.digest('base64url')
		.slice(0, 22)
}

/** 将任意 URL 转为 base64url 键片段（稳定、短、URL 安全） */
export function encodeLink(link: string): string {
	return createHash('sha1').update(link).digest('base64url').slice(0, 22)
}
