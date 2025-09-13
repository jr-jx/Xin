<script setup lang="ts">
import InfoCard from '~/components/Aside/InfoCard.vue'
import AsideTag from '~/components/Aside/Tag.vue'
import PostToc from '~/components/post/PostToc.vue'
import { useContentLoader } from '~/composables/useContentLoader'
import SiteInfo from './Aside/SiteInfo.vue'

defineOptions({ name: 'AppSidebar' })

// 加载文章数据（用于统计信息）
useContentLoader()

const { isHome, isPost, isContentPage, hasToc } = usePageType()

// 根据页面类型决定显示哪些组件
const showToc = computed(() => hasToc.value && isPost.value)
const showTags = computed(() => isHome.value || isContentPage.value)
const showInfoCard = computed(() => isHome.value || isContentPage.value)
</script>

<template>
<div class="sidebar">
	<!-- 非粘性区域：个人介绍 -->
	<div v-if="showInfoCard" class="no-sticky">
		<InfoCard />
	</div>

	<!-- 粘性区域：根据页面类型显示不同内容 -->
	<div class="sticky">
		<!-- 文章目录：只在文章页面显示 -->
		<PostToc v-if="showToc" />

		<!-- 标签云：在首页和内容页面显示 -->
		<AsideTag v-if="showTags" />

		<!-- 技术信息 -->
		<SiteInfo />
	</div>
</div>
</template>

<style lang="scss" scoped>
.sidebar {
	display: none;
	flex-direction: column;

	@media (min-width: 900px) {
		display: flex;
	}

	@media (min-width: 1024px) {
		grid-column: span 1;
	}
}

.sticky {
	display: flex;
	flex-direction: column;
	position: sticky;
	top: calc(4rem + var(--space-2));
}

.no-sticky {
	display: flex;
	flex-direction: column;
	position: relative;
	margin-bottom: var(--space-2);
}
</style>
