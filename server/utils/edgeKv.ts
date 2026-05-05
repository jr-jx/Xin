import { createHash } from 'node:crypto'
import process from 'node:process'
import blogConfig from '../../blog.config'

interface EdgeOneKvBinding {
	get: (key: string) => Promise<unknown>
	put: (key: string, value: string) => Promise<unknown>
	delete?: (key: string) => Promise<unknown>
	remove?: (key: string) => Promise<unknown>
}

interface EdgeKvProxyOperation {
	action: 'get' | 'put' | 'delete'
	key: string
	value?: string
}

interface EdgeKvProxyOperationResult {
	ok: boolean
	value?: unknown
	error?: string
}

interface EdgeKvProxyResponse {
	ok: boolean
	results?: EdgeKvProxyOperationResult[]
	error?: string
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
type EdgeKvMode = 'direct' | 'proxy' | 'local' | 'missing'

const LOCAL_STORE = 'edgeone-kv-local'
const KEY_PREFIX = 'xin'
const PROXY_PATH = '/api/__edge-kv'

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
	return message.includes('binding is not configured') || message.includes('KV proxy is not configured')
}

function isKvBinding(value: unknown): value is EdgeOneKvBinding {
	return !!value && typeof value === 'object' && typeof (value as EdgeOneKvBinding).get === 'function' && typeof (value as EdgeOneKvBinding).put === 'function'
}

function requestContextBinding(bucket: EdgeKvBucket): EdgeKvBindingLookup {
	const name = BINDING_NAMES[bucket]
	return { binding: null, source: `missing:${name}` }
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

function proxySecret(): string {
	const config = useRuntimeConfig()
	return String(config.edgeKvProxySecret || process.env.EDGE_KV_PROXY_SECRET || '')
}

function canUseProxy(): boolean {
	return !shouldUseLocalFallback() && !!proxySecret()
}

function proxyUrl(): string {
	const origin = process.env.NUXT_EDGE_KV_PROXY_ORIGIN || process.env.URL || blogConfig.site.url
	return new URL(PROXY_PATH, origin).toString()
}

async function proxyKvOperations(bucket: EdgeKvBucket, operations: EdgeKvProxyOperation[]): Promise<EdgeKvProxyOperationResult[]> {
	const secret = proxySecret()
	if (!secret)
		throw createError({ statusCode: 500, statusMessage: 'KV proxy is not configured' })

	const response = await $fetch<EdgeKvProxyResponse>(proxyUrl(), {
		method: 'POST',
		body: { bucket, operations },
		headers: {
			'x-edge-kv-secret': secret,
		},
		ignoreResponseError: true,
		retry: 0,
	})

	if (!response?.ok)
		throw createError({ statusCode: 500, statusMessage: response?.error || `${BINDING_NAMES[bucket]} binding is not configured` })

	const results = response.results || []
	const failed = results.find(result => !result.ok)
	if (failed)
		throw createError({ statusCode: 500, statusMessage: failed.error || 'KV proxy operation failed' })

	return results
}

async function proxyGetItem<T>(bucket: EdgeKvBucket, keys: string[]): Promise<T | null> {
	const results = await proxyKvOperations(bucket, keys.map(key => ({ action: 'get', key })))
	for (const result of results) {
		if (result.value != null)
			return decodeValue<T>(result.value)
	}
	return null
}

async function proxySetItem(bucket: EdgeKvBucket, key: string, value: unknown): Promise<void> {
	await proxyKvOperations(bucket, [{ action: 'put', key, value: encodeValue(value) }])
}

async function proxyRemoveItems(bucket: EdgeKvBucket, keys: string[]): Promise<void> {
	await proxyKvOperations(bucket, keys.map(key => ({ action: 'delete', key })))
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
	const mode: EdgeKvMode = binding
		? 'direct'
		: shouldUseLocalFallback()
			? 'local'
			: canUseProxy()
				? 'proxy'
				: 'missing'
	return {
		bucket,
		bindingName: BINDING_NAMES[bucket],
		available: mode !== 'missing',
		mode,
		source: source || (mode === 'proxy' ? PROXY_PATH : mode === 'local' ? LOCAL_STORE : ''),
		methods: bindingMethods(binding),
		localFallback: shouldUseLocalFallback(),
		proxyConfigured: canUseProxy(),
	}
}

export async function probeEdgeKvBinding(bucket: EdgeKvBucket): Promise<{
	bucket: EdgeKvBucket
	bindingName: string
	available: boolean
	mode: EdgeKvMode
	source: string
	methods: string[]
	localFallback: boolean
	proxyConfigured: boolean
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

	const key = safeKey(bucket, 'diag', `${Date.now()}_${Math.random().toString(36).slice(2)}`)
	const value = encodeValue({ ok: true })

	if (!binding) {
		if (shouldUseLocalFallback()) {
			try {
				await localStorage().setItem(key, value)
				result.writeOk = true
				result.readOk = (await localStorage().getItem(key)) != null
				await localStorage().removeItem(key)
				result.deleteOk = true
				return result
			}
			catch (err) {
				return {
					...result,
					error: err instanceof Error ? err.message : String(err),
				}
			}
		}

		if (canUseProxy()) {
			try {
				const results = await proxyKvOperations(bucket, [
					{ action: 'put', key, value },
					{ action: 'get', key },
					{ action: 'delete', key },
				])
				result.writeOk = !!results[0]?.ok
				result.readOk = results[1]?.value != null
				result.deleteOk = !!results[2]?.ok
				return result
			}
			catch (err) {
				return {
					...result,
					error: err instanceof Error ? err.message : String(err),
				}
			}
		}

		return { ...result, error: `${BINDING_NAMES[bucket]} binding is not configured` }
	}

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

			const fallbackKeys = bucket === 'comments'
				? [fullKey, legacySafeKey(namespace, key)]
				: [fullKey]

			if (!shouldUseLocalFallback()) {
				if (canUseProxy())
					return proxyGetItem<T>(bucket, fallbackKeys)
				throw missingBindingError(bucket)
			}

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

			if (!shouldUseLocalFallback()) {
				if (canUseProxy()) {
					await proxySetItem(bucket, fullKey, value)
					return
				}
				throw missingBindingError(bucket)
			}

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

			const fallbackKeys = bucket === 'comments'
				? [fullKey, legacySafeKey(namespace, key)]
				: [fullKey]

			if (!shouldUseLocalFallback()) {
				if (canUseProxy()) {
					await proxyRemoveItems(bucket, fallbackKeys)
					return
				}
				throw missingBindingError(bucket)
			}

			await localStorage().removeItem(fullKey)
			if (bucket === 'comments') {
				await localStorage().removeItem(legacySafeKey(namespace, key))
				await localStorage().removeItem(legacyPrefixed(namespace, key))
			}
		},
	}
}
