<script setup lang="ts">
import blogConfig from '~~/blog.config'

defineOptions({ name: 'FriendsShortcuts' })

interface Shortcut {
	label: string
	icon: string
	href: string
	external?: boolean
	desc?: string
}

const shortcuts: Shortcut[] = [
	{ label: '友情链接', icon: 'ph:link-bold', href: '/links', desc: '查看朋友名录' },
	{ label: 'OPML 订阅', icon: 'ph:rss-bold', href: '/efu.opml', external: true, desc: '导入到阅读器' },
	{ label: 'Atom 源', icon: 'ph:broadcast-bold', href: '/atom.xml', external: true, desc: '订阅本站更新' },
	{ label: '加入友链', icon: 'ph:envelope-simple-bold', href: `mailto:${blogConfig.profile.email}`, external: true, desc: '和我做朋友' },
]
</script>

<template>
<Widget title="快捷入口" icon="ph:paper-plane-tilt-bold" card>
	<ul class="shortcuts">
		<li v-for="s in shortcuts" :key="s.label">
			<NuxtLink
				v-if="!s.external"
				:to="s.href"
				class="shortcut"
			>
				<Icon :name="s.icon" class="s-icon" />
				<span class="s-text">
					<span class="s-label">{{ s.label }}</span>
					<span v-if="s.desc" class="s-desc">{{ s.desc }}</span>
				</span>
				<Icon name="ph:caret-right-bold" class="s-arrow" />
			</NuxtLink>
			<a
				v-else
				:href="s.href"
				target="_blank"
				rel="noopener noreferrer"
				class="shortcut"
			>
				<Icon :name="s.icon" class="s-icon" />
				<span class="s-text">
					<span class="s-label">{{ s.label }}</span>
					<span v-if="s.desc" class="s-desc">{{ s.desc }}</span>
				</span>
				<Icon name="ph:arrow-up-right-bold" class="s-arrow" />
			</a>
		</li>
	</ul>
</Widget>
</template>

<style lang="scss" scoped>
.shortcuts {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;
	margin: 0;
	padding: 0;
	list-style: none;
}

.shortcut {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	padding: 0.45rem 0.5rem;
	border: 1px solid transparent;
	border-radius: var(--radius-md);
	text-decoration: none;
	color: var(--font-color);
	transition: all 0.18s ease;

	&:hover {
		border-color: var(--c-border);
		background: var(--c-bg-2);
		color: var(--main-color);

		.s-arrow {
			color: var(--main-color);
			transform: translateX(2px);
		}
	}
}

.s-icon {
	flex-shrink: 0;
	width: 1.1rem;
	height: 1.1rem;
	color: var(--main-color);
}

.s-text {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.1rem;
	min-width: 0;
	line-height: 1.2;
}

.s-label {
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 600;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.s-desc {
	overflow: hidden;
	font-size: 0.7rem;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color-3);
}

.s-arrow {
	flex-shrink: 0;
	width: 0.85rem;
	height: 0.85rem;
	color: var(--font-color-3);
	transition: transform 0.18s ease, color 0.18s ease;
}
</style>
