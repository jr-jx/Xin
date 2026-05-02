import type { CommentRecord } from './comments'
import nodemailer from 'nodemailer'
import blogConfig from '../../blog.config'

let cachedTransport: nodemailer.Transporter | null = null

function getTransport(): nodemailer.Transporter | null {
	if (cachedTransport)
		return cachedTransport
	const { smtp } = useRuntimeConfig()
	if (!smtp?.host || !smtp.user || !smtp.pass)
		return null
	cachedTransport = nodemailer.createTransport({
		host: smtp.host,
		port: smtp.port,
		secure: smtp.port === 465,
		auth: { user: smtp.user, pass: smtp.pass },
	})
	return cachedTransport
}

function plain(html: string): string {
	return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 500)
}

function siteUrl(): string {
	return blogConfig.site.url.replace(/\/$/, '')
}

function commentLink(rec: CommentRecord): string {
	const base = rec.url || rec.slug
	const abs = base.startsWith('http') ? base : `${siteUrl()}${base}`
	return `${abs}#${rec.id}`
}

/** 通知博主 */
export async function notifyAdmin(newComment: CommentRecord): Promise<void> {
	if (!blogConfig.comment.notify.enabled)
		return
	const { commentNotifyTo, smtp } = useRuntimeConfig()
	if (!commentNotifyTo)
		return
	const t = getTransport()
	if (!t)
		return
	const subject = `[${blogConfig.site.title}] 新评论：${newComment.nick}`
	const html = `<p><b>${newComment.nick}</b> 在 <a href="${commentLink(newComment)}">${newComment.url}</a> 评论：</p>
	<blockquote>${newComment.html}</blockquote>`
	try {
		await t.sendMail({
			from: smtp.from,
			to: commentNotifyTo,
			subject,
			html,
			text: plain(html),
		})
	}
	catch (err) {
		console.error('[mailer] notifyAdmin failed:', err)
	}
}

/** 通知被回复者 */
export async function notifyReply(parent: CommentRecord, reply: CommentRecord, parentMail: string): Promise<void> {
	if (!blogConfig.comment.notify.enabled)
		return
	if (!parentMail)
		return
	const t = getTransport()
	if (!t)
		return
	const { smtp } = useRuntimeConfig()
	const subject = `[${blogConfig.site.title}] ${reply.nick} 回复了你的评论`
	const html = `<p>你在 <a href="${commentLink(reply)}">${reply.url}</a> 的评论收到了新回复：</p>
	<p><b>${parent.nick}</b>：</p><blockquote>${parent.html}</blockquote>
	<p><b>${reply.nick}</b>：</p><blockquote>${reply.html}</blockquote>`
	try {
		await t.sendMail({
			from: smtp.from,
			to: parentMail,
			subject,
			html,
			text: plain(html),
		})
	}
	catch (err) {
		console.error('[mailer] notifyReply failed:', err)
	}
}
