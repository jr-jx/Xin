import { getEdgeKvStore } from './edgeKv'

interface Bucket {
	windowStart: number
	count: number
}

const store = getEdgeKvStore('ratelimit')

export interface RateRule {
	/** 窗口毫秒数 */
	windowMs: number
	/** 允许次数 */
	max: number
}

export async function rateLimit(key: string, rule: RateRule): Promise<{ ok: boolean, remaining: number }> {
	const now = Date.now()
	const b = await store.getItem<Bucket>(key)
	if (!b || now - b.windowStart > rule.windowMs) {
		await store.setItem(key, { windowStart: now, count: 1 })
		return { ok: true, remaining: rule.max - 1 }
	}
	b.count += 1
	if (b.count > rule.max)
		return { ok: false, remaining: 0 }
	await store.setItem(key, b)
	return { ok: true, remaining: rule.max - b.count }
}

export async function enforce(ipHash: string, scope: string, rules: RateRule[]): Promise<void> {
	for (const r of rules) {
		const k = `${scope}:${r.windowMs}:${ipHash}`
		const { ok } = await rateLimit(k, r)
		if (!ok)
			throw createError({ statusCode: 429, statusMessage: '请求过于频繁，稍后再试' })
	}
}
