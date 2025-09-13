export default defineNuxtPlugin(() => {
	const route = useRoute()

	// 全局title管理
	const titleManager = {
		// 设置页面title
		setTitle(title: string, description?: string) {
			useSeoMeta({
				title,
				description: description || '个人博客网站',
				ogTitle: title,
				ogDescription: description || '个人博客网站',
				twitterTitle: title,
				twitterDescription: description || '个人博客网站',
			})
		},

		// 根据路由设置title
		setTitleFromRoute() {
			const currentRoute = route.path
			const routeTitle = this.getRouteTitle(currentRoute)
			this.setTitle(routeTitle)
		},

		// 获取路由对应的title
		getRouteTitle(path: string): string {
			const titleMap: Record<string, string> = {
				'/': '首页',
				'/about': '关于',
				'/blog': '博客',
				'/contact': '联系',
			}

			return titleMap[path] || '页面'
		},

		// 监听路由变化自动更新title
		watchRoute() {
			watch(() => route.path, () => {
				this.setTitleFromRoute()
			})
		},
	}

	// 提供全局访问
	return {
		provide: {
			titleManager,
		},
	}
})
