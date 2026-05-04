const domainTip: Record<string, string> = {
	'github.io': 'GitHub Pages 域名',
	'netlify.app': 'Netlify 域名',
	'pages.dev': 'Cloudflare 域名',
	'vercel.app': 'Vercel 域名',
	'zabaur.app': 'Zebaur 域名',
}

// @keep-sorted
const noRouterExtensions = ['.css', '.csv', '.gif', '.ico', '.jpg', '.js', '.json', '.opml', '.png', '.svg', '.txt', '.xml', '.xsl']

// 常见的多段公共后缀（简化启发式，避免引入完整 PSL 数据）
const MULTI_LEVEL_SUFFIXES = new Set([
	'co.uk',
	'org.uk',
	'ac.uk',
	'gov.uk',
	'me.uk',
	'net.uk',
	'com.cn',
	'net.cn',
	'org.cn',
	'gov.cn',
	'edu.cn',
	'ac.cn',
	'com.hk',
	'org.hk',
	'net.hk',
	'gov.hk',
	'edu.hk',
	'com.tw',
	'net.tw',
	'org.tw',
	'gov.tw',
	'edu.tw',
	'com.au',
	'net.au',
	'org.au',
	'edu.au',
	'gov.au',
	'co.jp',
	'ne.jp',
	'or.jp',
	'ac.jp',
	'go.jp',
	'co.kr',
	'or.kr',
	'com.sg',
	'com.br',
	'com.mx',
	'github.io',
	'netlify.app',
	'pages.dev',
	'vercel.app',
	'zabaur.app',
])

export function getDomain(url: string): string {
	if (!url)
		return ''
	try {
		// 保持对无协议 URL 的兼容
		const full = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `http://${url}`
		return new URL(full).hostname || url
	}
	catch {
		return url
	}
}

export function getMainDomain(url: string, _useIcann?: boolean): string {
	const hostname = getDomain(url).replace(/^www\./, '')
	if (!hostname || /^\d+(?:\.\d+){3}$/.test(hostname))
		return hostname
	const parts = hostname.split('.').filter(Boolean)
	if (parts.length <= 2)
		return hostname
	const lastTwo = parts.slice(-2).join('.')
	const lastThree = parts.slice(-3).join('.')
	if (MULTI_LEVEL_SUFFIXES.has(lastTwo) && parts.length >= 3)
		return lastThree
	return lastTwo
}

export function getDomainType(mainDomain: string) {
	return domainTip[mainDomain]
}

export function getGhUsername(url?: string) {
	if (!url)
		return ''
	const usernameRegex = /github\.com\/([a-zA-Z0-9-]+)(?:\/[^/]+)?(\/?)$/
	return url.match(usernameRegex)?.[1] ?? ''
}

export function isExtLink(url?: string) {
	return url
		? url.includes(':')
		|| noRouterExtensions.some(ext => url.endsWith(ext))
		: false
}
