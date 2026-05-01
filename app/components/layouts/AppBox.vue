<script setup lang="ts">
import blogConfig from '~~/blog.config'

defineOptions({ name: 'AppBox' })

const groups = blogConfig.appBox || []

function isExternal(link: string) {
	return /^https?:\/\/|^mailto:/.test(link)
}
</script>

<template>
<div class="app-box">
	<div
		v-for="group in groups"
		:key="group.title"
		class="app-group"
	>
		<span class="group-title">{{ group.title }}</span>
		<div class="group-grid">
			<component
				:is="isExternal(item.link) ? 'a' : 'NuxtLink'"
				v-for="item in group.items"
				:key="item.label"
				class="app-item"
				v-bind="isExternal(item.link)
					? { href: item.link, target: '_blank', rel: 'noopener noreferrer' }
					: { to: item.link, activeClass: '', exactActiveClass: '' }"
			>
				<Icon :name="item.icon" class="app-icon" />
				<span class="app-label">{{ item.label }}</span>
			</component>
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.app-box {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	overflow-y: auto;
	width: min(22rem, calc(100vw - 1rem));
	max-height: min(70vh, 32rem);
	padding: 0.5rem;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.app-group {
	display: flex;
	flex-direction: column;
	gap: 0.25rem;

	& + .app-group {
		margin-top: 0.25rem;
	}
}

.group-title {
	margin-bottom: 0.125rem;
	padding: 0 0.5rem;
	font-size: 0.75rem;
	font-weight: 500;
	letter-spacing: 0.05em;
	color: var(--font-color-3);
}

.group-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.125rem;
}

.app-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.625rem;
	border-radius: var(--radius);
	text-decoration: none;
	color: var(--font-color);
	transition: background-color 0.18s ease, color 0.18s ease;

	&:hover,
	&:focus-visible {
		outline: none;
		background-color: var(--main-color-bg);
		color: var(--main-color);

		.app-icon {
			color: var(--main-color);
			transform: scale(1.05);
		}
	}

	&:focus-visible {
		outline: 2px solid var(--main-color);
		outline-offset: 2px;
	}
}

.app-icon {
	flex-shrink: 0;
	width: 1.5rem;
	height: 1.5rem;
	color: var(--font-color-2);
	transition: color 0.18s ease, transform 0.18s ease;
}

.app-label {
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
