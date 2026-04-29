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
					: { to: item.link }"
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
	gap: 0.75rem;
	overflow-y: auto;
	width: 20rem;
	max-height: 70vh;
	padding: 0.75rem;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.app-group {
	display: flex;
	flex-direction: column;
	gap: 0.375rem;
}

.group-title {
	padding-left: 0.25rem;
	font-size: 0.75rem;
	font-weight: 500;
	color: var(--font-color-3);
}

.group-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 0.25rem;
}

.app-item {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	padding: 0.5rem 0.625rem;
	border-radius: var(--radius);
	text-decoration: none;
	color: var(--font-color);
	transition: background-color 0.2s ease;

	&:hover {
		background-color: var(--c-bg-2);

		.app-icon {
			color: var(--main-color);
		}
	}
}

.app-icon {
	flex-shrink: 0;
	width: 1.5rem;
	height: 1.5rem;
	color: var(--font-color-2);
	transition: color 0.2s ease;
}

.app-label {
	overflow: hidden;
	font-size: 0.85rem;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
