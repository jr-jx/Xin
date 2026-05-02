import type { InjectionKey, Ref } from 'vue'

export type ReactionKey = 'heart' | 'fire' | 'thumbs-up' | 'smile'

export interface LikesState {
	/** link -> { reaction -> count } */
	counts: Record<string, Partial<Record<ReactionKey, number>>>
	/** link -> 已点过的表情集合 */
	liked: Record<string, ReactionKey[]>
	/** 本地乐观锁：防止点击过程中重复请求 */
	pending: Record<string, Set<ReactionKey>>
}

export const LIKES_STATE_KEY: InjectionKey<Ref<LikesState>> = Symbol('friends-likes-state')

export function createEmptyLikes(): LikesState {
	return { counts: {}, liked: {}, pending: {} }
}
