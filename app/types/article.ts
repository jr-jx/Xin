/**
 * 文章引用信息
 */
export interface ArticleReference {
	/** 引用标题 */
	title?: string
	/** 引用链接 */
	link?: string
}

/**
 * 文章阅读时间信息
 */
export interface ArticleReadingTime {
	/** 阅读时间文本描述 */
	text: string
	/** 预计阅读分钟数 */
	minutes: number
	/** 阅读时间（毫秒） */
	time: number
	/** 字数统计 */
	words: number
}

/**
 * 文章数据接口
 * 兼容：顶层字段（content.config.ts schema）+ 旧版 meta 字段
 */
export interface Article {
	/** 文章路径 */
	path: string

	// ========== 基本信息 ==========
	/** 文章标题 */
	title?: string
	/** 文章描述 */
	description?: string
	/** 是否为草稿 */
	draft?: boolean
	/** 文章内容 */
	body?: { text?: string }

	// ========== 时间信息 ==========
	/** 发布日期 */
	date?: string
	/** 更新日期 */
	updated?: string

	// ========== 分类与标签 ==========
	/** 文章分类列表 */
	categories?: string[]
	/** 文章分类（兼容旧字段） */
	category?: string
	/** 文章标签列表 */
	tags?: string[]

	// ========== 类型与媒体 ==========
	/** 文章类型 */
	type?: 'tech' | 'story'
	/** 封面图片 */
	image?: string

	// ========== 其他信息 ==========
	/** 推荐等级 */
	recommend?: number
	/** 参考文献 */
	references?: ArticleReference[]
	/** 阅读时间信息 */
	readingTime?: ArticleReadingTime
	/** 文章摘要 */
	excerpt?: string
	/** 作者 */
	author?: string
	/** 是否为精选文章 */
	featured?: boolean
}

/**
 * 文章卡片组件属性
 */
export interface ArticleCardProps {
	/** 文章数据 */
	post: Article
}
