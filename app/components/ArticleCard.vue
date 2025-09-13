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
		<div v-if="post.image" class="article-cover">
			<NuxtImg :src="post.image" :alt="post.title || '封面'" class="cover-img" loading="lazy" />
		</div>

		<!-- 内容区域 -->
		<div class="article-content">
			<!-- 分类标签 -->
			<span v-if="post.categories && post.categories[0]" class="article-category">
				{{ post.categories[0] }}
			</span>

			<!-- 文章标题 -->
			<h2 class="article-title">
				{{ post.title || '未命名文章' }}
			</h2>

			<!-- 底部信息 -->
			<div class="article-footer">
				<!-- 标签 -->
				<div class="article-tags">
					<span
						v-for="tag in (post.tags || []).slice(0, 3)"
						:key="tag"
						class="tag-item"
					>
						<Icon name="material-symbols:tag" />
						{{ tag }}
					</span>
					<span
						v-if="(post.tags || []).length > 3"
						class="tag-more"
					>
						+{{ (post.tags || []).length - 3 }}
					</span>
				</div>

				<!-- 日期 -->
				<time class="article-date">
					<Icon name="i-carbon-calendar" class="date-icon" />
					{{ formatDate(post.date || (post as any).updated) }}
				</time>
			</div>
		</div>
	</article>
</NuxtLink>
</template>

<style lang="scss" scoped>
.article-link {
	display: block;

	&:hover {
		.article-card {
			border-color: var(--main-color);
		}

		.article-title {
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
	height: 18rem;
	border: var(--border);
	border-radius: var(--radius);
	background-color: var(--card-bg);
	transition: all 0.3s ease;
	will-change: transform, border-color;
}

.article-cover {
	overflow: hidden;
	width: 100%;
	height: 10rem; // 固定封面高度
	border-bottom: 1px solid var(--c-border);
	transition: border-color 0.3s ease;
	will-change: border-color;

	.cover-img {
		display: block;
		width: 100%;
		height: 100%;
		transition: transform 0.3s ease;
		object-fit: cover;
	}
}

.article-content {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.75rem;
	padding: 1rem;
}

.article-category {
	display: inline-flex;
	align-items: center;
	align-self: flex-start;
	padding: 0.25rem 0.5rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius);
	background-color: transparent;
	font-size: 0.75rem;
	font-weight: 600;
	color: var(--font-color-2);
	transition: all 0.2s ease;
}

.article-title {
	display: -webkit-box;
	flex: 1;
	overflow: hidden;
	margin: 0 0 0 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	-webkit-line-clamp: 2;
	line-height: 1.4;
	color: var(--font-color);
	transition: color 0.3s ease;
	-webkit-box-orient: vertical;
}

.article-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: auto;
	padding-top: 0.75rem;
	border-top: 1px solid var(--c-border);
	transition: border-color 0.3s ease;
	will-change: border-color;
}

.article-tags {
	display: flex;
	flex: 1;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;
}

.tag-item {
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.4rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius);
	background-color: transparent;
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-2);
	transition: all 0.2s ease;
}

.tag-more {
	display: inline-flex;
	align-items: center;
	padding: 0.2rem 0.4rem;
	border: 1px solid var(--c-border);
	border-radius: var(--radius);
	background-color: var(--c-bg-2);
	font-size: 0.7rem;
	font-weight: 500;
	color: var(--font-color-3);
}

.article-date {
	display: flex;
	align-items: center;
	font-size: 0.75rem;
	white-space: nowrap;
	color: var(--font-color-2);
}

.date-icon {
	width: 0.75rem;
	height: 0.75rem;
	margin-right: 0.25rem;
}

@media (max-width: 900px) and (min-width: 769px) {
	.article-card {
		flex-direction: row;
		align-items: stretch;
		height: auto;
	}

	.article-cover {
		width: 40%; /* 4:6 比例中的4 */
		height: auto;
		border-right: 1px solid var(--c-border);
		border-bottom: none;

		.cover-img {
			height: 100%;
			min-height: 120px;
		}
	}

	.article-content {
		gap: 0.75rem;
		width: 60%; /* 4:6 比例中的6 */
		padding: 1rem;
	}

	.article-title {
		margin: 0;
		-webkit-line-clamp: 3;
	}

	.article-footer {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: auto;
		padding-top: 0.75rem;
		border-top: 1px solid var(--c-border);
	}

	.article-tags {
		order: 2;
	}

	.article-date {
		order: 1;
	}
}

@media (max-width: 768px) {
	.article-card {
		flex-direction: column;
		height: 16rem;
	}

	.article-cover {
		width: 100%;
		height: 8rem; // 移动端固定封面高度
		border-right: none;
		border-bottom: 1px solid var(--c-border);

		.cover-img {
			height: 100%;
			min-height: auto;
		}
	}

	.article-content {
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem;
	}

	.article-title {
		-webkit-line-clamp: 2;
	}

	.article-footer {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.article-tags {
		order: 2;
	}

	.article-date {
		order: 1;
	}
}
</style>
