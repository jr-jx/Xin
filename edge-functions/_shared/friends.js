import { error, isMissingBindingError, json, storeGet, storeSet, withErrorHandling } from './edge-core.js'
import feeds from './friends-feeds.js'

const PER_FEED_LIMIT = 10
const TOTAL_LIMIT = 100
const FETCH_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_KEY = 'feed_latest'

function nodeText(value) {
	if (value == null)
		return ''
	return stripCdata(String(value).trim()).trim()
}

function decodeHtml(value) {
	return value
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, '\'')
		.replace(/&#x27;/gi, '\'')
}

function stripCdata(value) {
	return value.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
}

function stripHtml(html) {
	if (!html)
		return ''
	return decodeHtml(html)
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<[^>]+>/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function truncate(text, length) {
	if (!text)
		return ''
	const chars = Array.from(text)
	if (chars.length <= length)
		return text
	return `${chars.slice(0, length).join('')}…`
}

function asBlocks(xml, tag) {
	const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	return [...xml.matchAll(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'gi'))].map(match => match[1] || '')
}

function tagText(xml, tag) {
	const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	const match = xml.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, 'i'))
	return nodeText(match?.[1] || '')
}

function firstTagSource(xml, tag) {
	const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	return xml.match(new RegExp(`<${escaped}\\b[^>]*(?:\\/?>|>[\\s\\S]*?<\\/${escaped}>)`, 'i'))?.[0] || ''
}

function attr(source, name) {
	const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	return source.match(new RegExp(`${escaped}=["']([^"']+)["']`, 'i'))?.[1] || ''
}

function pickFirstText(xml, tags) {
	for (const tag of tags) {
		const value = tagText(xml, tag)
		if (value)
			return value
	}
	return ''
}

function isoDate(input) {
	const text = nodeText(input)
	if (!text)
		return ''
	const date = new Date(text)
	return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

function extractFirstImg(html) {
	return html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
}

function pickEnclosureImage(item) {
	const enclosures = [...item.matchAll(/<enclosure\b[^>]*>/gi)]
	for (const enclosure of enclosures) {
		const source = enclosure[0]
		const type = attr(source, 'type')
		const url = attr(source, 'url')
		if (url && (!type || type.startsWith('image/')))
			return url
	}
	return undefined
}

function pickMediaImage(item) {
	return attr(firstTagSource(item, 'media:content'), 'url')
		|| attr(firstTagSource(item, 'media:thumbnail'), 'url')
		|| undefined
}

function pickAtomLink(entry) {
	const links = [...entry.matchAll(/<link\b[^>]*(?:\/>|>[\s\S]*?<\/link>)/gi)]
	for (const link of links) {
		const source = link[0]
		const rel = attr(source, 'rel')
		if (rel && rel !== 'alternate')
			continue
		return attr(source, 'href') || stripHtml(source)
	}
	return ''
}

export function parseFeedXml(xml, limit = 10) {
	const rssItems = asBlocks(xml, 'item').slice(0, limit)
	if (rssItems.length) {
		return rssItems.map((item) => {
			const contentEncoded = tagText(item, 'content:encoded')
			const description = tagText(item, 'description')
			const html = contentEncoded || description
			const summary = truncate(stripHtml(description || contentEncoded), 200)
			return {
				title: stripHtml(tagText(item, 'title')) || '无标题',
				link: tagText(item, 'link') || attr(firstTagSource(item, 'link'), 'href'),
				summary,
				cover: pickEnclosureImage(item) || pickMediaImage(item) || extractFirstImg(html),
				pubDate: isoDate(pickFirstText(item, ['pubDate', 'dc:date', 'pubdate'])),
			}
		}).filter(item => item.link)
	}

	const atomEntries = asBlocks(xml, 'entry').slice(0, limit)
	if (atomEntries.length) {
		return atomEntries.map((entry) => {
			const summaryHtml = tagText(entry, 'summary')
			const contentHtml = tagText(entry, 'content')
			const html = contentHtml || summaryHtml
			const summary = truncate(stripHtml(summaryHtml || contentHtml), 200)
			return {
				title: stripHtml(tagText(entry, 'title')) || '无标题',
				link: pickAtomLink(entry),
				summary,
				cover: pickMediaImage(entry) || extractFirstImg(html),
				pubDate: isoDate(pickFirstText(entry, ['published', 'updated'])),
			}
		}).filter(item => item.link)
	}

	throw new Error('Unsupported feed format')
}

function flatten() {
	return feeds.flatMap(group => group.entries.filter(entry => entry.feed))
}

async function fetchWithTimeout(url, options, timeoutMs) {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { ...options, signal: controller.signal })
	}
	finally {
		clearTimeout(timer)
	}
}

async function fetchOne(entry) {
	const status = {
		author: entry.author,
		sitenick: entry.sitenick,
		siteLink: entry.link,
		feed: entry.feed,
		ok: false,
		count: 0,
	}

	try {
		const response = await fetchWithTimeout(entry.feed, {
			headers: {
				'User-Agent': 'XinBlog-Friends/1.0 (+https://blog.efu.me)',
				'Accept': 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
			},
			redirect: 'follow',
		}, FETCH_TIMEOUT_MS)

		if (!response.ok)
			throw new Error(`HTTP ${response.status}`)

		const parsed = parseFeedXml(await response.text(), PER_FEED_LIMIT)
		const items = parsed
			.filter(item => item.pubDate)
			.map(item => ({
				author: entry.author,
				sitenick: entry.sitenick,
				avatar: entry.avatar,
				siteLink: entry.link,
				archs: entry.archs,
				title: item.title,
				link: item.link,
				summary: item.summary,
				cover: item.cover,
				pubDate: item.pubDate,
			}))

		status.ok = true
		status.count = items.length
		return { items, status }
	}
	catch (err) {
		status.error = err?.message || String(err)
		return { items: [], status }
	}
}

async function aggregateFriends() {
	const results = await Promise.all(flatten().map(fetchOne))
	const items = results
		.flatMap(result => result.items)
		.sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
		.slice(0, TOTAL_LIMIT)

	return {
		response: {
			items,
			sources: results.map(result => result.status),
			generatedAt: new Date().toISOString(),
		},
		hasSuccess: results.some(result => result.status.ok),
	}
}

async function readCache(context) {
	try {
		const cached = await storeGet(context, 'friends', 'friends-feed', CACHE_KEY)
		if (cached?.response && typeof cached.cachedAt === 'number')
			return cached
	}
	catch (err) {
		if (!isMissingBindingError(err))
			console.warn('[friends] read cache failed:', err?.message || err)
	}
	return null
}

async function writeCache(context, response) {
	try {
		await storeSet(context, 'friends', 'friends-feed', CACHE_KEY, {
			response,
			cachedAt: Date.now(),
		})
	}
	catch (err) {
		if (!isMissingBindingError(err))
			console.warn('[friends] write cache failed:', err?.message || err)
	}
}

export const handleFriends = withErrorHandling(async (context) => {
	const { request } = context
	if (request.method !== 'GET')
		return error(405, 'method not allowed')

	const url = new URL(request.url)
	const forceRefresh = url.searchParams.has('refresh') || url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'
	const cacheHeaders = {
		'cache-control': forceRefresh ? 'no-store' : 'public, max-age=60, stale-while-revalidate=3600',
	}

	const cached = await readCache(context)
	const now = Date.now()
	if (!forceRefresh && cached && now - cached.cachedAt < CACHE_TTL_MS)
		return json(cached.response, 200, cacheHeaders)

	const { response, hasSuccess } = await aggregateFriends()
	if (hasSuccess) {
		await writeCache(context, response)
		return json(response, 200, cacheHeaders)
	}

	if (cached) {
		return json({
			...cached.response,
			sources: response.sources,
		}, 200, cacheHeaders)
	}

	return json(response, 200, cacheHeaders)
})
