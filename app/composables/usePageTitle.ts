export function usePageTitle() {
	const route = useRoute()

	const updateTitle = (title?: string, description?: string) => {
		useSeoMeta({
			title,
			description,
			ogTitle: title,
			ogDescription: description,
			twitterTitle: title,
			twitterDescription: description,
		})
	}

	const updateTitleFromContent = (content: { title?: string, description?: string } | null) => {
		if (content) {
			updateTitle(content.title, content.description)
		}
	}

	const updateTitleFromRoute = () => {
		const routeTitle = getRouteTitle(route.path)
		updateTitle(routeTitle)
	}

	function getRouteTitle(path: string): string {
		const titleMap: Record<string, string> = {
			'/': '首页',
			'/about': '关于我们',
			'/blog': '博客文章',
			'/contact': '联系我们',
		}

		return titleMap[path] || '页面'
	}

	const watchRouteAndUpdateTitle = () => {
		watch(() => route.path, () => {
			updateTitleFromRoute()
		})
	}

	return {
		updateTitle,
		updateTitleFromContent,
		updateTitleFromRoute,
		getRouteTitle,
		watchRouteAndUpdateTitle,
	}
}
