import type { Comment, CommentAdminSettings, CommentListResponse, CommentSubmitMode } from '~/types/comment'

export interface SubmitInput {
	slug: string
	url?: string
	nick?: string
	mail?: string
	link?: string
	content: string
	mode?: CommentSubmitMode
	pid?: string | null
	rid?: string | null
}

export function useComments(slug: MaybeRefOrGetter<string>) {
	const items = ref<Comment[]>([])
	const loading = ref(false)
	const submitting = ref(false)
	const error = ref<string | null>(null)
	const page = ref(1)
	const pageSize = ref(20)
	const total = ref(0)
	const parentTotal = ref(0)
	const hasMore = ref(false)
	const includeHidden = ref(false)

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
					includeHidden: includeHidden.value ? 1 : undefined,
				},
			})
			items.value = reset ? res.items : [...items.value, ...res.items]
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
			const comment = res.comment
			if (comment.pid) {
				const rootId = comment.rid || comment.pid
				const root = items.value.find(item => item.id === rootId)
				if (root) {
					root.children = [...(root.children || []), comment]
					total.value += 1
				}
				else {
					await load(true)
				}
			}
			else {
				parentTotal.value += 1
				total.value += 1
				items.value = [{ ...comment, children: [] }, ...items.value]
			}
			return comment
		}
		finally {
			submitting.value = false
		}
	}

	async function toggleLike(comment: Comment) {
		if (comment.liked)
			return
		try {
			const res = await $fetch<{ likes: number }>('/api/comments/like', {
				method: 'POST',
				body: { slug: toValue(slug), id: comment.id },
			})
			comment.likes = res.likes
			comment.liked = true
		}
		catch (err: any) {
			if (err?.response?.status === 409)
				comment.liked = true
		}
	}

	async function remove(comment: Comment, hard = false) {
		await $fetch(`/api/comments/${comment.id}`, {
			method: 'DELETE',
			params: { slug: toValue(slug), hard: hard ? 1 : 0 },
		})
		if (!hard && includeHidden.value) {
			mergeComment({ ...comment, hidden: true })
			return
		}
		removeLocal(comment)
	}

	function removeLocal(comment: Comment) {
		let removedCount = 1
		if (comment.pid) {
			const rootId = comment.rid || comment.pid
			const root = items.value.find(item => item.id === rootId)
			if (root)
				root.children = (root.children || []).filter(child => child.id !== comment.id)
		}
		else {
			removedCount += comment.children?.length || 0
			items.value = items.value.filter(item => item.id !== comment.id)
			parentTotal.value = Math.max(0, parentTotal.value - 1)
		}
		total.value = Math.max(0, total.value - removedCount)
	}

	function mergeComment(next: Comment) {
		if (next.pid) {
			const rootId = next.rid || next.pid
			const root = items.value.find(item => item.id === rootId)
			if (!root)
				return
			const children = root.children || []
			const index = children.findIndex(child => child.id === next.id)
			if (index >= 0)
				children[index] = { ...children[index], ...next }
			root.children = [...children]
			return
		}

		const index = items.value.findIndex(item => item.id === next.id)
		if (index >= 0)
			items.value[index] = { ...items.value[index], ...next }
	}

	async function patchComment(comment: Comment, patch: { pinned?: boolean, hidden?: boolean }) {
		const res = await $fetch<{ comment: Comment }>(`/api/comments/${comment.id}`, {
			method: 'PATCH',
			body: {
				slug: toValue(slug),
				...patch,
			},
		})
		mergeComment(res.comment)
		if (!res.comment.pid && typeof patch.pinned === 'boolean')
			await load(true)
		return res.comment
	}

	async function hide(comment: Comment) {
		const next = await patchComment(comment, { hidden: true })
		if (!includeHidden.value)
			removeLocal(next)
		return next
	}

	async function restore(comment: Comment) {
		return await patchComment(comment, { hidden: false })
	}

	async function togglePin(comment: Comment) {
		return await patchComment(comment, { pinned: !comment.pinned })
	}

	async function setIncludeHidden(next: boolean) {
		if (includeHidden.value === next)
			return
		includeHidden.value = next
		await load(true)
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
		includeHidden,
		load,
		loadMore,
		submit,
		toggleLike,
		remove,
		hide,
		restore,
		togglePin,
		setIncludeHidden,
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

	async function getSettings() {
		return await $fetch<CommentAdminSettings>('/api/comments/admin/settings')
	}

	async function updateSettings(settings: Partial<CommentAdminSettings>) {
		return await $fetch<CommentAdminSettings>('/api/comments/admin/settings', {
			method: 'PATCH',
			body: settings,
		})
	}

	return { isAdmin, check, login, logout, getSettings, updateSettings }
}
