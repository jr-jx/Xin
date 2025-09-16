import type { FeedEntry } from '~/types/feed'

export { zhCN as dateLocale } from 'date-fns/locale/zh-CN'

const blogConfig = {
	// 默认分类
	defaultCategory: ['未分类'],

	favicon: '/favicon.ico',
	language: 'zh-CN',

	// 站点基本信息
	site: {
		title: '伍拾柒',
		subtitle: '分享设计与科技生活',
		description: '分享设计与科技生活，产品、交互、设计、开发',
		url: 'https://blog.efu.me',
		timeEstablished: '2023-04-20',
	},

	// 许可证信息
	license: {
		icon: 'i-ri:creative-commons-line',
		name: '署名-非商业性使用-相同方式共享 4.0 国际',
		url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
	},

	// 个人资料
	profile: {
		name: '伍拾柒',
		bio: '分享设计与科技生活，产品、交互、设计、开发',
		email: 'o@efu.me',
		avatar: 'https://wsrv.nl/?url=github.com/everfu.png',
		homepage: 'https://efu.me',
	},

	// 导航菜单
	menu: [
		{
			label: '文库',
			items: [
				{ label: '归档', to: '/archives', icon: 'ph:archive-bold' },
				{ label: '标签', to: '/tags', icon: 'ph:tag-bold' },
				{ label: '分类', to: '/categories', icon: 'ph:folder-bold' },
			],
		},
		{
			label: '友链',
			items: [
				{ label: '朋友圈', to: '/friends', icon: 'ph:wechat-logo-bold' },
				{ label: '友情链接', to: '/links', icon: 'ph:link-bold' },
			],
		},
		{
			label: '关于',
			items: [
				{ label: '最近评论', to: '/recentcomments', icon: 'ph:chat-bold' },
				{ label: '关于本站', to: '/about', icon: 'ph:address-book-tabs-bold' },
			],
		},
	],

	// 社交媒体链接
	social: [
		{ label: 'GitHub', icon: 'mdi:github', url: 'https://github.com/everfu' },
		{ label: 'LinkedIn', icon: 'mdi:linkedin', url: 'https://www.linkedin.com/in/everfu/' },
	],

	// 页脚配置
	footer: {
		links: [
			{
				label: 'GitHub',
				icon: 'mdi:github',
				url: 'https://github.com/everfu',
			},
			{
				label: 'LinkedIn',
				icon: 'mdi:linkedin',
				url: 'https://www.linkedin.com/in/everfu/',
			},
			{
				label: 'Email',
				icon: 'mdi:email',
				url: 'mailto:everfu@gmail.com',
			},
			{
				label: 'Bilibili',
				icon: 'ant-design:bilibili-filled',
				url: 'https://space.bilibili.com/1234567890',
			},
		],
		nav: [
			{
				label: '导航',
				links: [
					{
						label: '归档',
						link: '/archives',
					},
					{
						label: '标签',
						link: '/tags',
					},
					{
						label: '分类',
						link: '/categories',
					},
				],
			},
			{
				label: '协议',
				links: [
					{
						label: '隐私协议',
						link: '/privacy',
					},
				],
			},
		],
	},

	// 外部脚本
	scripts: [
		// Twikoo 评论系统
		{ src: 'https://lib.baomitu.com/twikoo/1.6.44/twikoo.min.js', defer: true },
	],

	// Twikoo 评论系统配置
	twikoo: {
		envId: 'https://tk.efu.me/',
		preload: 'https://tk.efu.me/',
	},

	// RSS 订阅配置
	feed: {
		enableStyle: true,
		limit: 10, // 默认限制为10条
	},
}

/** 用于生成 OPML 和友链页面配置 */
export const myFeed: FeedEntry = {
	author: blogConfig.profile.name,
	sitenick: '伍拾柒',
	title: blogConfig.site.title,
	desc: blogConfig.site.subtitle || blogConfig.site.description,
	link: blogConfig.site.url,
	feed: new URL('/atom.xml', blogConfig.site.url).toString(),
	icon: blogConfig.favicon,
	avatar: blogConfig.profile.avatar,
	archs: ['Nuxt', 'Vercel'],
	date: blogConfig.site.timeEstablished,
	comment: '这是我自己',
}

export default blogConfig
