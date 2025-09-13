import type { RouteLocationNormalizedLoaded } from 'vue-router'

export type PageType = 'home' | 'post' | 'page' | 'category' | 'tag' | 'archive'

export interface PageInfo {
	type: PageType
	isArticle: boolean
	isContentPage: boolean
	hasToc: boolean
	path: string
}

export function usePageType(route?: RouteLocationNormalizedLoaded) {
	const currentRoute = route || useRoute()

	const pageInfo = computed<PageInfo>(() => {
		const path = currentRoute.path

		// 判断页面类型
		let type: PageType = 'page'
		let isArticle = false
		let isContentPage = false
		let hasToc = false

		// 首页
		if (path === '/') {
			type = 'home'
			isContentPage = false
			hasToc = false
		}
		// 文章页面
		else if (path.startsWith('/posts/')) {
			type = 'post'
			isArticle = true
			isContentPage = true
			hasToc = true
		}
		// 分类页面
		else if (path.startsWith('/categories/')) {
			type = 'category'
			isContentPage = true
			hasToc = false
		}
		// 标签页面
		else if (path.startsWith('/tags/')) {
			type = 'tag'
			isContentPage = true
			hasToc = false
		}
		// 归档页面
		else if (path.startsWith('/archives/')) {
			type = 'archive'
			isContentPage = true
			hasToc = false
		}
		// 其他页面（如 about、其他自定义页面）
		else {
			type = 'page'
			isContentPage = true
			hasToc = false
		}

		return {
			type,
			isArticle,
			isContentPage,
			hasToc,
			path,
		}
	})

	// 便捷的判断方法
	const isHome = computed(() => pageInfo.value.type === 'home')
	const isPost = computed(() => pageInfo.value.type === 'post')
	const isPage = computed(() => pageInfo.value.type === 'page')
	const isCategory = computed(() => pageInfo.value.type === 'category')
	const isTag = computed(() => pageInfo.value.type === 'tag')
	const isArchive = computed(() => pageInfo.value.type === 'archive')

	return {
		pageInfo,
		isHome,
		isPost,
		isPage,
		isCategory,
		isTag,
		isArchive,
		// 类型判断
		isArticle: computed(() => pageInfo.value.isArticle),
		isContentPage: computed(() => pageInfo.value.isContentPage),
		hasToc: computed(() => pageInfo.value.hasToc),
	}
}
