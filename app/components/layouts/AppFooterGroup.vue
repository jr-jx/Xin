<script setup lang="ts">
import blogConfig from '~~/blog.config'

const avatar = blogConfig.profile.avatar

const footer = blogConfig.footer

const midIndex = computed(() => Math.floor((footer?.links?.length || 0) / 2))

function scrollTop() {
	if (import.meta.client) {
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}
}
</script>

<template>
<div class="footer-group">
	<div class="group">
		<template v-for="(link, idx) in footer.links" :key="`footer-link-${idx}`">
			<NuxtLink v-tip="link.label" :to="link.url" class="s-card">
				<Icon :name="link.icon" />
			</NuxtLink>
			<button
				v-if="idx === midIndex - 1"
				v-tip="'返回顶部'"
				type="button"
				class="avatar-button"
				aria-label="返回顶部"
				title="返回顶部"
				@click="scrollTop"
			>
				<Icon size="1.5rem" name="mdi:arrow-up" />
				<img :src="avatar" alt="返回顶部" class="avatar-img">
			</button>
		</template>
	</div>
	<div class="nav">
		<div v-for="group in footer.nav" :key="group.label" class="nav-group">
			<div class="group-title">
				{{ group.label }}
			</div>
			<div class="group-links">
				<NuxtLink v-for="link in group.links" :key="link.label" :to="link.link">
					{{ link.label }}
				</NuxtLink>
			</div>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.footer-group {
	display: grid;
	gap: 0.75rem;
	min-height: 15rem;
	max-width: 1250px;
	margin: 0 auto;
	padding: 0 0.5rem;

	@media screen and (max-width: 1250px) {
		padding: 0 1rem;
	}
}

.group {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 2.5rem;

	@media screen and (max-width: 768px) {
		display: none;
	}
}

.group a {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border: var(--border);
	border-radius: 50%;
	font-size: 1rem;
	color: var(--font-color-2);
	transition: all 0.3s ease;
	will-change: background-color, border-color, color;

	@media screen and (max-width: 768px) {
		width: 2.5rem;
		height: 2.5rem;
	}
}

.group a:hover {
	border-color: var(--main-color);
	background-color: var(--main-color);
	color: var(--white);
	transform: scale(1.05);
}

.avatar-button {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
	width: 3.5rem;
	height: 3.5rem;
	border: var(--border);
	border-radius: 50%;
	background: var(--card-bg);
	transition: all 0.3s ease;

	@media screen and (max-width: 768px) {
		width: 3rem;
		height: 3rem;
	}
}

.avatar-button:hover {
	border-color: var(--main-color);
	transform: scale(1.1);
}

.avatar-img {
	display: block;
	width: 100%;
	height: 100%;
	border-radius: 50%;
	transition: opacity 0.3s ease;
	object-fit: cover;
}

.avatar-button .iconify {
	position: absolute;
	opacity: 0;
	width: 1.5rem;
	height: 1.5rem;
	color: var(--font-color);
	transition: opacity 0.3s ease;
}

.avatar-button:hover .iconify {
	opacity: 1;
}

.avatar-button:hover .avatar-img {
	opacity: 0.2;
}

.nav {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
	align-items: start;
	gap: 1rem 2rem;
}

.nav-group {
	display: grid;
	gap: 0.25rem;
	padding: 0.25rem 0;
}

.group-title {
	padding-bottom: 0.25rem;
	font-size: 0.875rem;
	font-weight: 700;
	letter-spacing: 0.02em;
	color: var(--font-color-2);
}

.group-links {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 0.25rem;
	margin-top: 0.25rem;
}

.group-links a {
	display: inline-block;
	margin-left: -0.5rem;
	padding: 0.2rem 0.5rem;
	border: var(--border-always);
	border-radius: var(--radius);
	font-size: 0.875rem;
	line-height: 1.8;
	color: var(--font-color-2);
	transition: all 0.3s ease;
	will-change: background-color, border-color, color;
}

.group-links a:hover {
	border-color: var(--main-color);
	background-color: var(--main-color);
	color: var(--white);
}
</style>
