import { differenceInMilliseconds, format, formatDistanceToNow } from 'date-fns'
import { dateLocale } from '~~/blog.config'

// 通用日期解析函数
function parseDate(input?: string | Date): Date | null {
	if (!input)
		return null

	const d = input instanceof Date ? input : new Date(input)
	return Number.isNaN(d.getTime()) ? null : d
}

export function getIsoDatetime(date?: string | Date): string | undefined {
	const parsed = parseDate(date)
	return parsed?.toISOString()
}

export function getPostDate(date?: string | Date) {
	const parsed = parseDate(date)
	if (!parsed)
		return ''

	const now = new Date()

	const isWithinAWeek = differenceInMilliseconds(now, parsed) < 1000 * 60 * 60 * 24 * 7
	if (isWithinAWeek) {
		return formatDistanceToNow(parsed, { addSuffix: true, locale: dateLocale })
	}
	else if (isSameYear(now, parsed)) {
		return format(parsed, 'M月d日')
	}
	else {
		return format(parsed, 'yy年M月d日')
	}
}

export function isSameYear(date1?: string | Date, date2?: string | Date) {
	const parsed1 = parseDate(date1)
	const parsed2 = parseDate(date2)
	return parsed1 && parsed2 && parsed1.getFullYear() === parsed2.getFullYear()
}

/**
 * 格式化日期为相对时间或标准格式
 * @param input 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export function formatDate(input?: string | Date): string {
	const parsed = parseDate(input)
	if (!parsed)
		return ''

	const now = new Date()
	const diffTime = now.getTime() - parsed.getTime()
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

	if (diffDays === 0) {
		return '今天'
	}
	else if (diffDays === 1) {
		return '昨天'
	}
	else if (diffDays === 2) {
		return '前天'
	}
	else if (diffDays < 7) {
		return `${diffDays}天前`
	}
	else if (diffDays < 30) {
		const weeks = Math.floor(diffDays / 7)
		return weeks === 1 ? '1周前' : `${weeks}周前`
	}
	else {
		return new Intl.DateTimeFormat('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}).format(parsed)
	}
}

/**
 * 格式化日期为标准格式
 * @param input 日期字符串或Date对象
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDateStandard(
	input?: string | Date,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	},
): string {
	const parsed = parseDate(input)
	if (!parsed)
		return ''

	return new Intl.DateTimeFormat('zh-CN', options).format(parsed)
}

/**
 * 获取日期的时间戳
 * @param input 日期字符串或Date对象
 * @returns 时间戳
 */
export function getTimestamp(input?: string | Date): number {
	const parsed = parseDate(input)
	return parsed?.getTime() || 0
}

/**
 * 检查日期是否为今天
 * @param input 日期字符串或Date对象
 * @returns 是否为今天
 */
export function isToday(input?: string | Date): boolean {
	const parsed = parseDate(input)
	if (!parsed)
		return false

	const today = new Date()
	return parsed.toDateString() === today.toDateString()
}

/**
 * 检查日期是否为昨天
 * @param input 日期字符串或Date对象
 * @returns 是否为昨天
 */
export function isYesterday(input?: string | Date): boolean {
	const parsed = parseDate(input)
	if (!parsed)
		return false

	const yesterday = new Date()
	yesterday.setDate(yesterday.getDate() - 1)

	return parsed.toDateString() === yesterday.toDateString()
}
