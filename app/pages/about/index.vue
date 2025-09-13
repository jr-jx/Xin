<script setup lang="ts">
import blogConfig from '~~/blog.config'
import { introduction, personalitie, profile, skills } from './about'

// SEO 设置
useSeoMeta({
	title: `关于我`,
	description: blogConfig.profile.bio,
})
</script>

<template>
<div class="about-page">
	<!-- 主要内容 -->
	<main class="main-content" data-aos="fade-up">
		<!-- 个人信息卡片 -->
		<Widget card class="profile-card" title="个人信息" icon="mdi:user">
			<div class="profile-header">
				<!-- 左侧头像区域 -->
				<div class="profile-avatar">
					<img
						:src="profile.avatar"
						:alt="profile.name"
						class="hover:scale-105 transition-transform duration-300"
					>
				</div>

				<!-- 中间信息区域 -->
				<div class="profile-info">
					<h1 class="profile-name hover:text-main transition-colors duration-300">
						{{ profile.name }}
					</h1>
					<p class="profile-bio">
						{{ profile.bio }}
					</p>
					<div class="profile-meta">
						<span class="meta-item hover:bg-main-10 transition-colors duration-300">
							<Icon name="mdi:map-marker" class="animate-bounce" />
							{{ profile.location }}
						</span>
						<span class="meta-item hover:bg-main-10 transition-colors duration-300">
							<Icon name="mdi:cake-variant" class="animate-pulse" />
							{{ profile.birthYear }}年出生
						</span>
						<span class="meta-item hover:bg-main-10 transition-colors duration-300">
							<Icon name="mdi:school" class="animate-bounce" />
							{{ profile.education }}
						</span>
						<span class="meta-item hover:bg-main-10 transition-colors duration-300">
							<Icon name="mdi:briefcase" class="animate-pulse" />
							{{ profile.profession }}
						</span>
					</div>
				</div>

				<!-- 右侧社交链接区域 -->
				<div class="profile-contact-top">
					<a
						v-for="social in blogConfig.social"
						:key="social.label"
						:href="social.url"
						target="_blank"
						rel="noopener noreferrer"
						class="social-link-icon group"
						v-tip:="social.label"
					>
						<Icon
							:name="social.icon"
							class="transition-transform duration-300 group-hover:scale-125"
						/>
					</a>
				</div>
			</div>
		</Widget>

		<div class="skills-and-personalitie-section">
			<!-- 技能展示 -->
			<Widget grid class="skills-section" data-aos="fade-up" data-aos-delay="50" title="技能专长" icon="mdi:code-braces">
				<div class="skills-carousel">
					<div class="skills-track">
						<!-- 原始技能项 -->
						<div
							v-for="skill in skills"
							:key="`original-${skill.name}`"
							v-tip="skill.name"
							class="skill-icon-item"
						>
							<Icon :name="skill.icon" />
						</div>
						<!-- 复制的技能项，用于无缝循环 -->
						<div
							v-for="skill in skills"
							:key="`duplicate-${skill.name}`"
							v-tip="skill.name"
							class="skill-icon-item"
						>
							<Icon :name="skill.icon" />
						</div>
					</div>
				</div>
			</Widget>

			<!-- 性格展示 -->
			<Widget card class="personalitie-section" data-aos="fade-up" data-aos-delay="100" title="性格" icon="mdi:heart">
				<div class="personalitie-content">
					<div class="personalitie-info">
						<h3 class="personality-title">
							{{ personalitie.title }}
						</h3>
						<p class="personality-subtitle" :style="{ color: personalitie.color }">
							{{ personalitie.en_title }}
						</p>
					</div>
					<div class="personality-image">
						<img :src="personalitie.img" :alt="personalitie.title">
					</div>
				</div>
			</Widget>
		</div>

		<!-- 个人介绍 -->
		<Widget grid :title="introduction.title" icon="mdi:file-document" class="introduction-section" data-aos="fade-up" data-aos-delay="150">
			<div class="introduction-content">
				<p
					v-for="(paragraph, index) in introduction.content.split('\n\n')"
					:key="index"
					class="paragraph"
				>
					{{ paragraph }}
				</p>
			</div>
		</Widget>
	</main>
</div>
</template>

<style lang="scss" scoped>
.about-page {
	min-height: 100vh;
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

.main-content {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0 auto;
	padding: 0 0.5rem;
}

// 个人信息卡片
.profile-card {
	position: relative;
	overflow: hidden;
}

.profile-header {
	display: flex;
	align-items: flex-start;
	gap: 2rem;
	position: relative;
	padding: 1rem;

	@media (max-width: 768px) {
		flex-direction: column;
		align-items: center;
		gap: 0;
		text-align: center;
	}
}

.skills-and-personalitie-section {
	display: grid;
	grid-template-columns: 6fr 4fr;
	gap: 0.5rem;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		margin-top: 1rem;
	}
}

.profile-avatar {
	flex-shrink: 0;

	img {
		width: 100px;
		height: 100px;
		border: var(--border);
		border-radius: 50%;
		box-shadow: var(--shadow-sm);
		object-fit: cover;
	}
}

.profile-info {
	flex: 1;
}

// 联系方式 - 右上角
.profile-contact-top {
	display: flex;
	flex-direction: row;
	gap: 0.5rem;
	position: absolute;
	top: 0;
	right: 0;

	@media (max-width: 768px) {
		flex-direction: row;
		justify-content: center;
		position: static;
		margin-top: 1rem;
	}
}

.social-link-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background: var(--c-bg-2);
	text-decoration: none;
	color: var(--font-color-2);
	transition: all 0.2s ease;

	&:hover {
		border-color: var(--main-color);
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	.icon {
		width: 1.25rem;
		height: 1.25rem;
	}
}

.profile-name {
	margin-bottom: 0.5rem;
	font-size: 2rem;
	font-weight: 700;
	color: var(--font-color);

	@media (max-width: 768px) {
		font-size: 1.5rem;
	}
}

.profile-bio {
	margin-bottom: 1.5rem;
	font-size: 1.125rem;
	line-height: 1.6;
	color: var(--font-color-2);
}

.profile-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 1rem;

	@media (max-width: 768px) {
		justify-content: center;
	}
}

.meta-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	color: var(--font-color-2);

	.icon {
		width: 1rem;
		height: 1rem;
		color: var(--main-color);
	}
}

// 技能展示
.skills-section {
	display: grid;
	flex-direction: column;
}

// 性格展示
.personalitie-section {
	display: flex;
	flex-direction: column;
	position: relative;
	overflow: hidden;

	&:hover {
		.personalitie-content img {
			transform: scale(1.1);
		}
	}
}

.personalitie-content {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	height: 100%;
	padding: 0 1rem;

	img {
		transition: transform 0.3s ease;
	}
}

.personalitie-info {
	display: flex;
	flex: 1;
	flex-direction: column;
	gap: 0.75rem;
}

.personality-title {
	margin: 0;
	font-size: 1.5rem;
	font-weight: 700;
	line-height: 1.2;
	color: var(--font-color);
}

.personality-subtitle {
	margin: 0;
	font-size: 1.125rem;
	font-weight: 500;
	line-height: 1.3;
}

.personality-image {
	display: flex;
	align-items: center;
	justify-content: center;
	position: absolute;
	top: 0;
	right: 0;
	padding: 1rem;

	img {
		height: auto;
		max-width: 100%;
		max-height: 180px;
		border-radius: var(--radius);
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.05);
		}
	}
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-bottom: 0.5rem;
	font-size: 1.5rem;
	font-weight: 600;
	color: var(--font-color);
}

.title-icon {
	width: 1.5rem;
	height: 1.5rem;
	color: var(--main-color);
}

.skills-carousel {
	display: flex;
	align-items: center;
	position: relative;
	overflow: hidden;

	&::before,
	&::after {
		content: "";
		position: absolute;
		top: 0;
		bottom: 0;
		width: 1.5rem;
		pointer-events: none;
		z-index: 1;
	}

	&::before {
		left: 0;
		background: linear-gradient(to right, var(--card-bg), transparent);
		transition: background 0.3s ease;
		will-change: background;
	}

	&::after {
		right: 0;
		background: linear-gradient(to left, var(--card-bg), transparent);
		transition: background 0.3s ease;
		will-change: background;
	}
}

.skills-track {
	display: flex;
	gap: 0.75rem;
	width: max-content;
	animation: scroll-skills 25s linear infinite;

	&:hover {
		animation-play-state: paused;
	}
}

.skill-icon-item {
	display: flex;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	width: 3.5rem;
	height: 3.5rem;
	border: var(--border);
	border-radius: var(--radius);
	background: var(--c-bg-2);
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		border-color: var(--main-color);
		box-shadow: var(--shadow-md);
		background: var(--main-color-bg);
	}

	.icon {
		width: 1.75rem;
		height: 1.75rem;
		color: var(--font-color);
	}
}

// 轮播动画
@keyframes scroll-skills {
	0% {
		transform: translateX(0);
	}

	100% {
		transform: translateX(calc(-50% - 0.375rem));
	}
}

// 个人介绍
.introduction-content {
	line-height: 1.8;
}

.paragraph {
	margin-bottom: 1rem;
	font-size: 1rem;
	color: var(--font-color-2);

	&:last-child {
		margin-bottom: 0;
	}
}

// 响应式设计
@media (max-width: 768px) {
	.skills-and-personalitie-section {
		gap: 0.75rem;
	}

	.skills-carousel {
		&::before,
		&::after {
			width: 1rem;
		}
	}

	.skill-icon-item {
		width: 3rem;
		height: 3rem;

		.icon {
			width: 1.5rem;
			height: 1.5rem;
		}
	}

	.skills-track {
		gap: 0.5rem;
		animation-duration: 20s;
	}

	.fishbone-axis {
		gap: 1.5rem;
		padding: 0 1rem;
	}

	.fishbone-content {
		width: 260px;
	}

	.fishbone-card {
		height: 180px;
	}
}

@media (max-width: 480px) {
	.skill-icon-item {
		width: 2.5rem;
		height: 2.5rem;

		.icon {
			width: 1.25rem;
			height: 1.25rem;
		}
	}

	.skills-track {
		gap: 0.5rem;
		animation-duration: 18s;
	}

	.fishbone-content {
		width: 220px;
	}

	.fishbone-card {
		height: 160px;
		padding: 1rem;
	}

	.fishbone-axis {
		gap: 1.5rem;
		padding: 0 1rem;
	}

	.fishbone-item {
		min-width: 220px;
	}

	.fishbone-container {
		padding: 2rem 0;
	}
}
</style>
