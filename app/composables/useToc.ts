import type { TocLink } from '@nuxt/content'
import { computedWithControl, debouncedWatch, useElementSize, useEventListener } from '@vueuse/core'
import { onMounted } from 'vue'
import { autoThrottleAndDebounce } from '~/utils/async'

interface TocOffset {
	id: string
	offsetTop: number
}

export function useTocAutoHighlight(toc: MaybeRefOrGetter<TocLink[]>) {
	const activeTocItem = ref<string | null>(null)

	// 缓存 DOM 元素引用
	const scrollContainer = ref<HTMLElement | null>(null)
	const headerHeight = ref<number>(64) // 默认值

	// 缓存 header 高度，避免重复计算
	const updateHeaderHeight = () => {
		try {
			const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--header-height')
			if (cssValue) {
				headerHeight.value = Number.parseFloat(cssValue) * 16 + 32 // 1rem = 16px
			}
		}
		catch {
			// 如果获取失败，使用默认值
			headerHeight.value = 64
		}
	}

	const flattenToc = (toc: TocLink[]): TocOffset[] => {
		const offsetList: TocOffset[] = []

		const processItem = (item: TocLink) => {
			const element = document.getElementById(item.id)
			if (element) {
				offsetList.push({ id: item.id, offsetTop: element.offsetTop })
			}
			if (item.children) {
				item.children.forEach(processItem)
			}
		}

		toc.forEach(processItem)
		return offsetList
	}

	const tocOffsets = computedWithControl(
		() => toValue(toc),
		() => {
			const flattened = flattenToc(toValue(toc))
			// 按 offsetTop 降序排列，便于查找
			return flattened.sort((a, b) => b.offsetTop - a.offsetTop)
		},
	)

	const updateActiveToc = () => {
		if (!tocOffsets.value.length)
			return

		const scrollPosition = window.scrollY + headerHeight.value

		// 利用数组已排序的特性，找到第一个满足条件的元素
		const currentItem = tocOffsets.value.find(item => item.offsetTop <= scrollPosition)

		if (currentItem?.id !== activeTocItem.value) {
			activeTocItem.value = currentItem?.id || null

			// 只在 activeTocItem 变化时才滚动
			if (activeTocItem.value && scrollContainer.value) {
				const activeElement = scrollContainer.value.querySelector(`a[href="#${activeTocItem.value}"]`) as HTMLElement | null
				if (activeElement) {
					scrollContainer.value.scroll({
						top: activeElement.offsetTop - 20, // 添加一些偏移量
						behavior: 'smooth',
					})
				}
			}
		}
	}

	// 初始化时获取 header 高度
	onMounted(() => {
		updateHeaderHeight()
		scrollContainer.value = document.querySelector('#z-aside')
	})

	// 监听窗口大小变化，更新 header 高度
	useEventListener('resize', autoThrottleAndDebounce(() => updateHeaderHeight()), { passive: true })

	// 使用防抖的滚动处理
	useEventListener('scroll', autoThrottleAndDebounce(() => updateActiveToc()), { passive: true })

	const { height: bodyHeight } = useElementSize(document?.body)
	debouncedWatch(bodyHeight, tocOffsets.trigger)

	return {
		activeTocItem,
	}
}
