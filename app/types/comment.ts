import type { BaseEntity } from './common'

export interface Comment extends BaseEntity {
	avatar: string
	comment: string
	commentText: string
	link: string
	mailMd5: string
	nick: string
	relativeTime: string
	url: string
}
