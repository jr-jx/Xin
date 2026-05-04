import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { getEdgeKvStore } from './edgeKv'

export const REACTION_KEYS = ['heart', 'fire', 'thumbs-up', 'smile'] as const
export type ReactionKey = typeof REACTION_KEYS[number]

export type CountMap = Record<ReactionKey, number>

function emptyCounts(): CountMap {
	return { 'heart': 0, 'fire': 0, 'thumbs-up': 0, 'smile': 0 }
}

export function isReactionKey(x: unknown): x is ReactionKey {
	return typeof x === 'string' && (REACTION_KEYS as readonly string[]).includes(x)
}

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

/** 计数键 */
function countKey(linkHash: string, key: ReactionKey): string {
	return `count:${linkHash}:${key}`
}

/** IP 已点标记键 */
function ipKey(ipHash: string, linkHash: string, key: ReactionKey): string {
	return `ip:${ipHash}:${linkHash}:${key}`
}

/** 获取多个链接的完整计数 */
export async function getCountsFor(links: string[]): Promise<Record<string, CountMap>> {
	const storage = getEdgeKvStore('friends-like')
	const result: Record<string, CountMap> = {}
	await Promise.all(links.map(async (link) => {
		const h = encodeLink(link)
		const counts = emptyCounts()
		await Promise.all(REACTION_KEYS.map(async (k) => {
			const raw = await storage.getItem<number>(countKey(h, k))
			counts[k] = typeof raw === 'number' ? raw : 0
		}))
		result[link] = counts
	}))
	return result
}

/** 当前 IP 对多个链接上已点过的表情 */
export async function getLikedByIp(ipHash: string, links: string[]): Promise<Record<string, ReactionKey[]>> {
	const storage = getEdgeKvStore('friends-like')
	const result: Record<string, ReactionKey[]> = {}
	await Promise.all(links.map(async (link) => {
		const h = encodeLink(link)
		const liked: ReactionKey[] = []
		await Promise.all(REACTION_KEYS.map(async (k) => {
			const raw = await storage.getItem(ipKey(ipHash, h, k))
			if (raw)
				liked.push(k)
		}))
		result[link] = liked
	}))
	return result
}

/**
 * 尝试对某 link 的某表情点赞一次。
 * 返回 { ok: true, count } 或 { ok: false, reason: 'duplicate', count }。
 */
export async function tryBumpLike(
	ipHash: string,
	link: string,
	key: ReactionKey,
): Promise<{ ok: true, count: number } | { ok: false, reason: 'duplicate', count: number }> {
	const storage = getEdgeKvStore('friends-like')
	const linkHash = encodeLink(link)
	const ipK = ipKey(ipHash, linkHash, key)
	const cK = countKey(linkHash, key)

	const already = await storage.getItem(ipK)
	const current = (await storage.getItem<number>(cK)) ?? 0
	if (already)
		return { ok: false, reason: 'duplicate', count: current }

	const next = current + 1
	await storage.setItem(cK, next)
	await storage.setItem(ipK, 1)
	return { ok: true, count: next }
}

/** 解析批量查询链接：接受 JSON 数组字符串或 "a,b,c"，或 base64(json) */
export function parseLinks(input: unknown): string[] {
	if (Array.isArray(input))
		return input.filter(s => typeof s === 'string' && s.startsWith('http'))
	if (typeof input !== 'string' || !input)
		return []
	// 尝试 base64
	try {
		const decoded = Buffer.from(input, 'base64url').toString('utf8')
		const arr = JSON.parse(decoded)
		if (Array.isArray(arr))
			return arr.filter(s => typeof s === 'string' && s.startsWith('http'))
	}
	catch {}
	// 退化为 CSV
	return input
		.split(',')
		.map(s => s.trim())
		.filter(s => s.startsWith('http'))
}
