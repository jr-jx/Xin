<script setup lang="ts">
import type { ArticleCardProps } from '~/types/article'
import { formatDate } from '~/utils'

defineOptions({ name: 'ArticleCard' })

const { post } = defineProps<ArticleCardProps>()
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
			<!-- 分类标签移到封面上 -->
			<span v-if="post.categories && post.categories[0]" class="article-category">
				{{ post.categories[0] }}
			</span>
		</div>

		<!-- 内容区域 -->
		<div class="article-content">
			<!-- 文章标题 -->
			<h2 class="article-title">
				{{ post.title || '未命名文章' }}
			</h2>

			<!-- 文章描述 -->
			<p v-if="post.description" class="article-description">
				{{ post.description }}
			</p>

			<!-- 底部信息 -->
			<div class="article-footer">
				<!-- 日期和阅读时间 -->
				<div class="article-meta">
					<time class="article-date">
						<Icon name="i-carbon-calendar" class="meta-icon" />
						{{ formatDate(post.date || (post as any).updated) }}
					</time>
					<span v-if="post.readingTime" class="reading-time">
						<Icon name="i-carbon-time" class="meta-icon" />
						{{ post.readingTime.text }}
					</span>
				</div>

				<!-- 标签 -->
				<div v-if="post.tags && post.tags.length > 0" class="article-tags">
					<span
						v-for="tag in (post.tags || []).slice(0, 2)"
						:key="tag"
						class="tag-item"
					>
						<Icon name="material-symbols:tag" class="tag-icon" />
						{{ tag }}
					</span>
					<span
						v-if="(post.tags || []).length > 2"
						class="tag-more"
					>
						+{{ (post.tags || []).length - 2 }}
					</span>
				</div>
			</div>
		</div>
	</article>
</NuxtLink>
</template>

<style lang="scss" scoped>
.article-link {
	display: block;
	transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

	&:hover {
		.article-card {
			box-shadow:
				0 12px 24px -8px rgb(0 0 0 / 15%),
				0 0 0 1px var(--main-color);
		}

		.article-title {
			color: var(--main-color);
		}

		.cover-img {
			transform: scale(1.08);
		}

		.article-category {
			border-color: var(--main-color);
			background-color: var(--main-color);
			color: #FFF;
		}
	}
}

.article-card {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	height: 20rem;
	border-radius: var(--radius);
	box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
	background-color: var(--card-bg);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	will-change: transform, box-shadow;
}

.article-cover {
	position: relative;
	overflow: hidden;
	width: 100%;
	height: 12rem; /* 3:2 比例中的 3 部分 */
	background: linear-gradient(135deg, var(--c-bg-2) 0%, var(--c-bg) 100%);

	&.no-image {
		height: 8rem; /* 无图片时保持较小高度 */
	}

	.cover-img {
		display: block;
		width: 100%;
		height: 100%;
		transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
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
	flex: 1;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1.25rem;
}

.article-category {
	display: inline-flex;
	align-items: center;
	position: absolute;
	top: 0.75rem;
	left: 0.75rem;
	padding: 0.35rem 0.75rem;
	border: 1px solid rgb(255 255 255 / 30%);
	border-radius: calc(var(--radius) * 0.75);
	box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
	background-color: rgb(255 255 255 / 95%);
	backdrop-filter: blur(8px);
	font-size: 0.7rem;
	font-weight: 600;
	letter-spacing: 0.02em;
	color: var(--font-color);
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	z-index: 1;

	@media (prefers-color-scheme: dark) {
		border-color: rgb(255 255 255 / 20%);
		background-color: rgb(0 0 0 / 70%);
	}
}

.article-title {
	display: -webkit-box;
	overflow: hidden;
	margin: 0;
	font-size: 1.15rem;
	font-weight: 600;
	letter-spacing: -0.01em;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.5;
	color: var(--font-color);
	transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	-webkit-box-orient: vertical;
}

.article-description {
	display: -webkit-box;
	overflow: hidden;
	margin: 0;
	font-size: 0.875rem;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	line-height: 1.6;
	color: var(--font-color-2);
	-webkit-box-orient: vertical;
}

.article-footer {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	margin-top: auto;
	padding-top: 1rem;
	border-top: 1px solid var(--c-border);
}

.article-meta {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 1rem;
}

.article-tags {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.tag-item {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	padding: 0.2rem 0;
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-3);

	.tag-icon {
		opacity: 0.6;
		width: 0.75rem;
		height: 0.75rem;
	}
}

.tag-more {
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0;
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-3);
}

.article-date,
.reading-time {
	display: flex;
	align-items: center;
	gap: 0.35rem;
	font-size: 0.8rem;
	white-space: nowrap;
	color: var(--font-color-2);

	.meta-icon {
		opacity: 0.7;
		width: 0.875rem;
		height: 0.875rem;
	}
}

@media (max-width: 900px) and (min-width: 769px) {
	.article-card {
		flex-direction: row;
		align-items: stretch;
		height: auto;
		min-height: 15rem;
	}

	.article-cover {
		width: 45%; /* 3:2 比例中的 3 部分 */
		height: auto;

		&.no-image {
			width: 30%;
		}

		.cover-img,
		.cover-placeholder {
			height: 100%;
			min-height: 15rem;
		}
	}

	.article-content {
		gap: 0.75rem;
		width: 55%; /* 3:2 比例中的 2 部分 */
		padding: 1.25rem;
	}

	.article-title {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.article-description {
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}
}

@media (max-width: 768px) {
	.article-link:hover {
		transform: translateY(-2px);
	}

	.article-card {
		flex-direction: column;
		height: auto;
		min-height: 18rem;
	}

	.article-cover {
		width: 100%;
		height: 10.8rem; /* 保持 3:2 比例，移动端稍微调整 */

		&.no-image {
			height: 7rem;
		}

		.cover-img,
		.cover-placeholder {
			height: 100%;
			min-height: auto;
		}
	}

	.article-category {
		top: 0.5rem;
		left: 0.5rem;
		padding: 0.25rem 0.6rem;
		font-size: 0.65rem;
	}

	.article-content {
		gap: 0.5rem;
		width: 100%;
		padding: 1rem;
	}

	.article-title {
		font-size: 1rem;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.article-description {
		display: none;
	}

	.article-footer {
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.article-meta {
		gap: 0.75rem;
	}

	.article-date,
	.reading-time {
		font-size: 0.75rem;
	}

	.tag-item {
		padding: 0.25rem 0.5rem;
		font-size: 0.65rem;
	}
}
</style>
