import { defineCollection, defineContentConfig, z } from '@nuxt/content'
import blogConfig from './blog.config'

export default defineContentConfig({
	collections: {
		post: defineCollection({
			type: 'page',
			source: 'posts/*.md',
			schema: z.object({
				// 基础信息
				title: z.string().describe('文章标题'),
				description: z.string().optional().describe('文章描述'),
				excerpt: z.string().optional().describe('文章摘要'),
				author: z.string().optional().describe('文章作者'),

				// 时间信息
				date: z.string().describe('发布日期'),
				updated: z.string().optional().describe('更新日期'),

				// 分类与标签
				categories: z.array(z.string()).default(blogConfig.defaultCategory).describe('文章分类'),
				category: z.string().optional().describe('兼容旧字段：单分类'),
				tags: z.array(z.string()).describe('文章标签'),

				// 类型与状态
				type: z.enum(['tech', 'story', 'life', 'review', 'tutorial']).default('tech').describe('文章类型'),
				draft: z.boolean().default(false).describe('是否为草稿'),
				featured: z.boolean().default(false).describe('是否为精选文章'),

				// 媒体资源
				image: z.string().optional().describe('封面图片'),
				cover: z.string().optional().describe('兼容旧字段：封面图片'),

				// 推荐与统计
				recommend: z.number().default(0).describe('推荐指数 (0-10)'),
				views: z.number().default(0).describe('浏览次数'),
				likes: z.number().default(0).describe('点赞次数'),

				// 阅读信息
				readingTime: z.object({
					text: z.string().describe('阅读时间文本'),
					minutes: z.number().describe('阅读分钟数'),
					time: z.number().describe('阅读时间（秒）'),
					words: z.number().describe('字数统计'),
				}).optional().describe('阅读时间信息'),

				// 引用与链接
				references: z.array(z.object({
					title: z.string().optional().describe('引用标题'),
					link: z.string().optional().describe('引用链接'),
					author: z.string().optional().describe('引用作者'),
					date: z.string().optional().describe('引用日期'),
				})).optional().describe('参考文献'),

				// SEO 相关
				keywords: z.array(z.string()).optional().describe('SEO 关键词'),
				meta: z.object({
					title: z.string().optional().describe('SEO 标题'),
					description: z.string().optional().describe('SEO 描述'),
					image: z.string().optional().describe('SEO 图片'),
					canonical: z.string().optional().describe('规范链接'),
				}).optional().describe('SEO 元数据'),

				// 内容结构
				toc: z.boolean().default(true).describe('是否显示目录'),
				comments: z.boolean().default(true).describe('是否允许评论'),

				// 高级功能
				series: z.string().optional().describe('系列文章标识'),
				part: z.number().optional().describe('系列文章序号'),
				related: z.array(z.string()).optional().describe('相关文章路径'),

				// 自定义字段
				custom: z.record(z.any()).optional().describe('自定义字段'),

				// 兼容性字段
				body: z.object({
					text: z.string().optional().describe('文章正文文本'),
				}).optional().describe('兼容旧字段：文章正文'),
			}),
		}),
		page: defineCollection({
			type: 'page',
			source: '*.md',
			schema: z.object({
				title: z.string().describe('页面标题'),
			}),
		}),
	},
})
