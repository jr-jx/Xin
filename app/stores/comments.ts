import type { Comment } from '~/types/comment'
import type { LoadingState } from '~/types/common'
import { handleStoreError, withLoading } from './base'

export interface CommentsState extends LoadingState {
	comments: Comment[]
}

export const useCommentsStore = defineStore('comments', () => {
	// 状态
	const comments = ref<Comment[]>([])
	const loading = ref(false)
	const error = ref<string | null>(null)
	const lastUpdated = ref<Date | null>(null)

	// 计算属性
	const recentComments = computed(() => comments.value)
	const hasComments = computed(() => comments.value.length > 0)
	const commentsCount = computed(() => comments.value.length)

	// 状态管理方法
	const setLoading = (isLoading: boolean) => {
		loading.value = isLoading
	}

	const setError = (errorMessage: string | null) => {
		error.value = errorMessage
	}

	const updateLastUpdated = () => {
		lastUpdated.value = new Date()
	}

	// 获取最近评论（调用内置 API）
	const fetchRecentComments = withLoading(
		async (limit: number = 9, includeReply: boolean = false) => {
			try {
				const res = await $fetch<{ items: Comment[] }>('/api/comments/recent', {
					params: { limit, includeReply: includeReply ? 1 : 0 },
				})
				if (res?.items) {
					comments.value = res.items
					updateLastUpdated()
				}
			}
			catch (err) {
				handleStoreError(err, setError)
				throw err
			}
		},
		setLoading,
		setError,
	)

	// 清空评论
	const clearComments = () => {
		comments.value = []
		lastUpdated.value = null
		error.value = null
	}

	// 添加新评论
	const addComment = (comment: Comment) => {
		comments.value.unshift(comment)
		lastUpdated.value = new Date()
	}

	// 更新评论
	const updateComment = (id: string, updates: Partial<Comment>) => {
		const index = comments.value.findIndex(c => c.id === id)
		if (index !== -1) {
			comments.value[index] = { ...comments.value[index], ...updates } as Comment
			lastUpdated.value = new Date()
		}
	}

	// 删除评论
	const removeComment = (id: string) => {
		const index = comments.value.findIndex(c => c.id === id)
		if (index !== -1) {
			comments.value.splice(index, 1)
			lastUpdated.value = new Date()
		}
	}

	return {
		// 状态
		comments,
		loading,
		error,
		lastUpdated,

		// 计算属性
		recentComments,
		hasComments,
		commentsCount,

		// 方法
		fetchRecentComments,
		clearComments,
		addComment,
		updateComment,
		removeComment,
	}
})
