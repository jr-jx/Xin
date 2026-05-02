/**
 * 轻量内存速率限制器。进程内存储，Serverless 冷启动时会重置；
 * 仅用于抑制突发滥用，非强一致。
 */
interface Bucket {
	windowStart: number
	count: number
}

const buckets = new Map<string, Bucket>()

export interface RateRule {
	/** 窗口毫秒数 */
	windowMs: number
	/** 允许次数 */
	max: number
}

export function rateLimit(key: string, rule: RateRule): { ok: boolean, remaining: number } {
	const now = Date.now()
	const b = buckets.get(key)
	if (!b || now - b.windowStart > rule.windowMs) {
		buckets.set(key, { windowStart: now, count: 1 })
		return { ok: true, remaining: rule.max - 1 }
	}
	b.count += 1
	if (b.count > rule.max)
		return { ok: false, remaining: 0 }
	return { ok: true, remaining: rule.max - b.count }
}

export function enforce(ipHash: string, scope: string, rules: RateRule[]): void {
	for (const r of rules) {
		const k = `${scope}:${r.windowMs}:${ipHash}`
		const { ok } = rateLimit(k, r)
		if (!ok)
			throw createError({ statusCode: 429, statusMessage: '请求过于频繁，稍后再试' })
	}
}
