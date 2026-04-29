<script setup lang="ts">
import blogConfig from '~~/blog.config'

defineOptions({ name: 'InfoCard' })

const profile = blogConfig.profile
const socials = blogConfig.social

const avatarError = ref(false)
const initials = computed(() => (profile.name?.trim()?.[0] || 'H'))
</script>

<template>
<Widget card class="info-card">
	<!-- 封面图 -->
	<div class="profile-banner">
		<img
			v-if="profile.cover"
			:src="profile.cover"
			alt=""
			class="banner-img"
		>
	</div>

	<!-- 头像（跨越封面和内容区域） -->
	<div class="profile-avatar">
		<img
			v-if="!avatarError"
			:src="profile.avatar"
			:alt="profile.name"
			class="avatar-img"
			@error="avatarError = true"
		>
		<span v-else class="avatar-text">{{ initials }}</span>
	</div>

	<!-- 个人信息 -->
	<div class="profile-content">
		<h3 class="profile-name">
			{{ profile.name }}
		</h3>
		<p class="profile-bio">
			{{ profile.bio }}
		</p>
		<div class="social-links">
			<a
				v-for="s in socials"
				:key="s.label"
				:href="s.url"
				target="_blank"
				class="social-link"
				:aria-label="s.label"
				:title="s.label"
				v-tip:="s.label"
			>
				<Icon :name="s.icon" class="social-icon" />
			</a>
		</div>
	</div>
</Widget>
</template>

<style lang="scss" scoped>
$avatar-size: 4.5rem;
$banner-height: 6rem;
$avatar-overlap: calc(#{$avatar-size} / 2);

.info-card {
	overflow: hidden;
}

.profile-banner {
	position: relative;
	overflow: hidden;
	width: calc(100% + 2.5rem);
	height: $banner-height;
	margin: -1.25rem -1.25rem 0;
	background-color: var(--c-bg-2);
}

.banner-img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.profile-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	width: $avatar-size;
	height: $avatar-size;
	margin: calc(-1 * #{$avatar-overlap}) auto 0;
	border: 3px solid var(--card-bg);
	border-radius: var(--radius-full);
	background-color: var(--main-color);
	z-index: 1;
}

.avatar-img {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: var(--radius-full);
	object-fit: cover;
}

.avatar-text {
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
}

.profile-content {
	padding-top: 0.5rem;
	text-align: center;
}

.profile-name {
	margin-bottom: 0.25rem;
	font-size: 1.125rem;
	font-weight: 700;
	color: var(--font-color);
}

.profile-bio {
	margin-bottom: 0.75rem;
	font-size: 0.85rem;
	line-height: 1.6;
	color: var(--font-color-2);
}

.social-links {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.375rem;
}

.social-link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: var(--radius-full);
	color: var(--font-color-2);
	transition: color 0.2s ease, background-color 0.2s ease;

	&:hover {
		background-color: var(--c-bg-2);
		color: var(--main-color);
	}
}

.social-icon {
	width: 1.35rem;
	height: 1.35rem;
}
</style>
