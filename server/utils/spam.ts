import blogConfig from '../../blog.config'

export interface SpamCheckInput {
	nick: string
	mail?: string
	link?: string
	content: string
}

const MAX_URLS_IN_CONTENT = 3
const NICK_MAX = 40
const MAIL_MAX = 120
const LINK_MAX = 200

const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const URL_RE = /\bhttps?:\/\/\S+/gi

export function checkSpam(input: SpamCheckInput, blacklistKeywords: string[] = []): void {
	const { nick, mail, link, content } = input

	if (!nick || !nick.trim())
		throw createError({ statusCode: 400, statusMessage: '昵称不能为空' })
	if (nick.length > NICK_MAX)
		throw createError({ statusCode: 400, statusMessage: '昵称过长' })

	if (mail) {
		if (mail.length > MAIL_MAX || !EMAIL_RE.test(mail))
			throw createError({ statusCode: 400, statusMessage: '邮箱格式不正确' })
	}
	else if (!blogConfig.comment.allowAnonymous) {
		throw createError({ statusCode: 400, statusMessage: '请填写邮箱' })
	}

	if (link) {
		if (link.length > LINK_MAX || !/^https?:\/\//.test(link))
			throw createError({ statusCode: 400, statusMessage: '网址格式不正确' })
	}

	if (!content || !content.trim())
		throw createError({ statusCode: 400, statusMessage: '评论内容不能为空' })

	const maxLen = blogConfig.comment.maxLength
	if (content.length > maxLen)
		throw createError({ statusCode: 400, statusMessage: `评论长度超过 ${maxLen} 字` })

	const urls = content.match(URL_RE) || []
	if (urls.length > MAX_URLS_IN_CONTENT)
		throw createError({ statusCode: 400, statusMessage: '包含过多链接' })

	const lower = content.toLowerCase()
	for (const k of blacklistKeywords) {
		if (!k)
			continue
		if (lower.includes(k.toLowerCase()))
			throw createError({ statusCode: 403, statusMessage: '内容包含禁用关键词' })
	}
}
