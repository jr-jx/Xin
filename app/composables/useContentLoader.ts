import type { Article } from '~/types/article'
import { storeToRefs } from 'pinia'
import { useContentStore } from '../stores/content'

/**
 * 内容加载器组合函数
 * 使用 Nuxt 4 的最佳实践，确保服务端和客户端数据一致
 */
export function useContentLoader() {
	const store = useContentStore()
	const { posts } = storeToRefs(store)

	// 使用 useAsyncData 确保服务端和客户端数据一致
	const { data: postsData, pending: postsPending, error: postsError, refresh: refreshPosts } = useAsyncData(
		'posts',
		async () => {
			try {
				// 使用 queryCollection 获取文章数据
				const rawPosts = await queryCollection('post')
					.all()
				return (rawPosts as Article[]).sort((a, b) => {
					const dateA = a.date ? new Date(a.date) : new Date(0)
					const dateB = b.date ? new Date(b.date) : new Date(0)
					return dateB.getTime() - dateA.getTime() // 降序排列，最新的在前
				})
			}
			catch (err) {
				console.error('Failed to load posts:', err)
				return []
			}
		},
		{
			// 关键配置：确保服务端和客户端数据一致
			server: true, // 在服务端执行
			default: () => [], // 默认值
			transform: data => data || [], // 数据转换
			immediate: true, // 立即执行
		},
	)

	// 创建自定义的加载状态，确保状态能够正确更新
	const isLoading = computed(() => {
		// 如果数据已经加载完成，则不再显示加载状态
		if (postsData.value && postsData.value.length > 0) {
			return false
		}
		// 否则显示加载状态
		return postsPending.value
	})

	// 监听数据变化，同步到 store
	watchEffect(() => {
		if (postsData.value && postsData.value.length > 0) {
			posts.value = postsData.value
		}
	})

	// 提供计算属性，确保数据一致性
	const publishedPosts = computed(() => postsData.value?.filter(p => !p.draft) || [])
	const featuredPosts = computed(() => postsData.value?.filter(p => p.featured && !p.draft) || [])
	const draftPosts = computed(() => postsData.value?.filter(p => p.draft) || [])

	// 按分类分组的文章
	const postsByCategory = computed(() => {
		const grouped: Record<string, Article[]> = {}
		publishedPosts.value.forEach((post) => {
			post.categories?.forEach((category) => {
				if (!grouped[category]) {
					grouped[category] = []
				}
				grouped[category].push(post)
			})
		})
		return grouped
	})

	// 按标签分组的文章
	const postsByTag = computed(() => {
		const grouped: Record<string, Article[]> = {}
		publishedPosts.value.forEach((post) => {
			post.tags?.forEach((tag) => {
				if (!grouped[tag]) {
					grouped[tag] = []
				}
				grouped[tag].push(post)
			})
		})
		return grouped
	})

	// 按类型分组的文章
	const postsByType = computed(() => {
		const grouped: Record<string, Article[]> = {}
		publishedPosts.value.forEach((post) => {
			const type = post.type || 'tech'
			if (!grouped[type]) {
				grouped[type] = []
			}
			grouped[type].push(post)
		})
		return grouped
	})

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

	// 获取文章统计
	const getStats = computed(() => ({
		total: postsData.value?.length || 0,
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
	}))

	return {
		// 状态
		posts: postsData,
		postsPending: isLoading, // 使用自定义的加载状态
		postsError,

		// 计算属性
		publishedPosts,
		featuredPosts,
		draftPosts,
		postsByCategory,
		postsByTag,
		postsByType,

		// 方法
		getPostsByCategory,
		getPostsByTag,
		getPostsByType,
		searchPosts,
		getStats,
		refreshPosts,
	}
}

/**
 * 获取文章类型样式类名
 */
export function getPostTypeClassName(type?: string, options = {
	prefix: 'text',
}) {
	if (!type)
		type = 'tech'

	const { prefix } = options
	return `${prefix}-${type}`
}
