import { useMotion } from '@vueuse/motion'
import { defineNuxtPlugin } from 'nuxt/app'

type MotionInstance = ReturnType<typeof useMotion>

interface FadeUpElement extends HTMLElement {
	__motion?: MotionInstance
}

function parseDelay(value: unknown): number {
	if (value == null || value === '')
		return 0
	const n = typeof value === 'number' ? value : Number(value)
	return Number.isFinite(n) ? n : 0
}

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.directive<FadeUpElement>('fade-up', {
		mounted(el, binding) {
			const delay = parseDelay(binding.value)
			el.__motion = useMotion(el, {
				initial: { opacity: 0, y: 40 },
				visibleOnce: {
					opacity: 1,
					y: 0,
					transition: { duration: 500, delay, ease: 'easeOut' },
				},
			})
		},
		unmounted(el) {
			el.__motion?.stop()
			delete el.__motion
		},
	})
})
