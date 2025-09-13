import { computed } from 'vue'
import { useContentStore } from '../stores/content'

/**
 * 导航相关的组合函数
 * 提供分类、标签、文章等导航功能
 */
export function useNavigation() {
	const contentStore = useContentStore()
	const { stats, postsByCategory, postsByTag, postsByType } = storeToRefs(contentStore)

	// 获取所有分类
	const categories = computed(() => {
		const categoryEntries = Object.entries(stats.value.byCategory)
		return categoryEntries.map(([name, count]) => ({
			name,
			count,
			slug: name,
			tip: `前往 ${name} 分类的文章`,
			path: `/categories/${name}`,
		}))
	})

	// 获取所有标签
	const tags = computed(() => {
		const tagEntries = Object.entries(stats.value.byTag)
		return tagEntries.map(([name, count]) => ({
			name,
			count,
			slug: name,
			tip: `查看包含 ${name} 标签的文章`,
			path: `/tags/${name}`,
		}))
	})

	// 获取所有文章类型
	const types = computed(() => {
		const typeEntries = Object.entries(stats.value.byType)
		return typeEntries.map(([name, count]) => ({
			name,
			count,
			slug: name,
			tip: `查看 ${name} 类型的文章`,
			path: `/types/${name}`,
		}))
	})

	// 获取精选分类
	const featuredCategory = computed(() => ({
		name: '精选',
		count: null,
		slug: 'featured',
		tip: '查看所有精选的文章',
		path: '/',
	}))

	// 获取完整的分类列表（包含精选）
	const allCategories = computed(() => [
		featuredCategory.value,
		...categories.value,
	])

	// 获取分类下的文章
	const getCategoryPosts = (categorySlug: string) => {
		if (categorySlug === 'featured') {
			return contentStore.featuredPosts
		}
		return postsByCategory.value[categorySlug] || []
	}

	// 获取标签下的文章
	const getTagPosts = (tagSlug: string) => {
		return postsByTag.value[tagSlug] || []
	}

	// 获取类型下的文章
	const getTypePosts = (typeSlug: string) => {
		return postsByType.value[typeSlug] || []
	}

	// 搜索导航
	const searchNavigation = (query: string) => {
		if (!query.trim())
			return []

		const lowerQuery = query.toLowerCase()
		const results: { type: string, relevance: number, name: string, count: number, slug: string, tip: string, path: string }[] = []

		// 搜索分类
		categories.value.forEach((category) => {
			if (category.name.toLowerCase().includes(lowerQuery)) {
				results.push({
					...category,
					type: 'category',
					relevance: category.name.toLowerCase().indexOf(lowerQuery),
				})
			}
		})

		// 搜索标签
		tags.value.forEach((tag) => {
			if (tag.name.toLowerCase().includes(lowerQuery)) {
				results.push({
					...tag,
					type: 'tag',
					relevance: tag.name.toLowerCase().indexOf(lowerQuery),
				})
			}
		})

		// 搜索文章类型
		types.value.forEach((type) => {
			if (type.name.toLowerCase().includes(lowerQuery)) {
				results.push({
					...type,
					type: 'type',
					relevance: type.name.toLowerCase().indexOf(lowerQuery),
				})
			}
		})

		// 按相关性排序
		return results.sort((a, b) => a.relevance - b.relevance)
	}

	// 获取面包屑导航
	const getBreadcrumbs = (path: string) => {
		const segments = path.split('/').filter(Boolean)
		const breadcrumbs = [{ name: '首页', path: '/' }]

		let currentPath = ''
		segments.forEach((segment, index) => {
			currentPath += `/${segment}`

			if (index === 0) {
				// 第一级：分类或标签
				if (segment === 'categories') {
					breadcrumbs.push({ name: '分类', path: '/categories' })
				}
				else if (segment === 'tags') {
					breadcrumbs.push({ name: '标签', path: '/tags' })
				}
				else if (segment === 'posts') {
					breadcrumbs.push({ name: '文章', path: '/posts' })
				}
			}
			else if (index === 1) {
				// 第二级：具体分类或标签名
				const name = decodeURIComponent(segment)
				breadcrumbs.push({ name, path: currentPath })
			}
		})

		return breadcrumbs
	}

	// 获取相关分类（基于当前分类）
	const getRelatedCategories = (currentCategory: string, limit = 5) => {
		return categories.value
			.filter(cat => cat.slug !== currentCategory)
			.sort((a, b) => (b.count || 0) - (a.count || 0))
			.slice(0, limit)
	}

	// 获取相关标签（基于当前标签）
	const getRelatedTags = (currentTag: string, limit = 5) => {
		return tags.value
			.filter(tag => tag.slug !== currentTag)
			.sort((a, b) => (b.count || 0) - (a.count || 0))
			.slice(0, limit)
	}

	return {
		// 导航数据
		categories,
		tags,
		types,
		featuredCategory,
		allCategories,

		// 获取方法
		getCategoryPosts,
		getTagPosts,
		getTypePosts,

		// 搜索和导航
		searchNavigation,
		getBreadcrumbs,
		getRelatedCategories,
		getRelatedTags,
	}
}
