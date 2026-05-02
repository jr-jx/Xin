import { XMLParser } from 'fast-xml-parser'

export interface ParsedFeedItem {
	title: string
	link: string
	summary: string
	cover?: string
	pubDate: string
}

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '@_',
	cdataPropName: '__cdata',
	textNodeName: '#text',
	trimValues: true,
})

/** 把可能为 string / { '#text': string } / { __cdata: string } 的节点转纯字符串 */
function nodeText(node: unknown): string {
	if (node == null)
		return ''
	if (typeof node === 'string')
		return node
	if (Array.isArray(node))
		return node.map(nodeText).join('')
	if (typeof node === 'object') {
		const obj = node as Record<string, unknown>
		if (typeof obj.__cdata === 'string')
			return obj.__cdata
		if (typeof obj['#text'] === 'string')
			return obj['#text']
	}
	return ''
}

/** 在对象中按一组候选键名找到第一个有值的节点 */
function pick(obj: Record<string, any>, keys: string[]): any {
	for (const k of keys) {
		if (obj[k] != null && obj[k] !== '')
			return obj[k]
	}
	return undefined
}

/** 剥离 HTML 标签，压缩空白 */
export function stripHtml(html: string): string {
	if (!html)
		return ''
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, '\'')
		.replace(/\s+/g, ' ')
		.trim()
}

/** 截取指定长度，附省略号 */
export function truncate(text: string, len: number): string {
	if (!text)
		return ''
	const arr = Array.from(text)
	if (arr.length <= len)
		return text
	return `${arr.slice(0, len).join('')}…`
}

/** 从 HTML 字符串中抓取首张 <img src> */
function extractFirstImg(html: string): string | undefined {
	if (!html)
		return undefined
	const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
	return m?.[1]
}

/** 从 Atom <link> 节点中挑出 alternate 链接（兼容数组） */
function pickAtomLink(link: unknown): string {
	if (!link)
		return ''
	if (typeof link === 'string')
		return link
	if (Array.isArray(link)) {
		const alt = link.find((l: any) => !l['@_rel'] || l['@_rel'] === 'alternate')
		return (alt?.['@_href'] as string) || (link[0]?.['@_href'] as string) || ''
	}
	const obj = link as Record<string, any>
	return obj['@_href'] || nodeText(obj) || ''
}

function isoDate(input: unknown): string {
	const text = nodeText(input).trim()
	if (!text)
		return ''
	const d = new Date(text)
	return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

function asArray<T>(input: T | T[] | undefined): T[] {
	if (input == null)
		return []
	return Array.isArray(input) ? input : [input]
}

/**
 * 解析 RSS 2.0 / Atom 1.0 字符串为统一条目数组。
 * 失败时抛出错误。
 */
export function parseFeedXml(xml: string, limit = 10): ParsedFeedItem[] {
	const root = parser.parse(xml)

	// RSS 2.0
	if (root?.rss?.channel) {
		const channel = root.rss.channel
		const items = asArray<any>(channel.item).slice(0, limit)
		return items.map((item) => {
			const contentEncoded = nodeText(item['content:encoded'])
			const description = nodeText(item.description)
			const html = contentEncoded || description
			const summary = truncate(stripHtml(description || contentEncoded), 200)
			const cover = pickEnclosureImage(item)
				|| nodeText((item['media:content'] as any)?.['@_url'])
				|| nodeText((item['media:thumbnail'] as any)?.['@_url'])
				|| extractFirstImg(html)
			return {
				title: stripHtml(nodeText(item.title)) || '无标题',
				link: nodeText(item.link).trim() || nodeText((item.link as any)?.['@_href']) || '',
				summary,
				cover,
				pubDate: isoDate(pick(item, ['pubDate', 'dc:date', 'pubdate'])) || '',
			}
		}).filter(i => i.link)
	}

	// Atom 1.0
	if (root?.feed?.entry || root?.feed) {
		const feed = root.feed
		const entries = asArray<any>(feed.entry).slice(0, limit)
		return entries.map((entry) => {
			const summaryHtml = nodeText(entry.summary)
			const contentHtml = nodeText(entry.content)
			const html = contentHtml || summaryHtml
			const summary = truncate(stripHtml(summaryHtml || contentHtml), 200)
			const cover = nodeText((entry['media:thumbnail'] as any)?.['@_url'])
				|| nodeText((entry['media:content'] as any)?.['@_url'])
				|| extractFirstImg(html)
			return {
				title: stripHtml(nodeText(entry.title)) || '无标题',
				link: pickAtomLink(entry.link),
				summary,
				cover,
				pubDate: isoDate(pick(entry, ['published', 'updated'])) || '',
			}
		}).filter(i => i.link)
	}

	throw new Error('Unsupported feed format')
}

/** RSS enclosure 取图 */
function pickEnclosureImage(item: any): string | undefined {
	const enc = item.enclosure
	if (!enc)
		return undefined
	const list = asArray<any>(enc)
	for (const e of list) {
		const type = e['@_type'] as string | undefined
		const url = e['@_url'] as string | undefined
		if (url && (!type || type.startsWith('image/')))
			return url
	}
	return undefined
}
