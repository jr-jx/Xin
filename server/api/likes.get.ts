import {
	getClientIp,
	getCountsFor,
	getLikedByIp,
	hashIp,
	parseLinks,
} from '../utils/likes'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const links = parseLinks(query.links)
	if (!links.length)
		return { counts: {}, likedByMe: {} }

	const { ipHashSalt } = useRuntimeConfig()
	const ip = getClientIp(event)
	const ipHash = hashIp(ip, ipHashSalt as string)

	const [counts, likedByMe] = await Promise.all([
		getCountsFor(links),
		getLikedByIp(ipHash, links),
	])

	return { counts, likedByMe }
})
