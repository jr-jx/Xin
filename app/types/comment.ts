import type { BaseEntity } from './common'

export interface Comment extends BaseEntity {
	/** 昵称 */
	nick: string
	/** 邮箱 MD5（用于 Gravatar） */
	mailMd5: string
	/** 头像 URL */
	avatar: string
	/** 个人主页链接 */
	link: string
	/** 渲染后的 HTML */
	comment: string
	/** 纯文本摘要 */
	commentText: string
	/** 原文 Markdown */
	content?: string
	/** User-Agent 原文 */
	ua?: string
	/** 父评论 id（一级回复） */
	pid?: string | null
	/** 根评论 id（多级回复均指向根） */
	rid?: string | null
	/** 文章 slug（路由路径，如 /posts/xxx） */
	slug?: string
	/** 文章绝对/相对 URL（用于跳转） */
	url: string
	/** 点赞数 */
	likes?: number
	/** 是否被当前 IP 点过赞 */
	liked?: boolean
	/** 是否被隐藏 */
	hidden?: boolean
	/** 是否管理员评论 */
	isAdmin?: boolean
	/** 相对时间文案 */
	relativeTime: string
	/** 子评论（服务端构建的树结构可选挂载） */
	children?: Comment[]
}

export interface CommentListResponse {
	items: Comment[]
	total: number
	parentTotal: number
	page: number
	pageSize: number
	hasMore: boolean
}

export interface CommentSubmitPayload {
	slug: string
	url?: string
	nick: string
	mail?: string
	link?: string
	content: string
	pid?: string | null
	rid?: string | null
}
