import type { Article } from '~/types/article'

/**
 * 内容处理工具函数
 */

/**
 * 格式化阅读时间
 */
export function formatReadingTime(minutes: number): string {
	if (minutes < 1)
		return '不到1分钟'
	if (minutes < 60)
		return `${Math.round(minutes)}分钟`

	const hours = Math.floor(minutes / 60)
	const remainingMinutes = minutes % 60

	if (remainingMinutes === 0) {
		return `${hours}小时`
	}

	return `${hours}小时${Math.round(remainingMinutes)}分钟`
}

/**
 * 获取文章类型显示名称
 */
export function getPostTypeDisplayName(type?: string): string {
	const typeMap: Record<string, string> = {
		tech: '技术',
		story: '故事',
		life: '生活',
		review: '评论',
		tutorial: '教程',
	}

	return typeMap[type || 'tech'] || type || '技术'
}

/**
 * 获取文章类型图标
 */
export function getPostTypeIcon(type?: string): string {
	const iconMap: Record<string, string> = {
		tech: 'i-carbon-code',
		story: 'i-carbon-book',
		life: 'i-carbon-user',
		review: 'i-carbon-star',
		tutorial: 'i-carbon-education',
	}

	return iconMap[type || 'tech'] || 'i-carbon-document'
}

/**
 * 生成文章摘要
 */
export function generateExcerpt(content: string, maxLength = 150): string {
	if (!content)
		return ''

	// 移除 HTML 标签
	const plainText = content.replace(/<[^>]*>/g, '')

	if (plainText.length <= maxLength) {
		return plainText
	}

	// 在句号或问号处截断
	const truncated = plainText.substring(0, maxLength)
	const lastSentenceEnd = Math.max(
		truncated.lastIndexOf('。'),
		truncated.lastIndexOf('！'),
		truncated.lastIndexOf('？'),
		truncated.lastIndexOf('.'),
		truncated.lastIndexOf('!'),
		truncated.lastIndexOf('?'),
	)

	if (lastSentenceEnd > maxLength * 0.7) {
		return truncated.substring(0, lastSentenceEnd + 1)
	}

	return `${truncated}...`
}

/**
 * 计算文章字数
 */
export function countWords(content: string): number {
	if (!content)
		return 0

	// 移除 HTML 标签和空白字符
	const plainText = content.replace(/<[^>]*>/g, '').replace(/\s+/g, '')

	// 中文字符算一个字，英文单词算一个字
	const chineseChars = (plainText.match(/[\u4E00-\u9FA5]/g) || []).length
	const englishWords = (plainText.match(/[a-z]+/gi) || []).length

	return chineseChars + englishWords
}

/**
 * 估计阅读时间（基于字数）
 */
export function estimateReadingTime(content: string, wordsPerMinute = 200): number {
	const wordCount = countWords(content)
	return Math.ceil(wordCount / wordsPerMinute)
}

// 通用样式生成函数
function createStyleMap(styles: Record<string, string>): Record<string, { color: string, bgColor: string }> {
	const result: Record<string, { color: string, bgColor: string }> = {}
	for (const [key, color] of Object.entries(styles)) {
		result[key] = { color, bgColor: `${color}1A` }
	}
	return result
}

/**
 * 获取文章标签的显示样式
 */
export function getTagStyle(tag: string): { color: string, bgColor: string } {
	const tagStyles = createStyleMap({
		'Nuxt': '#00DC82',
		'Vue': '#42B883',
		'TypeScript': '#3178C6',
		'JavaScript': '#F7DF1E',
		'CSS': '#1572B6',
		'Node.js': '#339933',
		'React': '#61DAFB',
		'Python': '#3776AB',
		'Git': '#F05032',
		'Docker': '#2496ED',
	})

	return tagStyles[tag] || { color: '#6B7280', bgColor: '#6B72801A' }
}

/**
 * 获取文章分类的显示样式
 */
export function getCategoryStyle(category: string): { color: string, bgColor: string } {
	const categoryStyles = createStyleMap({
		教程: '#3B82F6',
		经验分享: '#10B981',
		技术探索: '#8B5CF6',
		项目实践: '#F59E0B',
		学习笔记: '#EF4444',
	})

	return categoryStyles[category] || { color: '#6B7280', bgColor: '#6B72801A' }
}

/**
 * 验证文章数据完整性
 */
export function validateArticle(article: Partial<Article>): { isValid: boolean, errors: string[] } {
	const errors: string[] = []

	if (!article.path) {
		errors.push('文章路径不能为空')
	}

	if (!article.title) {
		errors.push('文章标题不能为空')
	}

	if (!article.date) {
		errors.push('文章日期不能为空')
	}

	// 验证日期格式
	if (article.date && Number.isNaN(Date.parse(article.date))) {
		errors.push('文章日期格式无效')
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}

/**
 * 排序文章列表
 */
export function sortArticles(articles: Article[], sortBy: 'date' | 'updated' | 'title' | 'recommend' = 'date', order: 'asc' | 'desc' = 'desc'): Article[] {
	const sorted = [...articles]

	sorted.sort((a, b) => {
		let aValue: string | number
		let bValue: string | number

		switch (sortBy) {
			case 'date':
				aValue = a.date ? new Date(a.date).getTime() : 0
				bValue = b.date ? new Date(b.date).getTime() : 0
				break
			case 'updated':
				aValue = a.updated ? new Date(a.updated).getTime() : 0
				bValue = b.updated ? new Date(b.updated).getTime() : 0
				break
			case 'title':
				aValue = a.title || ''
				bValue = b.title || ''
				break
			case 'recommend':
				aValue = a.recommend || 0
				bValue = b.recommend || 0
				break
			default:
				aValue = 0
				bValue = 0
		}

		if (order === 'asc') {
			return aValue > bValue ? 1 : -1
		}
		else {
			return aValue < bValue ? 1 : -1
		}
	})

	return sorted
}
