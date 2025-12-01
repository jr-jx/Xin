import type { ContentCollectionItem } from '@nuxt/content'
import { XMLBuilder } from 'fast-xml-parser'
import blogConfig from '~~/blog.config'
import { version } from '~~/package.json'
import { getIsoDatetime } from '~/utils/date'

// 配置 XML 构建器
const builder = new XMLBuilder({
	attributeNamePrefix: '$',
	cdataPropName: '$',
	format: true,
	ignoreAttributes: false,
	textNodeName: '_',
})

// 接口定义
interface AtomEntry {
	id: string
	title: string
	updated: string
	author: { name: string }
	content: {
		$type: 'html'
		$: string
	}
	link: { $href: string }
	summary?: string
	category?: { $term?: string }
	published: string
}

interface AtomFeed {
	$xmlns: string
	id: string
	title: string
	updated: string
	description?: string
	author: {
		name: string
		email?: string
		uri?: string
	}
	link: Array<{ $href: string, $rel: string }>
	language?: string
	generator: {
		$uri: string
		$version: string
		_: string
	}
	icon?: string
	logo?: string
	rights: string
	subtitle?: string
	entry: AtomEntry[]
}

/**
 * 根据路径获取完整URL
 */
function getUrl(path: string | undefined): string {
	try {
		return new URL(path ?? '', blogConfig.site.url).toString()
	}
	catch (error) {
		console.error(`构建URL失败: ${path}`, error)
		return blogConfig.site.url
	}
}

/**
 * 渲染文章内容为HTML格式
 */
function renderContent(post: ContentCollectionItem): string {
	const contentParts: string[] = []

	if (post.image) {
		contentParts.push(`<img src="${post.image}" alt="${post.title || '文章图片'}" />`)
	}

	if (post.description) {
		contentParts.push(`<p>${post.description}</p>`)
	}

	const postUrl = getUrl(post.path)
	contentParts.push(`<a class="view-full" href="${postUrl}" target="_blank">点击查看全文</a>`)

	return contentParts.join(' ')
}

/**
 * 将文章转换为Atom条目
 */
function convertToAtomEntry(post: ContentCollectionItem): AtomEntry {
	const postUrl = getUrl(post.path)

	return {
		id: postUrl,
		title: post.title ?? '无标题文章',
		updated: getIsoDatetime(post) || '',
		author: { name: blogConfig.profile.name },
		content: {
			$type: 'html',
			$: renderContent(post),
		},
		link: { $href: postUrl },
		summary: post.description,
		category: post.categories?.length ? { $term: post.categories[0] } : undefined,
		published: (getIsoDatetime(post.published) ?? getIsoDatetime(post.date) ?? getIsoDatetime(post)) || '',
	}
}

/**
 * 构建完整的Atom feed对象
 */
function buildAtomFeed(entries: AtomEntry[]): AtomFeed {
	const runtimeConfig = useRuntimeConfig()

	return {
		$xmlns: 'http://www.w3.org/2005/Atom',
		id: blogConfig.site.url,
		title: blogConfig.site.title,
		updated: runtimeConfig.public.buildTime || getIsoDatetime(new Date()) || '',
		description: blogConfig.site.description, // RSS 2.0 兼容
		author: {
			name: blogConfig.profile.name,
			email: blogConfig.profile.email,
			uri: blogConfig.profile.homepage,
		},
		link: [
			{ $href: getUrl('atom.xml'), $rel: 'self' },
			{ $href: blogConfig.site.url, $rel: 'alternate' },
		],
		language: blogConfig.language, // RSS 2.0 兼容
		generator: {
			$uri: 'https://github.com/L33Z22L11/blog-v3',
			$version: version,
			_: 'Xin Blog',
		},
		icon: blogConfig.favicon,
		logo: blogConfig.profile.avatar, // 推荐比例 2:1
		rights: `© ${new Date().getFullYear()} ${blogConfig.profile.name}`,
		subtitle: blogConfig.site.subtitle || blogConfig.site.description,
		entry: entries,
	}
}

/**
 * Atom feed API 处理函数
 */
export default defineEventHandler(async (event) => {
	try {
		// 查询最近的文章
		const posts = await queryCollection(event, 'post')
			.where('stem', 'LIKE', 'posts/%')
			.order('updated', 'DESC')
			.limit(blogConfig.feed?.limit || 10)
			.all()

		// 转换为Atom条目
		const entries = posts.map(post => convertToAtomEntry(post))

		// 构建Atom feed
		const feed = buildAtomFeed(entries)

		// 设置响应头
		event.node.res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8')

		// 生成并返回XML
		return builder.build({
			'?xml': { $version: '1.0', $encoding: 'UTF-8' },
			'?xml-stylesheet': blogConfig.feed?.enableStyle ? { $type: 'text/xsl', $href: '/assets/atom.xsl' } : undefined,
			feed,
		})
	}
	catch (error) {
		console.error('生成Atom feed失败:', error)

		// 设置错误响应
		event.node.res.statusCode = 500
		event.node.res.setHeader('Content-Type', 'application/atom+xml; charset=utf-8')

		// 返回基本的错误feed
		return builder.build({
			'?xml': { $version: '1.0', $encoding: 'UTF-8' },
			'feed': {
				$xmlns: 'http://www.w3.org/2005/Atom',
				id: blogConfig.site.url,
				title: `错误: ${blogConfig.site.title}`,
				updated: getIsoDatetime(new Date()),
				author: { name: blogConfig.profile.name },
				entry: [{
					id: `${blogConfig.site.url}#error`,
					title: 'Feed生成失败',
					updated: getIsoDatetime(new Date()),
					content: {
						$type: 'html',
						$: `<p>抱歉，当前无法生成博客订阅源。请稍后再试。</p>`,
					},
				}],
			},
		})
	}
})
