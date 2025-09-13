<script setup lang="ts">
const appConfig = useAppConfig()
const commentsStore = useCommentsStore()

// SEO 设置
useSeoMeta({
	title: `最近评论`,
	description: `最近评论`,
})

// 从 store 获取数据
const { comments, loading, error, hasComments } = storeToRefs(commentsStore)

onMounted(async () => {
	// 如果已经有数据且不是很久之前更新的，则不需要重新获取
	if (hasComments.value && commentsStore.lastUpdated) {
		const timeDiff = Date.now() - commentsStore.lastUpdated.getTime()
		// 如果数据是5分钟内更新的，则不需要重新获取
		if (timeDiff < 5 * 60 * 1000) {
			return
		}
	}

	// 获取最近评论
	await commentsStore.fetchRecentComments(
		appConfig.twikoo?.envId,
		999,
		false,
	)
})

// 刷新评论
async function refreshComments() {
	await commentsStore.fetchRecentComments(
		appConfig.twikoo?.envId,
		999,
		false,
	)
}
</script>

<template>
<div class="recentcomments-page" data-aos="fade-up">
	<PageBanner
		title="最近评论"
		desc="最近评论"
		footer="最近评论"
		image="https://cdn.lightxi.com/cloudreve/uploads/2025/08/03/S9ethiQA_9298cf4b972a1ea927236a66a18e4e27.jpg"
	/>
	<div class="container">
		<!-- 加载状态 -->
		<div v-if="loading" class="loading-state">
			<div class="loading-spinner" />
			<p>正在加载评论...</p>
		</div>

		<!-- 错误状态 -->
		<div v-else-if="error" class="error-state">
			<p class="error-message">
				{{ error }}
			</p>
			<button class="retry-button" @click="refreshComments">
				重试
			</button>
		</div>

		<!-- 评论网格 -->
		<div v-else class="comment-grid">
			<NuxtLink
				v-for="(comment, index) in comments"
				:key="comment.id"
				:to="`${comment.url}#${comment.id}`"
				class="comment-card"
				data-aos="fade-up"
				:data-aos-delay="50 * index"
			>
				<div class="comment-header">
					<div class="comment-avatar">
						<img :src="comment.avatar" :alt="comment.nick">
					</div>
					<div class="comment-info">
						<div class="comment-nick">
							{{ comment.nick }}
						</div>
						<div class="comment-time">
							{{ formatDate(new Date(comment.created || Date.now())) }}
						</div>
					</div>
				</div>
				<div class="comment-content">
					<div class="comment-text">
						{{ comment.commentText }}
					</div>
				</div>
			</NuxtLink>

			<!-- 空状态 -->
			<div v-if="!hasComments && !loading" class="empty-state">
				<p>暂无评论</p>
			</div>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
// 容器样式
.container {
	margin: 0 auto;
	padding: 0 0.5rem;
}

// 网格布局
.comment-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	align-items: start;
	gap: 0.5rem;
	margin-top: 0.5rem;

	// 中等屏幕：2列布局
	@media (max-width: 1199px) and (min-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
	}

	// 小屏幕：1列布局
	@media (max-width: 767px) {
		grid-template-columns: 1fr;
	}

	// 空状态样式
	&:empty::after {
		content: "暂无评论";
		display: block;
		grid-column: 1 / -1;
		padding: 3rem;
		font-size: 1.1rem;
		text-align: center;
		color: var(--font-color-3);
	}

	// 加载状态
	&:has(.loading) {
		opacity: 0.7;
	}
}

// 评论卡片
.comment-card {
	display: flex;
	flex-direction: column;
	height: 120px;
	padding: 0.725rem;
	border: var(--border);
	border-radius: 8px;
	box-shadow: var(--shadow-sm);
	background: var(--card-bg);
	text-decoration: none;
	color: inherit;
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
	}

	// 内容区域对齐
	.comment-content {
		justify-content: space-between;
	}
}

// 评论头部
.comment-header {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--border-color);
	transition: border-color 0.3s ease;
	will-change: border-color;
}

// 头像样式
.comment-avatar {
	flex-shrink: 0;
	overflow: hidden;
	width: 32px;
	height: 32px;
	border: 1px solid var(--border-color);
	border-radius: 50%;
	transition: border-color 0.3s ease;
	will-change: border-color;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

// 评论信息
.comment-info {
	display: flex;
	flex: 1;
	flex-direction: row;
	justify-content: space-between;
	min-width: 0;
}

.comment-nick {
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 600;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--font-color);
}

.comment-time {
	font-size: 0.8rem;
	white-space: nowrap;
	color: var(--font-color-3);
}

// 评论内容
.comment-content {
	display: flex;
	flex: 1;
	flex-direction: column;
	overflow: hidden;

	.comment-text {
		display: -webkit-box;
		flex: 1;
		overflow: hidden;
		max-height: calc(1.5em * 2);
		font-size: 0.9rem;
		-webkit-line-clamp: 2;
		line-height: 1.5;
		text-overflow: ellipsis;
		color: var(--font-color-2);
		-webkit-box-orient: vertical;
	}
}

// 加载状态
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 1rem;
	text-align: center;

	.loading-spinner {
		width: 40px;
		height: 40px;
		margin-bottom: 1rem;
		border: 3px solid var(--border-color);
		border-top: 3px solid var(--main-color);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	p {
		font-size: 1rem;
		color: var(--font-color-2);
	}
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

// 错误状态
.error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 3rem 1rem;
	text-align: center;

	.error-message {
		margin-bottom: 1rem;
		font-size: 1rem;
		color: var(--error-color, #EF4444);
	}

	.retry-button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 6px;
		background: var(--main-color);
		font-size: 0.9rem;
		color: white;
		transition: all 0.2s ease;
		cursor: pointer;

		&:hover {
			opacity: 0.8;
		}
	}
}

// 空状态
.empty-state {
	grid-column: 1 / -1;
	padding: 3rem;
	font-size: 1.1rem;
	text-align: center;
	color: var(--font-color-3);
}

// 响应式优化
@media (max-width: 480px) {
	.container {
		padding: 0 0.5rem;
	}

	.comment-card {
		height: 120px;
		padding: 1.25rem;
	}

	.comment-avatar {
		width: 38px;
		height: 38px;
	}

	.comment-nick {
		font-size: 0.9rem;
	}

	.comment-text {
		max-height: calc(1.4em * 2);
		font-size: 0.85rem;
		line-height: 1.4;
	}
}
</style>
