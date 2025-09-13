import type { Ref } from 'vue'
import type { Article } from '~/types/article'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export interface TagStat {
	name: string
	count: number
}

export interface SiteStats {
	articles: number
	tags: number
	categories: number
	words: string
}

export const useStatsStore = defineStore('stats', () => {
	// 原始数据
	const posts: Ref<Article[]> = ref([])

	// 通用统计函数
	const createCountMap = (getter: (post: Article) => string[]) => {
		const map = new Map<string, number>()
		posts.value.forEach((post) => {
			getter(post).forEach(key => map.set(key, (map.get(key) || 0) + 1))
		})
		return map
	}

	// 计算属性：标签统计映射
	const tagCountMap = computed<Map<string, number>>(() =>
		createCountMap(post => post.tags || []),
	)

	// 计算属性：标签列表（按数量排序，取前30个）
	const tags = computed<TagStat[]>(() =>
		Array.from(tagCountMap.value.entries())
			.map(([name, count]) => ({ name, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 30),
	)

	// 计算属性：分类数量
	const categoriesCount = computed(() => {
		const set = new Set<string>()
		posts.value.forEach(p => set.add((p.categories && p.categories[0]) || '未分类'))
		return set.size
	})

	// 字数估算函数
	function estimateWords(input: string) {
		const text = (input || '').trim()
		if (!text)
			return 0
		const cjkCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length
		const latinCount = text
			.replace(/[\u4E00-\u9FFF]/g, ' ')
			.trim()
			.split(/\s+/)
			.filter(Boolean)
			.length
		return cjkCount + latinCount
	}

	// 计算属性：总字数
	const estimatedWords = computed(() =>
		posts.value.reduce((sum, p) => {
			const text = p.body?.text || p.description || ''
			return sum + estimateWords(text)
		}, 0),
	)

	// 计算属性：完整统计信息
	const stats = computed<SiteStats>(() => ({
		articles: posts.value.length,
		tags: tagCountMap.value.size,
		categories: categoriesCount.value,
		words: new Intl.NumberFormat('zh-CN').format(estimatedWords.value),
	}))

	// 设置文章数据
	function setPosts(articles: Article[]) {
		posts.value = articles
	}

	// 清空数据
	function clearStats() {
		posts.value = []
	}

	return {
		// 状态
		posts,

		// 计算属性
		tags,
		stats,
		tagCountMap,
		categoriesCount,
		estimatedWords,

		// 方法
		setPosts,
		clearStats,
	}
})
