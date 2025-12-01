export default defineEventHandler(async (event) => {
	try {
		// 使用 queryCollection 获取文章数据（基于 content.config.ts 中的配置）
		const allPosts = await queryCollection(event, 'post')
			.where('stem', 'LIKE', 'posts/%') // 只获取 posts 目录下的文章
			.order('date', 'DESC') // 按日期降序排列
			.all()

		// 在 JavaScript 中过滤掉草稿文章
		const posts = allPosts.filter((post: any) => !post.draft)

		// 返回搜索需要的字段
		const searchablePosts = posts.map((post: any) => ({
			path: post._path || post.path,
			title: post.title,
			description: post.description,
			date: post.date,
			categories: post.categories || [],
			tags: post.tags || [],
			image: post.image,
			readingTime: post.readingTime,
			body: post.body, // 包含文章内容用于搜索
		}))

		return {
			data: searchablePosts,
			total: searchablePosts.length,
		}
	}
	catch (error) {
		console.error('获取搜索数据失败:', error)

		// 返回空数据而不是抛出错误，让搜索功能优雅降级
		return {
			data: [],
			total: 0,
		}
	}
})
