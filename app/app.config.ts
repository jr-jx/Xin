import blogConfig from '../blog.config'

export default defineAppConfig({
	...blogConfig,
	themes: {
		light: {
			icon: 'ph:sun-bold',
			tip: '浅色模式',
		},
		system: {
			icon: 'ph:monitor-bold',
			tip: '跟随系统',
		},
		dark: {
			icon: 'ph:moon-bold',
			tip: '深色模式',
		},
	},
	content: {
		codeblockCollapsibleRows: 10,
	},
})
