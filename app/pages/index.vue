<script setup lang="ts">
import { useContentLoader } from '../composables/useContentLoader'

const appConfig = useAppConfig()
useSeoMeta({
	title: '首页',
	description: `${appConfig.site.title} - ${appConfig.site.description}`,
})

// 使用内容加载器
const { publishedPosts, postsPending } = useContentLoader()

// 侧边栏相关数据来源于 Sidebar 组件
</script>

<template>
<div class="home-page">
	<!-- 主要内容 -->
	<main class="main-content">
		<!-- 主要内容区域 -->
		<div class="content-layout">
			<!-- 文章列表 -->
			<div class="post-list-section" data-aos="fade-up">
				<CategoriesBar active-category="" />
				<PostList :posts="publishedPosts" :loading="postsPending" />
			</div>

			<!-- 侧边栏 -->
			<AppSidebar data-aos="fade-up" />
		</div>
	</main>
</div>
</template>

<style lang="scss" scoped>
.main-content {
	padding: 0.5rem 0;
}

.content-layout {
	display: grid;
	grid-template-columns: 3fr 1fr;
	gap: 0.5rem;
	padding: 0 0.5rem;

	@media screen and (max-width: 900px) {
		grid-template-columns: 1fr;
	}
}

.post-list-section {
	grid-column: span 1;
}

// 文本截断工具类
.line-clamp-2 {
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.line-clamp-3 {
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
}

/* 隐藏滚动条 */
.scrollbar-hide {
	-ms-overflow-style: none;  /* IE and Edge */
	scrollbar-width: none;  /* Firefox */

	&::-webkit-scrollbar {
		display: none;  /* Chrome, Safari and Opera */
	}
}

/* 自定义滚动条 */
::-webkit-scrollbar {
	width: 6px;
}

::-webkit-scrollbar-track {
	background: transparent;
}

::-webkit-scrollbar-thumb {
	border-radius: 3px;
	background: rgb(156 163 175 / 50%);

	&:hover {
		background: rgb(156 163 175 / 70%);
	}
}
</style>
