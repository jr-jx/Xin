import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useContentStore } from '~/stores/content'
import { useStatsStore } from '~/stores/stats'

export function useSiteStats() {
	const contentStore = useContentStore()
	const statsStore = useStatsStore()

	// 从 stores 获取数据
	const { posts } = storeToRefs(contentStore)
	const { tags, stats, tagCountMap, categoriesCount, estimatedWords } = storeToRefs(statsStore)

	// 检查是否有数据
	const hasData = computed(() => posts.value.length > 0)

	// 调试信息
	const debugInfo = computed(() => ({
		postsCount: posts.value.length,
		tagsCount: tags.value.length,
		statsValid: !!stats.value.articles,
	}))

	// 同步数据到 stats store
	const syncStats = () => {
		statsStore.setPosts(posts.value)
	}

	// 监听 posts 变化，自动同步到 stats store
	watch(posts, (newPosts) => {
		if (newPosts && newPosts.length > 0) {
			statsStore.setPosts(newPosts)
		}
	}, { immediate: true })

	// 清空统计数据
	const clearStats = () => {
		statsStore.clearStats()
	}

	return {
		// 状态
		hasData,
		debugInfo,

		// 统计信息
		tags,
		stats,
		tagCountMap,
		categoriesCount,
		estimatedWords,

		// 方法
		syncStats,
		clearStats,
	}
}
