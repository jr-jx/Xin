<script setup lang="ts">
/**
 * 页面banner组件
 *
 * 使用示例：
 * <PageBanner
 *   title="这里是标题"
 *   desc="这里是简介"
 *   footer="这里是注释"
 *   image="/path/to/image.jpg"
 * >
 *   <template #header-slot>
 *     <div>头部插槽内容</div>
 *   </template>
 *   <div>主要内容</div>
 *   <template #footer-slot>
 *     <div>底部插槽内容</div>
 *   </template>
 * </PageBanner>
 */

interface BannerProps {
	/** 标题 */
	title?: string
	/** 简介 */
	desc?: string
	/** 注释 */
	footer?: string
	/** 背景图片 */
	image?: string
}

defineOptions({ name: 'PageBanner' })

defineProps<BannerProps>()
</script>

<template>
<div
	class="banner-page s-card" :class="[{ image }]"
	:style="{
		backgroundImage: image ? `url(${image})` : undefined,
	}"
>
	<div class="top">
		<div class="title">
			<span class="title-small">{{ title }}</span>
			<span class="title-big">{{ desc }}</span>
		</div>
		<div class="top-right">
			<slot name="header-slot" />
		</div>
	</div>

	<slot />

	<div class="footer">
		<div class="footer-left">
			{{ footer }}
		</div>
		<div class="footer-right">
			<slot name="footer-slot" />
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.banner-page {
	display: flex;
	flex-direction: column;
	position: relative;
	min-height: 300px;
	margin: 0 0.5rem;
	padding: 2rem;
	border-radius: 12px;
	box-shadow: var(--shadow-md);
	background-position: center;
	background-repeat: no-repeat;
	background-size: cover;

	.top {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 2rem;

		.title {
			display: flex;
			flex-direction: column;

			.title-small {
				font-size: 0.875rem;
				letter-spacing: 1px;
				text-transform: uppercase;
				color: var(--font-color-2);
			}

			.title-big {
				margin-top: 12px;
				font-size: 2.25rem;
				font-weight: bold;
				line-height: 1.2;
				color: var(--font-color);
			}
		}
	}

	.footer {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;

		.footer-left {
			opacity: 0.8;
			margin-top: auto;
			font-size: 0.875rem;
			color: var(--font-color-2);
		}
	}

	&.image {
		color: var(--white);

		.top {
			.title-small {
				opacity: 0.6;
				color: var(--white);
			}

			.title-big {
				color: var(--white);
			}
		}

		.footer {
			.footer-left {
				color: var(--white);
			}

			:deep(svg) {
				color: var(--white);
			}
		}
	}

	@media (max-width: 1200px) {
		min-height: 300px;
	}

	@media (max-width: 768px) {
		min-height: 260px;

		.top-right,
		.footer-right {
			display: none;
		}
	}
}
</style>
