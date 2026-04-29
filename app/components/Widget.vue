<script setup lang="ts">
interface WidgetProps {
	title?: string
	card?: boolean
	grid?: boolean
	dim?: boolean
	bgImg?: string
	bgRight?: boolean
	icon?: string
}

defineOptions({ name: 'Widget' })

defineProps<WidgetProps>()
</script>

<template>
<section class="widget" :class="{ dim, 'widget-card': card, 'widget-grid': grid }">
	<NuxtImg v-if="bgImg" class="bg-img" :class="{ 'bg-right': bgRight }" :src="bgImg" alt="" />

	<hgroup v-if="title" class="widget-title">
		<slot name="title">
			<Icon v-if="icon" :name="icon" class="widget-icon" />
			<span>{{ title }}</span>
		</slot>
	</hgroup>

	<div class="widget-body">
		<slot />
	</div>
</section>
</template>

<style lang="scss" scoped>
.widget {
	position: relative;
	overflow: hidden;
	font-size: 0.9em;

	.widget + & {
		margin-top: 1rem;
	}

	&.dim {
		opacity: 0.3;
		transition: opacity 0.2s;

		#z-aside:hover &, #z-aside.show & {
			opacity: 1;
		}
	}

	&.widget-card {
		padding: 1.25rem 1.25rem 1rem;
		border: var(--border);
		border-radius: var(--radius-lg);
		background-color: var(--card-bg);

		:deep(p) {
			padding: 0.2em 0;
		}
	}

	&.widget-grid {
		padding: 1.25rem 1.25rem 1rem;
		border: var(--border);
		border-radius: var(--radius-lg);
		background-color: var(--card-bg);

		:deep(p) {
			padding: 0.2em 0;
		}
	}
}

.bg-img {
	position: absolute;
	opacity: 0.2;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	pointer-events: none;
	z-index: -1;

	&.bg-right {
		left: 50%;
		width: 50%;
		mask-image: linear-gradient(to right, transparent, #FFF 50%);
	}
}

.widget-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0 0.875rem;
	font-size: 0.925rem;
	font-weight: 700;
	color: var(--font-color);

	.widget-icon {
		flex-shrink: 0;
		width: 1rem;
		height: 1rem;
	}

	a {
		transition: color 0.2s;
	}

	> [onclick]:hover, > [href]:hover {
		color: var(--main-color);
	}
}

.widget-body {
	position: relative;
	z-index: 0;
}
</style>
