import type { NavigableEntity } from './common'

export interface MenuItem extends NavigableEntity {
	items?: MenuItem[]
}

export interface SocialLink extends NavigableEntity {
	// SocialLink 必须包含 to 和 icon
	to: string
	icon: string
}

export interface NavigationMenu {
	menu: MenuItem[]
	socialLinks: SocialLink[]
}
