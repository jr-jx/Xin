import process from 'node:process'
import ci from 'ci-info'
import blogConfig from './blog.config'

export default defineNuxtConfig({
	compatibilityDate: '2025-07-15',

	app: {
		head: {
			title: '伍拾柒',
			titleTemplate: '%s - 伍拾柒',
			meta: [
				{ charset: 'utf-8' },
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: '伍拾柒' },
				{ name: 'generator', content: 'w-blog' },
			],
			link: [
				{ rel: 'icon', href: '/favicon.ico' },
				{ rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
				// KaTeX：异步加载，避免阻塞首屏
				{ rel: 'preload', as: 'style', href: 'https://lib.baomitu.com/KaTeX/0.16.9/katex.min.css' },
				{ rel: 'stylesheet', href: 'https://lib.baomitu.com/KaTeX/0.16.9/katex.min.css', media: 'print', onload: 'this.media=\'all\'' },
				// 思源黑体 "Noto Sans SC", 思源宋体 "Noto Serif SC", "JetBrains Mono"
				{ rel: 'preconnect', href: 'https://fonts.gstatic.cn', crossorigin: '' },
				{ rel: 'preconnect', href: 'https://fonts.googleapis.cn', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.cn/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&display=swap', media: 'print', onload: 'this.media=\'all\'' },
				// 小米字体 "MiSans"
				{ rel: 'preconnect', href: 'https://cdn-font.hyperos.mi.com', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://cdn-font.hyperos.mi.com/font/css?family=MiSans:100,200,300,400,450,500,600,650,700,900:Chinese_Simplify,Latin&display=swap', media: 'print', onload: 'this.media=\'all\'' },
			],
			script: blogConfig.scripts,
		},
	},

	components: [
		{ path: '~/components' },
		{ path: '~/components/partial', prefix: 'U' },
	],

	css: [
		'~/assets/css/main.scss',
		'~/assets/css/color.scss',
		'~/assets/css/post.scss',
		'~/assets/css/reusable.scss',
		'~/assets/css/animation.scss',
	],
	modules: ['@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxtjs/color-mode', '@pinia/nuxt', '@nuxt/icon', 'unplugin-yaml/nuxt', '@vueuse/motion/nuxt'],

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/css/_variable.scss" as *;',
				},
			},
		},
		server: {
			allowedHosts: true,
		},
		optimizeDeps: {
			include: [
				'@vue/devtools-core',
				'@vue/devtools-kit',
				'vue-tippy',
				'date-fns',
				'date-fns/locale/zh-CN',
				'@shikijs/colorized-brackets',
				'@shikijs/transformers',
				'shiki/core',
				'shiki/engine-javascript.mjs',
				'shiki/themes/catppuccin-latte.mjs',
				'shiki/themes/one-dark-pro.mjs',
				'shiki/langs',
			],
		},
		build: {
			minify: 'terser',
			cssCodeSplit: true,
			chunkSizeWarningLimit: 1024,
			terserOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true,
				},
			},
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (!id.includes('node_modules'))
							return
						if (id.includes('/shiki/') || id.includes('@shikijs/'))
							return 'shiki'
						if (id.includes('/katex/'))
							return 'katex'
						if (id.includes('vue-tippy') || id.includes('tippy.js'))
							return 'tippy'
						if (id.includes('@vueuse/motion') || id.includes('popmotion') || id.includes('framesync'))
							return 'motion'
					},
				},
			},
		},
	},

	routeRules: {
		'/atom.xml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
		'/favicon.ico': { redirect: { to: blogConfig.favicon } },
		'/efu.opml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
	},

	nitro: {
		minify: true,
		compressPublicAssets: { gzip: true, brotli: true },
		devStorage: {
			'edgeone-kv-local': {
				driver: 'fs',
				base: './.data/edgeone-kv',
			},
		},
	},

	icon: {
		serverBundle: {
			collections: [
				'ant-design',
				'devicon',
				'icon-park-solid',
				'material-symbols',
				'mdi',
				'mynaui',
				'ph',
				'ri',
				'simple-icons',
				'skill-icons',
				'solar',
				'tabler',
				'twemoji',
			],
		},
	},

	runtimeConfig: {
		edgeKvProxySecret: process.env.EDGE_KV_PROXY_SECRET || '',
		ipHashSalt: process.env.NUXT_IP_HASH_SALT || 'xin-friends-likes-v1',
		commentAdminPassword: process.env.NUXT_COMMENT_ADMIN_PASSWORD || '',
		commentJwtSecret: process.env.NUXT_COMMENT_JWT_SECRET || 'xin-comment-jwt-dev-secret-change-me',
		commentNotifyTo: process.env.NUXT_COMMENT_NOTIFY_TO || '',
		commentKeywordBlacklist: process.env.NUXT_COMMENT_KEYWORD_BLACKLIST || '',
		commentAvatarProxy: process.env.NUXT_COMMENT_AVATAR_PROXY || blogConfig.comment.avatarProxy,
		smtp: {
			host: process.env.SMTP_HOST || '',
			port: Number(process.env.SMTP_PORT || 465),
			user: process.env.SMTP_USER || '',
			pass: process.env.SMTP_PASSWORD || '',
			from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
		},
		public: {
			buildTime: new Date().toISOString(),
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
			ci: process.env.EDGEONE || process.env.EDGEONE_PAGES || process.env.TENCENTCLOUD_RUNENV === 'SCF' ? 'EdgeOne' : ci.name || '',
		},
	},

	content: {
		build: {
			markdown: {
				highlight: false,
				remarkPlugins: {
					'remark-math': {},
					'remark-reading-time': {},
				},
				rehypePlugins: {
					'rehype-katex': {},
				},
				toc: { depth: 4, searchDepth: 4 },
			},
		},
	},

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},
})
