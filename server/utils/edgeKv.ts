import { createHash } from 'node:crypto'
import process from 'node:process'

interface EdgeOneKvBinding {
	get: (key: string) => Promise<unknown>
	put: (key: string, value: string) => Promise<unknown>
	delete?: (key: string) => Promise<unknown>
	remove?: (key: string) => Promise<unknown>
}

declare global {
	// EdgeOne Pages injects KV bindings as global variables in functions.
	// eslint-disable-next-line vars-on-top
	var XIN_COMMENTS_KV: EdgeOneKvBinding | undefined
	// eslint-disable-next-line vars-on-top
	var XIN_FRIENDS_KV: EdgeOneKvBinding | undefined
	// Keep my_kv as a compatibility fallback for local examples/templates.
	// eslint-disable-next-line vars-on-top
	var my_kv: EdgeOneKvBinding | undefined
}

type EdgeKvBucket = 'comments' | 'friends'

const LOCAL_STORE = 'edgeone-kv-local'
const KEY_PREFIX = 'xin'

const BINDING_NAMES: Record<EdgeKvBucket, 'XIN_COMMENTS_KV' | 'XIN_FRIENDS_KV'> = {
	comments: 'XIN_COMMENTS_KV',
	friends: 'XIN_FRIENDS_KV',
}

interface EdgeKvBindingLookup {
	binding: EdgeOneKvBinding | null
	source: string
}

function isEdgeOneRuntime(): boolean {
	return !!(process.env.EDGEONE || process.env.EDGEONE_PAGES || process.env.TENCENTCLOUD_RUNENV === 'SCF')
}

function shouldUseLocalFallback(): boolean {
	return import.meta.dev && !isEdgeOneRuntime()
}

function missingBindingError(bucket: EdgeKvBucket) {
	return createError({ statusCode: 500, statusMessage: `${BINDING_NAMES[bucket]} binding is not configured` })
}

export function isMissingEdgeKvBindingError(err: unknown): boolean {
	const message = err instanceof Error ? err.message : String(err)
	return message.includes('binding is not configured')
}

function isKvBinding(value: unknown): value is EdgeOneKvBinding {
	return !!value && typeof value === 'object' && typeof (value as EdgeOneKvBinding).get === 'function' && typeof (value as EdgeOneKvBinding).put === 'function'
}

function requestContextBinding(bucket: EdgeKvBucket): EdgeKvBindingLookup {
	const event = useRequestEvent()
	const name = BINDING_NAMES[bucket]
	const context = event?.context as Record<string, any> | undefined
	const candidates: Array<[string, unknown]> = [
		[`event.context.env.${name}`, context?.env?.[name]],
		[`event.context.edgeone.env.${name}`, context?.edgeone?.env?.[name]],
		[`event.context.cloudflare.env.${name}`, context?.cloudflare?.env?.[name]],
		[`event.context.platform.env.${name}`, context?.platform?.env?.[name]],
		[`event.context.${name}`, context?.[name]],
	]

	for (const [source, value] of candidates) {
		if (isKvBinding(value))
			return { binding: value, source }
	}

	return { binding: null, source: '' }
}

function kvBindingLookup(bucket: EdgeKvBucket): EdgeKvBindingLookup {
	if (bucket === 'friends') {
		if (isKvBinding(globalThis.XIN_FRIENDS_KV))
			return { binding: globalThis.XIN_FRIENDS_KV, source: 'globalThis.XIN_FRIENDS_KV' }
		if (typeof XIN_FRIENDS_KV !== 'undefined' && isKvBinding(XIN_FRIENDS_KV))
			return { binding: XIN_FRIENDS_KV, source: 'XIN_FRIENDS_KV' }
		return requestContextBinding(bucket)
	}
	if (isKvBinding(globalThis.XIN_COMMENTS_KV))
		return { binding: globalThis.XIN_COMMENTS_KV, source: 'globalThis.XIN_COMMENTS_KV' }
	if (typeof XIN_COMMENTS_KV !== 'undefined' && isKvBinding(XIN_COMMENTS_KV))
		return { binding: XIN_COMMENTS_KV, source: 'XIN_COMMENTS_KV' }
	if (isKvBinding(globalThis.my_kv))
		return { binding: globalThis.my_kv, source: 'globalThis.my_kv' }
	if (typeof my_kv !== 'undefined' && isKvBinding(my_kv))
		return { binding: my_kv, source: 'my_kv' }
	return requestContextBinding(bucket)
}

function kvBinding(bucket: EdgeKvBucket): EdgeOneKvBinding | null {
	return kvBindingLookup(bucket).binding
}

function localStorage() {
	return useStorage(LOCAL_STORE)
}

function legacyPrefixed(namespace: string, key: string): string {
	return `${namespace}:${key}`
}

function safePart(value: string): string {
	return value.replace(/\W/g, '_')
}

function safeKey(bucket: EdgeKvBucket, namespace: string, key: string): string {
	const raw = `${bucket}:${namespace}:${key}`
	const readable = `${KEY_PREFIX}_${safePart(bucket)}_${safePart(namespace)}_${safePart(key)}`
	if (readable.length <= 512)
		return readable

	const hash = createHash('sha1').update(raw).digest('hex')
	return `${KEY_PREFIX}_${safePart(bucket)}_${safePart(namespace).slice(0, 80)}_${hash}`
}

function legacySafeKey(namespace: string, key: string): string {
	const raw = `${namespace}:${key}`
	const readable = `${KEY_PREFIX}_${safePart(namespace)}_${safePart(key)}`
	if (readable.length <= 512)
		return readable

	const hash = createHash('sha1').update(raw).digest('hex')
	return `${KEY_PREFIX}_${safePart(namespace).slice(0, 80)}_${hash}`
}

function decodeValue<T>(value: unknown): T | null {
	if (value == null)
		return null
	if (typeof value !== 'string')
		return value as T
	try {
		return JSON.parse(value) as T
	}
	catch {
		return value as T
	}
}

function encodeValue(value: unknown): string {
	return JSON.stringify(value)
}

function bindingMethods(binding: EdgeOneKvBinding | null): string[] {
	if (!binding)
		return []
	return ['get', 'put', 'delete', 'remove'].filter(method => typeof binding[method as keyof EdgeOneKvBinding] === 'function')
}

export function getEdgeKvBindingStatus(bucket: EdgeKvBucket) {
	const { binding, source } = kvBindingLookup(bucket)
	return {
		bucket,
		bindingName: BINDING_NAMES[bucket],
		available: !!binding,
		source,
		methods: bindingMethods(binding),
		localFallback: shouldUseLocalFallback(),
	}
}

export async function probeEdgeKvBinding(bucket: EdgeKvBucket): Promise<{
	bucket: EdgeKvBucket
	bindingName: string
	available: boolean
	source: string
	methods: string[]
	writeOk: boolean
	readOk: boolean
	deleteOk: boolean
	error?: string
}> {
	const binding = kvBinding(bucket)
	const status = getEdgeKvBindingStatus(bucket)
	const result = {
		...status,
		writeOk: false,
		readOk: false,
		deleteOk: false,
	}

	if (!binding)
		return { ...result, error: `${BINDING_NAMES[bucket]} binding is not configured` }

	const key = safeKey(bucket, 'diag', `${Date.now()}_${Math.random().toString(36).slice(2)}`)
	const value = encodeValue({ ok: true })
	try {
		await binding.put(key, value)
		result.writeOk = true
		result.readOk = (await binding.get(key)) != null
		if (typeof binding.delete === 'function') {
			await binding.delete(key)
			result.deleteOk = true
		}
		else if (typeof binding.remove === 'function') {
			await binding.remove(key)
			result.deleteOk = true
		}
		else {
			result.deleteOk = false
		}
		return result
	}
	catch (err) {
		return {
			...result,
			error: err instanceof Error ? err.message : String(err),
		}
	}
}

export function getEdgeKvStore(namespace: string, bucket: EdgeKvBucket = 'comments') {
	return {
		async getItem<T>(key: string): Promise<T | null> {
			const fullKey = safeKey(bucket, namespace, key)
			const binding = kvBinding(bucket)
			if (binding) {
				const value = await binding.get(fullKey)
				if (value != null)
					return decodeValue<T>(value)
				if (bucket === 'comments')
					return decodeValue<T>(await binding.get(legacySafeKey(namespace, key)))
				return null
			}

			if (!shouldUseLocalFallback())
				throw missingBindingError(bucket)

			return (await localStorage().getItem<T>(fullKey))
				?? (bucket === 'comments' ? await localStorage().getItem<T>(legacySafeKey(namespace, key)) : null)
				?? (bucket === 'comments' ? await localStorage().getItem<T>(legacyPrefixed(namespace, key)) : null)
				?? null
		},

		async setItem(key: string, value: unknown): Promise<void> {
			const fullKey = safeKey(bucket, namespace, key)
			const binding = kvBinding(bucket)
			if (binding) {
				await binding.put(fullKey, encodeValue(value))
				return
			}

			if (!shouldUseLocalFallback())
				throw missingBindingError(bucket)

			await localStorage().setItem(fullKey, value)
		},

		async removeItem(key: string): Promise<void> {
			const fullKey = safeKey(bucket, namespace, key)
			const binding = kvBinding(bucket)
			if (binding) {
				if (typeof binding.delete === 'function')
					await binding.delete(fullKey)
				else if (typeof binding.remove === 'function')
					await binding.remove(fullKey)
				else
					await binding.put(fullKey, '')
				if (bucket === 'comments') {
					const legacyKey = legacySafeKey(namespace, key)
					if (typeof binding.delete === 'function')
						await binding.delete(legacyKey)
					else if (typeof binding.remove === 'function')
						await binding.remove(legacyKey)
				}
				return
			}

			if (!shouldUseLocalFallback())
				throw missingBindingError(bucket)

			await localStorage().removeItem(fullKey)
			if (bucket === 'comments') {
				await localStorage().removeItem(legacySafeKey(namespace, key))
				await localStorage().removeItem(legacyPrefixed(namespace, key))
			}
		},
	}
}
