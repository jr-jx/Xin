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
				{ rel: 'preconnect', href: blogConfig.twikoo.preload },
				{ rel: 'stylesheet', href: 'https://lib.baomitu.com/KaTeX/0.16.9/katex.min.css' },
				// 思源黑体 "Noto Sans SC", 思源宋体 "Noto Serif SC", "JetBrains Mono"
				{ rel: 'preconnect', href: 'https://fonts.gstatic.cn', crossorigin: '' },
				{ rel: 'stylesheet', href: 'https://fonts.googleapis.cn/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Noto+Sans+SC:wght@100..900&family=Noto+Serif+SC:wght@200..900&display=swap' },
				// 小米字体 "MiSans"
				{ rel: 'stylesheet', href: 'https://cdn-font.hyperos.mi.com/font/css?family=MiSans:100,200,300,400,450,500,600,650,700,900:Chinese_Simplify,Latin&display=swap' },
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
	],
	modules: ['nuxt-content-twoslash', '@nuxt/content', '@nuxt/eslint', '@nuxt/image', '@nuxt/scripts', '@nuxtjs/color-mode', '@pinia/nuxt', '@nuxt/icon', 'unplugin-yaml/nuxt', 'nuxt-aos'],

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
		build: {
			minify: 'terser',
			terserOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true,
				},
			},
		},
	},

	nitro: {
		compressPublicAssets: true,
	},

	icon: {
		serverBundle: {
			collections: ['ri', 'mdi', 'material-symbols', 'carbon', 'ph', 'devicon', 'skill-icons'],
		},
	},

	runtimeConfig: {
		public: {
			buildTime: new Date().toISOString(),
			nodeVersion: process.version,
			platform: process.platform,
			arch: process.arch,
			ci: process.env.TENCENTCLOUD_RUNENV === 'SCF' ? 'EdgeOne' : ci.name || '',
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
