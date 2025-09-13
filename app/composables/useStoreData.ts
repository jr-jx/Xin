/**
 * 通用 Store 数据访问组合函数
 */
import { storeToRefs } from 'pinia'

/**
 * 内容相关数据访问器
 */
export function useContentData() {
	const contentStore = useContentStore()
	const statsStore = useStatsStore()

	return {
		// Content store 数据
		...storeToRefs(contentStore),
		// Stats store 数据
		...storeToRefs(statsStore),
		// 计算属性
		publishedPosts: computed(() => contentStore.publishedPosts),
		postsByCategory: computed(() => contentStore.postsByCategory),
		postsByTag: computed(() => contentStore.postsByTag),
		hasData: computed(() => contentStore.posts.length > 0),
	}
}

/**
 * 评论相关数据访问器
 */
export function useCommentsData() {
	const commentsStore = useCommentsStore()
	return storeToRefs(commentsStore)
}

/**
 * UI 相关数据访问器
 */
export function useUIData() {
	const uiStore = useUiStore()
	return storeToRefs(uiStore)
}
