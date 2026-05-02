import type { Comment, CommentListResponse } from '~/types/comment'

export interface SubmitInput {
	slug: string
	url?: string
	nick: string
	mail?: string
	link?: string
	content: string
	pid?: string | null
	rid?: string | null
}

export function useComments(slug: MaybeRefOrGetter<string>) {
	const items = ref<(Comment & { children?: Comment[] })[]>([])
	const loading = ref(false)
	const submitting = ref(false)
	const error = ref<string | null>(null)
	const page = ref(1)
	const pageSize = ref(20)
	const total = ref(0)
	const parentTotal = ref(0)
	const hasMore = ref(false)

	async function load(reset = true) {
		loading.value = true
		error.value = null
		try {
			if (reset) {
				page.value = 1
				items.value = []
			}
			const res = await $fetch<CommentListResponse>('/api/comments', {
				params: {
					slug: toValue(slug),
					page: page.value,
					pageSize: pageSize.value,
				},
			})
			items.value = reset ? (res.items as any) : [...items.value, ...(res.items as any)]
			total.value = res.total
			parentTotal.value = res.parentTotal
			hasMore.value = res.hasMore
		}
		catch (err: any) {
			error.value = err?.statusMessage || err?.data?.statusMessage || err?.message || '加载失败'
		}
		finally {
			loading.value = false
		}
	}

	async function loadMore() {
		if (!hasMore.value || loading.value)
			return
		page.value += 1
		await load(false)
	}

	async function submit(payload: SubmitInput) {
		submitting.value = true
		try {
			const res = await $fetch<{ comment: Comment }>('/api/comments', {
				method: 'POST',
				body: payload,
			})
			// 回复：找到父节点的根评论，合并到 children
			const c = res.comment
			if (c.pid) {
				const rootId = c.rid || c.pid
				const root = items.value.find(i => i.id === rootId)
				if (root) {
					root.children = [...(root.children || []), c]
				}
				else {
					// 根不在当前页，刷新
					await load(true)
				}
			}
			else {
				items.value = [{ ...c, children: [] }, ...items.value]
				parentTotal.value += 1
				total.value += 1
			}
			return c
		}
		finally {
			submitting.value = false
		}
	}

	async function toggleLike(c: Comment) {
		if (c.liked)
			return
		try {
			const res = await $fetch<{ likes: number }>('/api/comments/like', {
				method: 'POST',
				body: { slug: toValue(slug), id: c.id },
			})
			c.likes = res.likes
			c.liked = true
		}
		catch (err: any) {
			if (err?.response?.status === 409) {
				c.liked = true
			}
		}
	}

	async function remove(c: Comment, hard = false) {
		await $fetch(`/api/comments/${c.id}`, {
			method: 'DELETE',
			params: { slug: toValue(slug), hard: hard ? 1 : 0 },
		})
		if (c.pid) {
			const rootId = c.rid || c.pid
			const root = items.value.find(i => i.id === rootId)
			if (root)
				root.children = (root.children || []).filter(x => x.id !== c.id)
		}
		else {
			items.value = items.value.filter(x => x.id !== c.id)
			parentTotal.value = Math.max(0, parentTotal.value - 1)
		}
	}

	return {
		items,
		loading,
		submitting,
		error,
		page,
		pageSize,
		total,
		parentTotal,
		hasMore,
		load,
		loadMore,
		submit,
		toggleLike,
		remove,
	}
}

export function useCommentAdmin() {
	const isAdmin = useState('comment-is-admin', () => false)

	async function check() {
		try {
			const res = await $fetch<{ isAdmin: boolean }>('/api/comments/admin/me')
			isAdmin.value = res.isAdmin
		}
		catch {
			isAdmin.value = false
		}
	}

	async function login(password: string) {
		await $fetch('/api/comments/admin/login', { method: 'POST', body: { password } })
		isAdmin.value = true
	}

	async function logout() {
		await $fetch('/api/comments/admin/logout', { method: 'POST' })
		isAdmin.value = false
	}

	return { isAdmin, check, login, logout }
}
