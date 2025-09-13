<script lang="ts" setup>
import { Icon, UDLGroup } from '#components'
import { packageManager, version } from '~~/package.json'
import pnpmWorkspace from '~~/pnpm-workspace.yaml'

const appConfig = useAppConfig()
const { public: { arch, ci, nodeVersion, platform } } = useRuntimeConfig()

const packages = Object.assign({}, ...Object.values(pnpmWorkspace.catalogs as any)) as Record<string, string>
const [pm, pmVersion] = packageManager.split('@') as [string, string]

const ciPlatform = computed(() => {
	const iconName = ciIcons[ci]
	if (!iconName)
		return ''

	const iconNode = iconName.startsWith('http')
		? h('img', { src: iconName, alt: '' })
		: h(Icon, { name: iconName })

	return h('span', {}, [iconNode, ` ${ci.split(' ')[0]}`])
})

const service = computed(() => ([
	...ci ? [{ label: '构建平台', value: ciPlatform }] : [],
	{ label: '图片存储', value: () => [h('img', { src: 'https://www.lightxi.com/favicon.ico', alt: '' }), '晞云云存储'] },
	{ label: '软件协议', value: 'MIT' },
	{ label: '文章许可', value: appConfig.license.name },
	{ label: '规范域名', value: getDomain(appConfig.site.url) },
]))

const techstack = computed(() => ([
	{ label: 'Blog', value: version },
	{ label: 'Vue', value: packages.vue },
	{ label: 'Nuxt', value: packages.nuxt },
	{ label: 'Content', value: packages['@nuxt/content'] },
	{ label: 'Node', value: nodeVersion },
	{ label: pm, value: pmVersion },
	{ label: 'OS', value: platform },
	{ label: 'Arch', value: arch },
]))
</script>

<template>
<widget title="技术信息" grid icon="carbon:tool-kit">
	<UDLGroup :items="service" />
	<UExpand name="技术栈">
		<UDLGroup size="small" :items="techstack" />
	</UExpand>
</widget>
</template>

<style lang="scss" scoped>
.dl-group :deep(img) {
	height: 1.2em;
	vertical-align: sub;
}
</style>
