/**
 * 通用类型定义
 */

// 基础实体接口
export interface BaseEntity {
	id: string
	created?: number
	updated?: number
}

// 可导航的实体
export interface NavigableEntity {
	label: string
	to?: string
	icon?: string
}

// 带计数的实体
export interface CountableEntity {
	name: string
	count: number
}

// 分页相关
export interface PaginationInfo {
	page: number
	pageSize: number
	total: number
	totalPages: number
}

// 加载状态
export interface LoadingState {
	loading: boolean
	error: string | null
	lastUpdated: Date | null
}

// 搜索相关
export interface SearchResult<T> {
	items: T[]
	query: string
	total: number
}

// 排序选项
export type SortOrder = 'asc' | 'desc'
export type SortField = 'date' | 'updated' | 'title' | 'recommend' | 'count'

// 响应式数据
export interface ResponsiveData {
	desktop: any
	tablet: any
	mobile: any
}

// 主题相关
export interface ThemeConfig {
	icon: string
	tip: string
}

// 统计相关
export interface StatItem {
	label: string
	value: number | string
	icon?: string
	color?: string
}
