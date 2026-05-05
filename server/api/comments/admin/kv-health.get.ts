import { requireAdmin } from '../../../utils/adminAuth'
import { getEdgeKvBindingStatus, probeEdgeKvBinding } from '../../../utils/edgeKv'

export default defineEventHandler(async (event) => {
	requireAdmin(event)

	const query = getQuery(event)
	const write = query.write === '1' || query.write === 'true'
	const buckets = ['comments', 'friends'] as const

	return {
		write,
		buckets: write
			? await Promise.all(buckets.map(bucket => probeEdgeKvBinding(bucket)))
			: buckets.map(bucket => getEdgeKvBindingStatus(bucket)),
	}
})
