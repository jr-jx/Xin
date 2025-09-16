import type { FeedGroup } from '~/types/feed'
import { getFavicon } from './utils/img'

export default [
	{
		name: '推荐',
		desc: '都是大佬，推荐关注',
		// @keep-sorted { "keys": ["date"] }
		entries: [
			{
				author: '阮一峰',
				sitenick: '阮一峰的网络日志',
				icon: getFavicon('www.ruanyifeng.com'),
				desc: '阮老师，知名博主，大佬中的大佬',
				link: 'https://www.ruanyifeng.com/blog/',
				archs: ['Cloudflare'],
				avatar: 'https://cdn.lightxi.com/cloudreve/uploads/2025/07/31/U0IB1Rq7_person2_s.jpg',
				date: '2024-01-29',
				feed: 'https://www.ruanyifeng.com/blog/atom.xml',
			},
			{
				author: 'Antfu',
				sitenick: 'Antfu',
				link: 'https://antfu.me/',
				desc: 'Vue 核心成员',
				avatar: 'https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/wQRfFIj8_antfu.svg',
				archs: ['Vue', 'Vercel'],
				date: '2024-01-29',
				icon: getFavicon('antfu.me'),
				feed: 'https://antfu.me/feed.xml',
			},
		],
	},
	{
		name: '挚交好友',
		desc: '这里记录了我的挚交好友',
		entries: [
			{
				author: '青桔气球',
				sitenick: '青桔气球',
				link: 'https://blog.qjqq.cn/',
				icon: getFavicon('blog.qjqq.cn'),
				avatar: 'https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/5l6lLT6c_headimg_dl.jpg',
				desc: '分享网络安全与科技生活',
				archs: ['Hexo', '国内 CDN'],
				date: '2024-01-29',
				feed: 'https://blog.qjqq.cn/atom.xml',
			},
			{
				author: '亦封',
				sitenick: '爱吃肉的猫',
				link: 'https://meuicat.com/',
				avatar: 'https://cdn.lightxi.com/cloudreve/uploads/2025/08/02/rXQ2DErb_662953b6d9923.jpg',
				icon: getFavicon('meuicat.com'),
				desc: '有肉有猫有生活.',
				archs: ['Hexo', '国内 CDN'],
				date: '2024-01-29',
				feed: 'https://meuicat.com/atom.xml',
			},
			{
				author: 'isYangs',
				sitenick: 'isYangs',
				link: 'https://isyangs.cn',
				icon: getFavicon('isyangs.cn'),
				avatar: 'https://7.isyangs.cn/8/655c9835780a0-8.jpg',
				desc: '一个前端Bug构造师的博客',
				archs: ['Vue', 'Vercel'],
				date: '2024-01-29',
				feed: 'https://isyangs.cn/feed.xml',
			},
			{
				author: '纸鹿',
				sitenick: '纸鹿摸鱼处',
				link: 'https://blog.zhilu.site/',
				icon: getFavicon('blog.zhilu.site'),
				avatar: 'https://www.zhilu.site/api/avatar.png',
				desc: '纸鹿至麓不知路，支炉制露不止漉',
				archs: ['Nuxt', 'Vercel'],
				date: '2024-01-29',
				feed: 'https://blog.zhilu.site/atom.xml',
			},
		],
	},
] satisfies FeedGroup[]
