import type { Article } from '~/types/article'
import { defineStore } from 'pinia'

export interface SearchResult extends Article {
	score: number
	matchedFields: string[]
	excerpt?: string
}

export const useSearchStore = defineStore('search', () => {
	// 状态 - 确保服务端渲染时的初始状态
	const isSearchOpen = ref(false)
	const searchQuery = ref('')
	const searchResults = ref<SearchResult[]>([])
	const isSearching = ref(false)
	const allPosts = ref<Article[]>([])
	const searchTime = ref(0)

	// 计算属性
	const hasResults = computed(() => searchResults.value.length > 0)
	const hasQuery = computed(() => searchQuery.value.trim().length > 0)

	// 从文章内容中提取文本
	const extractTextFromBody = (children: any[]): string => {
		let text = ''

		const traverse = (nodes: any[]) => {
			nodes.forEach((node) => {
				if (node.type === 'text') {
					text += `${node.value} `
				}
				else if (node.children) {
					traverse(node.children)
				}
			})
		}

		traverse(children)
		return text
	}

	// 生成搜索结果摘要
	const generateExcerpt = (content: string, searchTerm: string): string => {
		const index = content.toLowerCase().indexOf(searchTerm.toLowerCase())
		if (index === -1)
			return `${content.substring(0, 150)}...`

		const start = Math.max(0, index - 75)
		const end = Math.min(content.length, index + searchTerm.length + 75)

		let excerpt = content.substring(start, end)
		if (start > 0)
			excerpt = `...${excerpt}`
		if (end < content.length)
			excerpt = `${excerpt}...`

		return excerpt
	}

	// 执行搜索逻辑
	const performSearch = (query: string, posts: Article[]): SearchResult[] => {
		const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
		const results: SearchResult[] = []

		posts.forEach((post) => {
			let score = 0
			const matchedFields: string[] = []
			let excerpt = ''

			// 搜索标题 (权重: 3)
			if (post.title) {
				const titleMatches = searchTerms.filter(term =>
					post.title!.toLowerCase().includes(term),
				).length
				if (titleMatches > 0) {
					score += titleMatches * 3
					matchedFields.push('title')
				}
			}

			// 搜索描述 (权重: 2)
			if (post.description) {
				const descMatches = searchTerms.filter(term =>
					post.description!.toLowerCase().includes(term),
				).length
				if (descMatches > 0) {
					score += descMatches * 2
					matchedFields.push('description')
					excerpt = post.description
				}
			}

			// 搜索标签 (权重: 2)
			if (post.tags && post.tags.length > 0) {
				const tagMatches = searchTerms.filter(term =>
					post.tags!.some(tag => tag.toLowerCase().includes(term)),
				).length
				if (tagMatches > 0) {
					score += tagMatches * 2
					matchedFields.push('tags')
				}
			}

			// 搜索分类 (权重: 2)
			if (post.categories && post.categories.length > 0) {
				const categoryMatches = searchTerms.filter(term =>
					post.categories!.some(cat => cat.toLowerCase().includes(term)),
				).length
				if (categoryMatches > 0) {
					score += categoryMatches * 2
					matchedFields.push('categories')
				}
			}

			// 搜索内容 (权重: 1)
			if (post.body && (post.body as any).children) {
				const contentText = extractTextFromBody((post.body as any).children)
				const contentMatches = searchTerms.filter(term =>
					contentText.toLowerCase().includes(term),
				).length
				if (contentMatches > 0) {
					score += contentMatches * 1
					matchedFields.push('content')
					if (!excerpt && searchTerms[0]) {
						excerpt = generateExcerpt(contentText, searchTerms[0])
					}
				}
			}

			// 如果有匹配，添加到结果中
			if (score > 0) {
				results.push({
					...post,
					score,
					matchedFields,
					excerpt: excerpt || post.description || '',
				})
			}
		})

		// 按分数排序
		return results.sort((a, b) => b.score - a.score)
	}

	// 搜索函数
const searchPosts = async (query: string) => {
	if (!query.trim()) {
		searchResults.value = []
		searchTime.value = 0
		return
	}

	isSearching.value = true
	const startTime = performance.now()

	try {
		// 如果还没有加载所有文章，先加载
		if (allPosts.value.length === 0) {
			const response = await $fetch<{ data: Article[], total: number }>('/api/search/posts')
			allPosts.value = response.data || []
		}

		// 确保allPosts有数据
		if (allPosts.value.length === 0) {
			// 降级方案：尝试从content store获取文章数据
			try {
				const { useContentStore } = await import('~/stores/content')
				const contentStore = useContentStore()
				if (contentStore.posts && contentStore.posts.length > 0) {
					allPosts.value = contentStore.posts
				}
			} catch (importError) {
				console.warn('无法加载content store:', importError)
			}
		}

		// 执行搜索
		const results = performSearch(query, allPosts.value)
		searchResults.value = results

		// 计算搜索时间
		const endTime = performance.now()
		searchTime.value = Math.round(endTime - startTime)
	}
	catch (error) {
		console.error('搜索失败:', error)
		searchResults.value = []
		searchTime.value = 0
	}
	finally {
		isSearching.value = false
	}
}

	// 防抖搜索
	let debounceTimer: NodeJS.Timeout | null = null
	const debouncedSearch = (query: string) => {
		if (debounceTimer) {
			clearTimeout(debounceTimer)
		}
		debounceTimer = setTimeout(() => {
			searchPosts(query)
		}, 300)
	}

	// 监听搜索查询变化
	watch(searchQuery, (newQuery) => {
		if (newQuery.trim()) {
			debouncedSearch(newQuery)
		}
		else {
			searchResults.value = []
		}
	})

	// 操作函数
	const openSearch = () => {
		isSearchOpen.value = true
		// 只在客户端执行 DOM 操作
		if (import.meta.client) {
			nextTick(() => {
				// 聚焦搜索输入框
				const searchInput = document.querySelector('#search-input') as HTMLInputElement
				if (searchInput) {
					searchInput.focus()
				}
			})
		}
	}

	const closeSearch = () => {
		isSearchOpen.value = false
		searchQuery.value = ''
		searchResults.value = []
	}

	const clearSearch = () => {
		searchQuery.value = ''
		searchResults.value = []
	}

	return {
		// 状态
		isSearchOpen,
		searchQuery,
		searchResults,
		isSearching,
		searchTime,

		// 计算属性
		hasResults,
		hasQuery,

		// 操作函数
		openSearch,
		closeSearch,
		clearSearch,
		searchPosts,
	}
})
