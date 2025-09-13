import type { Article } from '~/types/article'

/**
 * 内容统计信息接口
 */
export interface ContentStats {
	/** 文章总数 */
	total: number
	/** 已发布文章数 */
	published: number
	/** 草稿数 */
	drafts: number
	/** 按分类统计 */
	byCategory: Record<string, number>
	/** 按标签统计 */
	byTag: Record<string, number>
	/** 按类型统计 */
	byType: Record<string, number>
}

/**
 * 内容状态接口
 */
export interface ContentState {
	/** 文章列表 */
	posts: Article[]
	/** 统计信息 */
	stats: ContentStats
	/** 加载状态 */
	loading: boolean
	/** 错误信息 */
	error: string | null
	/** 最后更新时间 */
	lastUpdated: Date | null
}

/**
 * 内容管理 Store
 * 负责管理文章数据、统计信息和相关操作
 */
export const useContentStore = defineStore('content', () => {
	// ========== 状态 ==========
	const posts = ref<Article[]>([])
	const stats = ref<ContentStats>({
		total: 0,
		published: 0,
		drafts: 0,
		byCategory: {},
		byTag: {},
		byType: {},
	})
	const loading = ref(false)
	const error = ref<string | null>(null)
	const lastUpdated = ref<Date | null>(null)

	// ========== 计算属性 ==========
	/** 已发布的文章 */
	const publishedPosts = computed(() => posts.value.filter(p => !p.draft))
	/** 草稿文章 */
	const draftPosts = computed(() => posts.value.filter(p => p.draft))
	/** 精选文章 */
	const featuredPosts = computed(() => posts.value.filter(p => p.featured && !p.draft))

	// 通用分组函数
	const groupPostsBy = (getter: (post: Article) => string[]) => {
		const grouped: Record<string, Article[]> = {}
		publishedPosts.value.forEach((post) => {
			getter(post).forEach((key) => {
				if (!grouped[key]) {
					grouped[key] = []
				}
				grouped[key].push(post)
			})
		})
		return grouped
	}

	// 按分类分组的文章
	const postsByCategory = computed(() =>
		groupPostsBy(post => post.categories || []),
	)

	// 按标签分组的文章
	const postsByTag = computed(() =>
		groupPostsBy(post => post.tags || []),
	)

	// 按类型分组的文章
	const postsByType = computed(() =>
		groupPostsBy(post => [post.type || 'tech']),
	)

	// 获取分类下的文章
	const getPostsByCategory = (category: string) => {
		return postsByCategory.value[category] || []
	}

	// 获取标签下的文章
	const getPostsByTag = (tag: string) => {
		return postsByTag.value[tag] || []
	}

	// 获取类型下的文章
	const getPostsByType = (type: string) => {
		return postsByType.value[type] || []
	}

	// 搜索文章
	const searchPosts = (query: string) => {
		if (!query.trim())
			return publishedPosts.value

		const lowerQuery = query.toLowerCase()
		return publishedPosts.value.filter(post =>
			(post.title || '').toLowerCase().includes(lowerQuery)
			|| (post.description || '').toLowerCase().includes(lowerQuery)
			|| post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
			|| post.categories?.some(cat => cat.toLowerCase().includes(lowerQuery)),
		)
	}

	// 更新统计信息
	const updateStats = () => {
		stats.value = {
			total: posts.value.length,
			published: publishedPosts.value.length,
			drafts: draftPosts.value.length,
			byCategory: Object.fromEntries(
				Object.entries(postsByCategory.value).map(([cat, posts]) => [cat, posts.length]),
			),
			byTag: Object.fromEntries(
				Object.entries(postsByTag.value).map(([tag, posts]) => [tag, posts.length]),
			),
			byType: Object.fromEntries(
				Object.entries(postsByType.value).map(([type, posts]) => [type, posts.length]),
			),
		}
	}

	// 设置文章数据
	const setPosts = (newPosts: Article[]) => {
		// 按发布日期排序（最新的在前）
		const sortedPosts = [...newPosts].sort((a, b) => {
			const dateA = a.date ? new Date(a.date) : new Date(0)
			const dateB = b.date ? new Date(b.date) : new Date(0)
			return dateB.getTime() - dateA.getTime() // 降序排列，最新的在前
		})

		posts.value = sortedPosts
		updateStats()
		lastUpdated.value = new Date()
	}

	// 添加文章
	const addPost = (post: Article) => {
		posts.value.push(post)
		updateStats()
		lastUpdated.value = new Date()
	}

	// 更新文章
	const updatePost = (path: string, updates: Partial<Article>) => {
		const index = posts.value.findIndex(p => p.path === path)
		if (index !== -1) {
			posts.value[index] = { ...posts.value[index], ...updates } as Article
			updateStats()
			lastUpdated.value = new Date()
		}
	}

	// 删除文章
	const removePost = (path: string) => {
		const index = posts.value.findIndex(p => p.path === path)
		if (index !== -1) {
			posts.value.splice(index, 1)
			updateStats()
			lastUpdated.value = new Date()
		}
	}

	// 设置加载状态
	const setLoading = (isLoading: boolean) => {
		loading.value = isLoading
	}

	// 设置错误
	const setError = (errorMessage: string | null) => {
		error.value = errorMessage
	}

	// 清除错误
	const clearError = () => {
		error.value = null
	}

	// 重置状态
	const reset = () => {
		posts.value = []
		stats.value = {
			total: 0,
			published: 0,
			drafts: 0,
			byCategory: {},
			byTag: {},
			byType: {},
		}
		loading.value = false
		error.value = null
		lastUpdated.value = null
	}

	return {
		// 状态
		posts,
		stats,
		loading,
		error,
		lastUpdated,

		// 计算属性
		publishedPosts,
		draftPosts,
		featuredPosts,
		postsByCategory,
		postsByTag,
		postsByType,

		// 方法
		getPostsByCategory,
		getPostsByTag,
		getPostsByType,
		searchPosts,
		setPosts,
		addPost,
		updatePost,
		removePost,
		setLoading,
		setError,
		clearError,
		reset,
		updateStats,
	}
})
