export function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms))
}

function throttle<T extends (...args: any[]) => any>(interval: number, fn: T): (...args: Parameters<T>) => void {
	let last = 0
	let timer: ReturnType<typeof setTimeout> | null = null
	return function (this: unknown, ...args: Parameters<T>) {
		const now = Date.now()
		const remaining = interval - (now - last)
		if (remaining <= 0) {
			if (timer) {
				clearTimeout(timer)
				timer = null
			}
			last = now
			fn.apply(this, args)
		}
		else if (!timer) {
			timer = setTimeout(() => {
				last = Date.now()
				timer = null
				fn.apply(this, args)
			}, remaining)
		}
	}
}

function debounce<T extends (...args: any[]) => any>(delayMs: number, fn: T): (...args: Parameters<T>) => void {
	let timer: ReturnType<typeof setTimeout> | null = null
	return function (this: unknown, ...args: Parameters<T>) {
		if (timer)
			clearTimeout(timer)
		timer = setTimeout(() => {
			timer = null
			fn.apply(this, args)
		}, delayMs)
	}
}

export const autoThrottle = (fn: () => void) => throttle(20, fn)
export const autoDebounce = (fn: () => void) => debounce(20, fn)

export function autoThrottleAndDebounce(fn: () => void) {
	const throttledFn = autoThrottle(fn)
	const debouncedFn = autoDebounce(fn)
	return () => {
		throttledFn()
		debouncedFn()
	}
}
