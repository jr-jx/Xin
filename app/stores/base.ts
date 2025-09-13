/**
 * 通用 Store 基类
 */
import type { LoadingState } from '~/types/common'

export interface BaseStoreState extends LoadingState {
	lastUpdated: Date | null
}

export function createBaseStoreActions() {
	return {
		setLoading(_isLoading: boolean) {
			// 这个方法需要在具体的 store 中实现
		},
		setError(_errorMessage: string | null) {
			// 这个方法需要在具体的 store 中实现
		},
		clearError() {
			// 这个方法需要在具体的 store 中实现
		},
		updateLastUpdated() {
			// 这个方法需要在具体的 store 中实现
		},
		reset() {
			// 这个方法需要在具体的 store 中实现
		},
	}
}

// 通用错误处理
export function handleStoreError(error: unknown, setError: (error: string | null) => void) {
	const message = error instanceof Error ? error.message : '操作失败'
	setError(message)
	console.error('Store error:', error)
}

// 通用加载状态管理
export function withLoading<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	setLoading: (loading: boolean) => void,
	setError: (error: string | null) => void,
): T {
	return (async (...args: Parameters<T>) => {
		setLoading(true)
		setError(null)

		try {
			const result = await fn(...args)
			return result
		}
		catch (error) {
			handleStoreError(error, setError)
			throw error
		}
		finally {
			setLoading(false)
		}
	}) as T
}
