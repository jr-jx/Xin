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

function isEdgeOneRuntime(): boolean {
	return !!(process.env.EDGEONE || process.env.EDGEONE_PAGES || process.env.TENCENTCLOUD_RUNENV === 'SCF')
}

function kvBinding(bucket: EdgeKvBucket): EdgeOneKvBinding | null {
	if (bucket === 'friends') {
		return (
			globalThis.XIN_FRIENDS_KV
			|| (typeof XIN_FRIENDS_KV !== 'undefined' ? XIN_FRIENDS_KV : undefined)
			|| null
		)
	}
	return (
		globalThis.XIN_COMMENTS_KV
		|| (typeof XIN_COMMENTS_KV !== 'undefined' ? XIN_COMMENTS_KV : undefined)
		|| globalThis.my_kv
		|| (typeof my_kv !== 'undefined' ? my_kv : undefined)
		|| null
	)
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

			if (isEdgeOneRuntime())
				throw createError({ statusCode: 500, statusMessage: `${BINDING_NAMES[bucket]} binding is not configured` })

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

			if (isEdgeOneRuntime())
				throw createError({ statusCode: 500, statusMessage: `${BINDING_NAMES[bucket]} binding is not configured` })

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

			if (isEdgeOneRuntime())
				throw createError({ statusCode: 500, statusMessage: `${BINDING_NAMES[bucket]} binding is not configured` })

			await localStorage().removeItem(fullKey)
			if (bucket === 'comments') {
				await localStorage().removeItem(legacySafeKey(namespace, key))
				await localStorage().removeItem(legacyPrefixed(namespace, key))
			}
		},
	}
}
