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
<section class="widget" :class="{ dim }">
	<hgroup v-if="title" class="widget-title text-creative">
		<slot name="title">
			<Icon v-if="icon" :name="icon" />
			{{ title }}
		</slot>
	</hgroup>

	<div class="widget-body" :class="{ 'widget-card': card, 'with-bg': bgImg, 'widget-grid': grid }">
		<NuxtImg v-if="bgImg" class="bg-img" :class="{ 'bg-right': bgRight }" :src="bgImg" alt="" />
		<slot />
	</div>
</section>
</template>

<style lang="scss" scoped>
.widget {
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
}

.widget-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0.5rem;
	color: var(--font-color-2);

	a {
		transition: color 0.2s;
	}

	> [onclick]:hover, > [href]:hover {
		color: var(--font-color);
	}
}

.widget-body {
	&.with-bg {
		position: relative;
		overflow: hidden;
		overflow: clip;
		z-index: 0;

		> .bg-img {
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
	}

	&.widget-card {
		padding: 0.5rem 0.8rem;
		border: var(--border);
		border-radius: 0.8rem;
		background-color: var(--card-bg);
		transition: all 0.3s ease;
		will-change: background-color, color;

		:deep(p) {
			padding: 0.2em 0;
		}
	}

	&.widget-grid {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 1rem;
		padding: 0.5rem 0.8rem;
		border: var(--border);
		border-radius: 0.8em;
		background-color: var(--card-bg);
		transition: all 0.3s ease;
		will-change: background-color, color;

		:deep(p) {
			padding: 0.2em 0;
		}
	}
}
</style>
