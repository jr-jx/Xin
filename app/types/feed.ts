export interface FeedEntry {
	/** 博客作者 */
	author: string
	/** 网站趣称 */
	sitenick?: string
	/** 博客网站标题，允许长标题，用于订阅源，为空则使用网站趣称或作者名 */
	title?: string
	/** 个人简介/博客描述 */
	desc?: string
	/** 博客地址 */
	link: string
	/** 订阅源 */
	feed?: string
	/** 站点小图标 */
	icon: string
	/** 个人头像 */
	avatar: string
	/** 博客技术架构 */
	archs?: Arch[]
	/** 订阅日期 */
	date: string
	/** 博主备注 */
	comment?: string
	/** 错误信息 */
	error?: string
}

/** 朋友圈聚合的一条文章 */
export interface FriendItem {
	/** 作者昵称 */
	author: string
	/** 站点趣称 */
	sitenick?: string
	/** 作者头像 */
	avatar: string
	/** 作者站点首页 */
	siteLink: string
	/** 站点架构标签 */
	archs?: Arch[]
	/** 文章标题 */
	title: string
	/** 文章链接 */
	link: string
	/** 摘要（已剥 HTML） */
	summary: string
	/** 封面图 URL */
	cover?: string
	/** 发布时间（ISO） */
	pubDate: string
}

/** 朋友圈源拉取状态 */
export interface FriendSourceStatus {
	author: string
	sitenick?: string
	siteLink: string
	feed?: string
	ok: boolean
	count: number
	error?: string
}

/** 朋友圈聚合响应 */
export interface FriendsResponse {
	items: FriendItem[]
	sources: FriendSourceStatus[]
	generatedAt: string
}

export interface FeedGroup {
	/** 分组名 */
	name: string
	/** 描述 */
	desc?: string
	/** 友链列表 */
	entries: FeedEntry[]
}
