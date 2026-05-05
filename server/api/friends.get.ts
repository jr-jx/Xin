import type { FeedEntry, FriendItem, FriendSourceStatus, FriendsResponse } from '~/types/feed'
import feeds from '~/feeds'
import { getEdgeKvStore } from '../utils/edgeKv'
import { parseFeedXml } from '../utils/parseFeed'

const PER_FEED_LIMIT = 10
const TOTAL_LIMIT = 100
const FETCH_TIMEOUT_MS = 8000
const CACHE_TTL_MS = 60 * 60 * 1000
const CACHE_KEY = 'feed_latest'
const cache = getEdgeKvStore('friends-feed', 'friends')

interface CachedFriendsResponse {
	response: FriendsResponse
	cachedAt: number
}

function flatten(): FeedEntry[] {
	return feeds.flatMap(g => g.entries.filter(e => e.feed))
}

async function fetchOne(entry: FeedEntry): Promise<{ items: FriendItem[], status: FriendSourceStatus }> {
	const status: FriendSourceStatus = {
		author: entry.author,
		sitenick: entry.sitenick,
		siteLink: entry.link,
		feed: entry.feed,
		ok: false,
		count: 0,
	}
	try {
		const res = await fetch(entry.feed!, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			headers: {
				'User-Agent': 'XinBlog-Friends/1.0 (+https://blog.efu.me)',
				'Accept': 'application/atom+xml, application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5',
			},
			redirect: 'follow',
		})
		if (!res.ok)
			throw new Error(`HTTP ${res.status}`)
		const xml = await res.text()
		const parsed = parseFeedXml(xml, PER_FEED_LIMIT)
		const items: FriendItem[] = parsed
			.filter(p => p.pubDate)
			.map(p => ({
				author: entry.author,
				sitenick: entry.sitenick,
				avatar: entry.avatar,
				siteLink: entry.link,
				archs: entry.archs,
				title: p.title,
				link: p.link,
				summary: p.summary,
				cover: p.cover,
				pubDate: p.pubDate,
			}))
		status.ok = true
		status.count = items.length
		return { items, status }
	}
	catch (err: any) {
		status.error = err?.message || String(err)
		return { items: [], status }
	}
}

async function aggregateFriends(): Promise<{ response: FriendsResponse, hasSuccess: boolean }> {
	const entries = flatten()
	const results = await Promise.all(entries.map(fetchOne))

	const items = results
		.flatMap(r => r.items)
		.sort((a, b) => +new Date(b.pubDate) - +new Date(a.pubDate))
		.slice(0, TOTAL_LIMIT)

	return {
		response: {
			items,
			sources: results.map(r => r.status),
			generatedAt: new Date().toISOString(),
		},
		hasSuccess: results.some(r => r.status.ok),
	}
}

export default defineEventHandler(async (event): Promise<FriendsResponse> => {
	setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=3600')

	const cached = await cache.getItem<CachedFriendsResponse>(CACHE_KEY)
	const now = Date.now()
	if (cached && now - cached.cachedAt < CACHE_TTL_MS)
		return cached.response

	const { response, hasSuccess } = await aggregateFriends()
	if (hasSuccess) {
		await cache.setItem(CACHE_KEY, { response, cachedAt: now } satisfies CachedFriendsResponse)
		return response
	}

	if (cached) {
		return {
			...cached.response,
			sources: response.sources,
		}
	}

	return response
})
