<script setup lang="ts">
import blogConfig from '~~/blog.config'

defineOptions({ name: 'InfoCard' })

const profile = blogConfig.profile
const socials = blogConfig.social

const avatarError = ref(false)
const initials = computed(() => (profile.name?.trim()?.[0] || 'H'))
</script>

<template>
<Widget card>
	<div class="profile-content">
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
.profile-content {
	padding: 1.25rem 1rem;
	text-align: center;
}

.profile-avatar {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 5rem;
	height: 5rem;
	margin: 0 auto 1rem;
	border: 1px solid var(--border-color);
	border-radius: 50%;
	background-color: var(--main-color);
}

.avatar-img {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	object-fit: cover;
}

.avatar-text {
	font-size: 1.5rem;
	font-weight: 700;
	color: white;
}

.profile-name {
	margin-bottom: 0.5rem;
	font-size: 1.125rem;
	font-weight: 600;
	color: var(--font-color);
}

.profile-bio {
	margin-bottom: 1.5rem;
	font-size: 0.9rem;
	line-height: 1.6;
	color: var(--font-color-2);
}

.social-links {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
}

.social-link {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border: var(--border);
	border-radius: var(--radius);
	color: var(--font-color-2);
	transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.social-link:hover {
	border-color: var(--main-color);
	background-color: var(--card-bg);
	color: var(--main-color);
}

.social-icon {
	width: 1rem;
	height: 1rem;
}
</style>
