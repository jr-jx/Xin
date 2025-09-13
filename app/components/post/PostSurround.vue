<script setup lang="ts">
import type { Article } from '~/types/article'
import { createReusableTemplate } from '@vueuse/core'
import { getPostTypeClassName } from '~/composables/useContentLoader'
import { getIsoDatetime, getPostDate } from '~/utils/date'

const route = useRoute()

const { data: surrounds, refresh } = await useAsyncData(
	`surround-${route.path}`,
	() => queryCollectionItemSurroundings('post', route.path, { fields: ['date', 'title', 'type'] })
		.order('date', 'ASC')
		.where('stem', 'LIKE', `posts/%`),
)

const prev = computed(() => (surrounds.value ?? [])[0] ?? null)
const next = computed(() => (surrounds.value ?? [])[1] ?? null)

// 监听路由变化，强制刷新数据
watch(() => route.path, () => {
	refresh()
})

const [DefineTemplate, ReuseTemplate] = createReusableTemplate<{
	post: Article | null
	icon: string
	fallbackIcon: string
	fallbackText: string
	alignRight?: boolean
}>({
	inheritAttrs: false,
})
</script>

<template>
<DefineTemplate v-slot="{ post, icon, fallbackIcon, fallbackText, alignRight }">
	<NuxtLink v-if="post?.path" :to="post.path" class="surround-link" :class="{ 'align-right': alignRight }">
		<Icon :name="post ? icon : fallbackIcon" />
		<div class="surround-text">
			<strong class="title" :class="getPostTypeClassName(post?.type)">
				{{ post?.title || fallbackText }}
			</strong>
			<time v-if="post" :datetime="getIsoDatetime(post.date)">{{ getPostDate(post.date) }}</time>
		</div>
	</NuxtLink>
	<div v-else class="surround-link" :class="{ 'align-right': alignRight }">
		<Icon :name="fallbackIcon" />
		<div class="surround-text">
			<strong class="title">{{ fallbackText }}</strong>
		</div>
	</div>
</DefineTemplate>

<div v-if="prev || next" :key="route.path" class="surround-post">
	<ReuseTemplate
		:post="next" icon="solar:rewind-back-bold-duotone"
		fallback-icon="solar:document-add-bold-duotone" fallback-text="新故事即将发生"
	/>
	<ReuseTemplate
		:post="prev" icon="solar:rewind-forward-bold-duotone"
		fallback-icon="solar:reel-bold-duotone" fallback-text="已抵达博客尽头"
		align-right
	/>
</div>
</template>

<style lang="scss" scoped>
.surround-post {
	display: flex;
	justify-content: space-between;
	gap: 1rem;
	margin: 3rem 1rem 1rem;
}

.surround-link {
	display: flex;
	align-items: center;
	gap: 0.5em;
	transition: color 0.2s;

	&:not([href]) {
		opacity: 0.4;
		user-select: none;
	}

	&.align-right {
		// direction: rtl 会导致末尾标点居左
		flex-direction: row-reverse;
		text-align: right;
	}

	> .surround-text {
		transition: transform 0.2s;

		>time {
			display: block;
			opacity: 0.6;
			font-size: 0.8rem;
		}
	}

	> .iconify {
		opacity: 0.5;
		font-size: 2rem;
		transition: transform 0.2s;
	}

	&[href]:hover {
		color: var(--c-primary);

		> .surround-text {
			transform: translateX(-1em);
		}

		&.align-right > .surround-text {
			transform: translateX(1em);
		}

		> .iconify {
			opacity: 0.2;
			transform: scale(2);
		}
	}
}
</style>
