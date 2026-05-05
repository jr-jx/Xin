import { BINDING_NAMES, getBinding, isBinding, json } from '../../_shared/edge-core.js'

function getHeader(headers, name) {
	return headers.get(name) || headers.get(name.toLowerCase()) || ''
}

function getSecret(context) {
	return context?.env?.EDGE_KV_PROXY_SECRET || globalThis.EDGE_KV_PROXY_SECRET || ''
}

async function applyOperation(binding, operation) {
	if (!operation || typeof operation !== 'object')
		return { ok: false, error: 'invalid operation' }

	const { action, key } = operation
	if (typeof key !== 'string' || !key)
		return { ok: false, error: 'invalid key' }

	if (action === 'get') {
		const value = await binding.get(key)
		return { ok: true, value: value ?? null }
	}

	if (action === 'put') {
		if (typeof operation.value !== 'string')
			return { ok: false, error: 'invalid value' }
		await binding.put(key, operation.value)
		return { ok: true }
	}

	if (action === 'delete') {
		if (typeof binding.delete === 'function') {
			await binding.delete(key)
			return { ok: true, deleted: true }
		}
		if (typeof binding.remove === 'function') {
			await binding.remove(key)
			return { ok: true, deleted: true }
		}
		await binding.put(key, '')
		return { ok: true, deleted: false }
	}

	return { ok: false, error: 'invalid action' }
}

export async function onRequest(context) {
	const { request } = context
	if (request.method !== 'POST')
		return json({ ok: false, error: 'method not allowed' }, 405)

	const expectedSecret = getSecret(context)
	const actualSecret = getHeader(request.headers, 'x-edge-kv-secret')
	if (!expectedSecret || actualSecret !== expectedSecret)
		return json({ ok: false, error: 'unauthorized' }, 401)

	let body
	try {
		body = await request.json()
	}
	catch {
		return json({ ok: false, error: 'invalid json' }, 400)
	}

	const bucket = body?.bucket
	if (!Object.hasOwn(BINDING_NAMES, bucket))
		return json({ ok: false, error: 'invalid bucket' }, 400)

	const binding = getBinding(context, bucket)
	if (!isBinding(binding))
		return json({ ok: false, error: `${BINDING_NAMES[bucket]} binding is not configured` }, 500)

	const operations = Array.isArray(body?.operations) ? body.operations : []
	if (!operations.length)
		return json({ ok: false, error: 'operations required' }, 400)

	try {
		const results = []
		for (const operation of operations)
			results.push(await applyOperation(binding, operation))

		return json({ ok: true, results })
	}
	catch (err) {
		return json({ ok: false, error: err instanceof Error ? err.message : String(err) }, 500)
	}
}
