<script setup lang="ts">
import type { TocLink } from '@nuxt/content'
import { createReusableTemplate } from '@vueuse/core'
import { useTocAutoHighlight } from '~/composables/useToc'

const route = useRoute()
const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

// 如果此处出问题，还会影响到文章获取
// 若 watch route.path，SSG 下文章间路由时新文章数据会写入老文章键中
const { data: post } = await useAsyncData(
	() => `toc-${route.path}`,
	() => queryCollection('post').path(route.path).first(),
)

const toc = computed(() => post.value?.body?.toc)
const { activeTocItem } = useTocAutoHighlight(() => toc.value?.links ?? [])

function hasActiveChild(entry: TocLink, activeId: string | null): boolean {
	if (entry.id === activeId)
		return true
	return entry.children?.some(child => hasActiveChild(child, activeId)) ?? false
}
</script>

<template>
<Widget title="目录" card icon="carbon:menu">
	<!-- 目录内容 -->
	<div v-if="toc?.links?.length" class="toc-content">
		<DefineTemplate v-slot="{ tocItem }">
			<ol class="toc-list">
				<li
					v-for="(entry, index) in tocItem as TocLink[]"
					:key="index"
					class="toc-item" :class="{
						'has-active': hasActiveChild(entry, activeTocItem),
						'active': entry.id === activeTocItem,
					}"
				>
					<a
						:href="`#${entry?.id}`"
						:title="entry.text"
						class="toc-link"
					>
						{{ entry.text }}
					</a>
					<ReuseTemplate v-if="entry.children" :toc-item="entry.children" />
				</li>
			</ol>
		</DefineTemplate>

		<ReuseTemplate :toc-item="toc.links" />
	</div>

	<!-- 无目录时的提示 -->
	<div v-else class="no-toc">
		<Icon name="mdi:file-document-outline" class="no-toc-icon" />
		<span class="no-toc-text">暂无目录信息</span>
	</div>
</Widget>
</template>

<style lang="scss" scoped>
/* 目录内容 */
.toc-content {
	position: relative;
	overflow-y: auto;
	max-height: 60vh;

	/* 左侧竖线指示器 */
	&::before {
		content: "";
		position: absolute;
		inset: 0.5rem;
		top: 2px;
		width: 3px;
		border-radius: 2px;
		background-color: var(--border-color);
		transition: background-color 0.3s;
		will-change: background-color;
	}

	/* 自定义滚动条 */
	&::-webkit-scrollbar {
		width: 4px;
	}

	&::-webkit-scrollbar-track {
		background: transparent;
	}

	&::-webkit-scrollbar-thumb {
		border-radius: 2px;
		background: var(--border-color);

		&:hover {
			background: var(--font-color-3);
		}
	}
}

.toc-list {
	margin: 0;
	padding: 0;
	list-style: none;
}

.toc-item {
	opacity: 0.6;
	margin-bottom: 0.25rem;
	margin-left: 0.8rem;
	font-size: 0.94em;
	color: var(--font-color-2);
	transition: opacity 0.2s;

	&:last-child {
		margin-bottom: 0;
	}

	&:hover {
		opacity: 0.94;
	}

	&.has-active, &.active {
		opacity: 1;
		font-size: 1em;
	}

	/* 激活状态时在左侧竖线上显示小竖线指示器 */
	&.active::before {
		content: "";
		position: absolute;
		left: 0.5rem;
		margin: 0.2rem 0;
		padding: 0.6rem 1.5px;
		border-radius: 1rem;
		background-color: var(--main-color);
	}
}

.toc-link {
	display: block;
	overflow: hidden;
	padding: 0.2em 0.5em;
	border-radius: 0.5em;
	white-space: nowrap;
	text-decoration: none;
	text-overflow: ellipsis;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--c-bg-soft);
		color: var(--main-color);
	}
}

/* 嵌套目录样式 */
.toc-list .toc-list {
	margin-top: 0.25rem;

	.toc-link {
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
	}
}

/* 无目录提示 */
.no-toc {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.5rem;
	padding: 2rem 1rem;
	text-align: center;
	color: var(--font-color-3);
}

.no-toc-icon {
	opacity: 0.5;
	width: 2rem;
	height: 2rem;
}

.no-toc-text {
	font-size: 0.875rem;
}
</style>
