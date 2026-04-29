<script setup lang="ts">
import type { ArticleCardProps } from '~/types/article'
import { getPostDate } from '~/utils/date'

defineOptions({ name: 'ArticleCard' })

const { post } = defineProps<ArticleCardProps>()

// 顶部 meta：取前两个分类
const metaItems = computed<string[]>(() => (post.categories || []).slice(0, 2))

// 底部 tag：取前 4 个
const tagItems = computed<string[]>(() => (post.tags || []).slice(0, 4))

// 相对时间
const relativeDate = computed(() => getPostDate(post.date || post.updated))
</script>

<template>
<NuxtLink :to="post.path" class="article-link">
	<article class="article-card">
		<!-- 封面 -->
		<div class="article-cover" :class="{ 'no-image': !post.image }">
			<NuxtImg
				v-if="post.image"
				:src="post.image"
				:alt="post.title || '封面'"
				class="cover-img"
				loading="lazy"
			/>
			<div v-else class="cover-placeholder">
				<Icon name="i-carbon-document" class="placeholder-icon" />
			</div>
		</div>

		<!-- 内容区域 -->
		<div class="article-content">
			<!-- 顶部 meta -->
			<div v-if="metaItems.length" class="article-meta">
				<span
					v-for="m in metaItems"
					:key="m"
					class="meta-item"
				>{{ m }}</span>
			</div>

			<!-- 文章标题 -->
			<h2 class="article-title">
				{{ post.title || '未命名文章' }}
			</h2>

			<!-- 底部：标签 + 相对时间 -->
			<div class="article-footer">
				<div class="article-tags">
					<span
						v-for="tag in tagItems"
						:key="tag"
						class="tag-item"
					>
						# {{ tag }}
					</span>
				</div>
				<time v-if="relativeDate" class="article-date">
					{{ relativeDate }}
				</time>
			</div>
		</div>
	</article>
</NuxtLink>
</template>

<style lang="scss" scoped>
.article-link {
	display: block;
	text-decoration: none;
	color: inherit;

	&:hover {
		.article-title {
			color: var(--main-color);
		}

		.article-meta {
			color: var(--main-color);
		}

		.cover-img {
			transform: scale(1.05);
		}
	}
}

.article-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: var(--border);
	border-radius: var(--radius-lg);
	background-color: var(--card-bg);
}

.article-cover {
	position: relative;
	overflow: hidden;
	width: 100%;
	max-height: 200px;
	aspect-ratio: 16 / 10;
	background: linear-gradient(135deg, var(--c-bg-2) 0%, var(--c-bg-1) 100%);

	.cover-img {
		display: block;
		width: 100%;
		height: 100%;
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
		object-fit: cover;
	}

	.cover-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;

		.placeholder-icon {
			opacity: 0.3;
			width: 3rem;
			height: 3rem;
			color: var(--font-color-2);
		}
	}
}

.article-content {
	display: flex;
	flex-direction: column;
	gap: 0.875rem;
	height: 10rem;
	padding: 1.25rem 1.5rem 1rem;
}

.article-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.875rem;
	font-size: 0.78rem;
	color: var(--font-color-2);
	transition: color 0.2s ease;
}

.meta-item {
	white-space: nowrap;
}

.article-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0;
	font-size: 1.25rem;
	font-weight: 700;
	letter-spacing: -0.01em;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.5;
	color: var(--font-color);
	transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	-webkit-box-orient: vertical;
}

.article-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: auto;
	padding-top: 0.25rem;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.875rem;
	min-width: 0;
}

.tag-item {
	overflow: hidden;
	font-size: 0.78rem;
	font-weight: 400;
	white-space: nowrap;
	color: var(--font-color-3);
}

.article-date {
	flex-shrink: 0;
	font-size: 0.78rem;
	font-weight: 400;
	white-space: nowrap;
	color: var(--font-color-3);
}

// ========== 平板（横向卡）==========
@media (min-width: 768px) and (max-width: 1023px) {
	.article-card {
		flex-direction: row;
		align-items: stretch;
		min-height: 10rem;
	}

	.article-cover {
		flex-shrink: 0;
		width: 30%;
		aspect-ratio: auto;
	}

	.article-content {
		flex: 1;
		gap: 0.625rem;
		padding: 1rem 1.25rem;
	}

	.article-title {
		font-size: 1.05rem;
	}
}

// ========== 手机 ==========
@media (max-width: 767px) {
	.article-content {
		gap: 0.75rem;
		padding: 1rem;
	}

	.article-title {
		font-size: 1.05rem;
	}

	.article-meta,
	.tag-item,
	.article-date {
		font-size: 0.75rem;
	}

	.article-tags {
		gap: 0.625rem;
	}
}
</style>
