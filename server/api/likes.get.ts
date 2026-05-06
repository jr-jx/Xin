import { isMissingEdgeKvBindingError } from '../utils/edgeKv'
import {
	getCountsFor,
	getLikedByIp,
	parseLinks,
} from '../utils/likes'
import { getClientIp, hashIp } from '../utils/requestIdentity'

export default defineEventHandler(async (event) => {
	const query = getQuery(event)
	const links = parseLinks(query.links)
	if (!links.length)
		return { counts: {}, likedByMe: {} }

	const { ipHashSalt } = useRuntimeConfig()
	const ip = getClientIp(event)
	const ipHash = hashIp(ip, ipHashSalt as string)

	let counts: Awaited<ReturnType<typeof getCountsFor>>
	let likedByMe: Awaited<ReturnType<typeof getLikedByIp>>
	try {
		counts = await getCountsFor(links)
		likedByMe = await getLikedByIp(ipHash, links)
	}
	catch (err) {
		if (!isMissingEdgeKvBindingError(err))
			throw err
		counts = {}
		likedByMe = {}
	}

	return { counts, likedByMe }
})
