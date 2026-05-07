<script setup lang="ts">
import blogConfig from '~~/blog.config'

interface EmojiGroup {
	name: string
	items: Array<{ label: string, token: string }>
}

const emit = defineEmits<{ (e: 'select', token: string): void }>()

const defaultEmojiGroup: EmojiGroup = {
	name: 'Emoji',
	items: ['😀', '😁', '😂', '🤣', '😊', '🙂', '😉', '😍', '😘', '😜', '🤔', '😎', '🥳', '😭', '😤', '😱', '🙃', '👍', '👎', '👏', '🙏', '💪', '🎉', '🔥', '❤️', '💔', '⭐', '☕']
		.map(item => ({ label: item, token: item })),
}

const fallbackGroups: EmojiGroup[] = [
	defaultEmojiGroup,
	{
		name: '颜文字',
		items: [
			'(๑•̀ㅂ•́)و✧',
			'(・∀・)',
			'(｡･ω･｡)',
			'(´･_･`)',
			'(つД`)',
			'(￣▽￣)',
			'(｀・ω・´)',
			'(╯°□°）╯︵ ┻━┻',
			'ヽ(✿ﾟ▽ﾟ)ノ',
			'_(┐「ε:)_',
			'(づ￣ ³￣)づ',
			'(ง •̀_•́)ง',
			'(๑>◡<๑)',
			'(눈_눈)',
		].map(item => ({ label: item, token: item })),
	},
]

const groups = ref<EmojiGroup[]>(fallbackGroups)
const active = ref(defaultEmojiGroup.name)

const activeGroup = computed<EmojiGroup>(() => groups.value.find(group => group.name === active.value) || groups.value[0] || defaultEmojiGroup)

onMounted(async () => {
	try {
		const response = await fetch(blogConfig.comment.owoPath)
		if (!response.ok)
			return
		const data = await response.json()
		const next = normalizeGroups(data)
		if (next.length) {
			groups.value = next
			active.value = next[0]?.name || defaultEmojiGroup.name
		}
	}
	catch {}
})

function normalizeGroups(input: any): EmojiGroup[] {
	if (!input || typeof input !== 'object')
		return []

	if (Array.isArray(input)) {
		const items = input.map(normalizeItem).filter(Boolean) as EmojiGroup['items']
		return items.length ? [{ name: 'Emoji', items }] : []
	}

	return Object.entries(input).map(([name, value]) => {
		const rawItems = Array.isArray(value)
			? value
			: Array.isArray((value as any)?.container)
				? (value as any).container
				: []
		return {
			name,
			items: rawItems.map(normalizeItem).filter(Boolean) as EmojiGroup['items'],
		}
	}).filter(group => group.items.length)
}

function normalizeItem(item: any): { label: string, token: string } | null {
	if (typeof item === 'string')
		return { label: item, token: item }
	if (!item || typeof item !== 'object')
		return null
	const token = String(item.text || item.token || item.name || item.icon || '')
	if (!token)
		return null
	return {
		label: String(item.icon || item.label || item.name || token),
		token,
	}
}

function select(token: string) {
	emit('select', token)
}
</script>

<template>
<div class="owo-picker" role="dialog" aria-label="表情包">
	<div class="owo-grid" role="listbox" :aria-label="activeGroup.name">
		<button
			v-for="(item, index) in activeGroup.items"
			:key="`${activeGroup.name}-${item.token}-${index}`"
			type="button"
			class="owo-item"
			:title="item.token"
			@click="select(item.token)"
		>
			{{ item.label }}
		</button>
	</div>
	<div class="owo-tabs" aria-label="表情分类">
		<button
			v-for="group in groups"
			:key="group.name"
			type="button"
			:class="{ active: active === group.name }"
			:title="group.name"
			@click="active = group.name"
		>
			{{ group.name }}
		</button>
	</div>
</div>
</template>

<style lang="scss" scoped>
.owo-picker {
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border: 1px solid color-mix(in srgb, var(--border-color) 88%, transparent);
	border-radius: var(--radius);
	box-shadow: 0 16px 34px rgb(15 23 42 / 12%);
	background: var(--card-bg);
	backdrop-filter: blur(12px);
}

.owo-tabs {
	display: flex;
	gap: 0.25rem;
	overflow: auto;
	padding: 0.45rem;
	border-top: 1px solid color-mix(in srgb, var(--border-color) 82%, transparent);
	background: color-mix(in srgb, var(--card-bg) 96%, var(--font-color) 4%);

	button {
		flex-shrink: 0;
		min-height: 2rem;
		padding: 0.35rem 0.55rem;
		border-radius: var(--radius-sm);
		font-size: 0.76rem;
		font-weight: 700;
		text-align: center;
		color: var(--font-color-2);

		&:hover,
		&.active {
			background: var(--card-bg);
			color: var(--main-color);
		}
	}
}

.owo-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.3rem;
	overflow-y: auto;
	max-height: 13rem;
	padding: 0.6rem;
}

.owo-item {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 0;
	min-height: 2.15rem;
	max-width: 100%;
	padding: 0.1rem 0.55rem;
	border-radius: var(--radius-sm);
	background: transparent;
	font-size: 0.95rem;
	line-height: 1.2;
	white-space: nowrap;

	&:hover {
		background: var(--main-color-bg);
		color: var(--main-color);
	}
}
</style>
