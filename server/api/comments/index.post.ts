import type { CommentRecord } from '../../utils/comments'
import { isAdmin } from '../../utils/adminAuth'
import {
	getComment,
	getCommentAvatarProxy,
	md5,
	newCommentId,
	normalizeSlug,
	renderMarkdown,
	saveComment,
	toPublicComment,
} from '../../utils/comments'
import { notifyAdmin, notifyReply } from '../../utils/mailer'
import { enforce } from '../../utils/rateLimit'
import { getClientIp, hashIp } from '../../utils/requestIdentity'
import { checkSpam } from '../../utils/spam'

interface Payload {
	slug?: string
	url?: string
	nick?: string
	mail?: string
	link?: string
	content?: string
	mode?: 'manual' | 'anonymous'
	pid?: string | null
	rid?: string | null
}

export default defineEventHandler(async (event) => {
	const body = await readBody<Payload>(event)
	const slug = normalizeSlug(String(body?.slug || ''))
	if (!slug)
		throw createError({ statusCode: 400, statusMessage: 'slug required' })

	const {
		ipHashSalt,
		commentKeywordBlacklist,
	} = useRuntimeConfig()
	const ip = getClientIp(event)
	const ipHash = hashIp(ip, ipHashSalt as string)

	await enforce(ipHash, 'comment:post', [
		{ windowMs: 30_000, max: 2 },
		{ windowMs: 60_000, max: 3 },
		{ windowMs: 3_600_000, max: 20 },
	])

	const mode = body.mode === 'anonymous' ? 'anonymous' : 'manual'

	const nick = mode === 'anonymous'
		? '匿名访客'
		: (body.nick || '').trim()
	const mail = mode === 'anonymous' ? '' : (body.mail || '').trim().toLowerCase()
	const link = mode === 'anonymous' ? '' : (body.link || '').trim()
	const content = (body.content || '').trim()

	const blacklist = String(commentKeywordBlacklist || '')
		.split(',')
		.map(s => s.trim())
		.filter(Boolean)

	checkSpam({ nick, mail, link, content }, blacklist)

	// 处理回复关系
	let pid: string | null = body.pid || null
	let rid: string | null = body.rid || null
	let replyToNick = ''
	if (pid) {
		const parent = await getComment(slug, pid)
		if (!parent)
			throw createError({ statusCode: 404, statusMessage: '被回复的评论不存在' })
		rid = parent.rid || parent.id
		replyToNick = parent.nick
	}
	else {
		pid = null
		rid = null
	}

	const { html, text } = renderMarkdown(content)
	const mailMd5 = mail ? md5(mail) : md5(`${nick}@anonymous`)
	const ua = String(event.node.req.headers['user-agent'] || '').slice(0, 300)
	const now = Date.now()

	const rec: CommentRecord = {
		id: newCommentId(),
		slug,
		url: String(body.url || slug),
		nick,
		mail: mail || undefined,
		mailMd5,
		link,
		content,
		html,
		ua,
		pid,
		rid,
		ipHash,
		createdAt: now,
		updatedAt: now,
		hidden: false,
		pinned: false,
		likes: 0,
		isAdmin: isAdmin(event),
		replyToNick,
	}

	await saveComment(rec)

	// fire-and-forget 邮件通知
	queueMicrotask(() => {
		notifyAdmin(rec).catch(() => {})
		if (pid) {
			getComment(slug, pid).then((parent) => {
				if (parent?.mail && parent.mail !== mail)
					notifyReply(parent, rec, parent.mail).catch(() => {})
			}).catch(() => {})
		}
	})

	setResponseStatus(event, 201)
	return { comment: toPublicComment(rec, false, await getCommentAvatarProxy()), text }
})
