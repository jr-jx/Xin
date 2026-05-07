<script setup lang="ts">
import blogConfig from '~~/blog.config'

interface Props {
	submitting?: boolean
	replyTo?: { id: string, nick: string } | null
	compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	submitting: false,
	replyTo: null,
	compact: false,
})

const emit = defineEmits<{
	(e: 'submit', payload: { mode: 'manual', nick: string, mail: string, link: string, content: string }): void
	(e: 'cancel'): void
	(e: 'mailChange', value: string): void
}>()

const route = useRoute()
const PROFILE_KEY = 'xin_comment_profile'
const draftKey = computed(() => `xin_comment_draft:${route.path}`)

const nick = ref('')
const mail = ref('')
const link = ref('')
const content = ref('')
const errorMsg = ref<string | null>(null)
const showOwo = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const emojiPopoverRef = ref<HTMLElement | null>(null)

const maxLength = blogConfig.comment.maxLength
const contentLength = computed(() => content.value.length)
const hasDraft = computed(() => !!content.value.trim())
const submitText = computed(() => props.submitting ? '提交中…' : '发表评论')

onMounted(() => {
	loadProfile()
	content.value = localStorage.getItem(draftKey.value) || ''
	document.addEventListener('pointerdown', closeOwoOnOutside)
	document.addEventListener('keydown', closeOwoOnEscape)
})

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', closeOwoOnOutside)
	document.removeEventListener('keydown', closeOwoOnEscape)
})

watch(mail, (value) => {
	emit('mailChange', value)
})

watch(content, (value) => {
	try {
		if (value)
			localStorage.setItem(draftKey.value, value)
		else
			localStorage.removeItem(draftKey.value)
	}
	catch {}
})

function loadProfile() {
	try {
		const raw = localStorage.getItem(PROFILE_KEY)
		if (!raw)
			return
		const profile = JSON.parse(raw)
		nick.value = profile.nick || ''
		mail.value = profile.mail || ''
		link.value = profile.link || ''
		if (mail.value)
			emit('mailChange', mail.value)
	}
	catch {}
}

function persistProfile() {
	try {
		localStorage.setItem(PROFILE_KEY, JSON.stringify({
			nick: nick.value,
			mail: mail.value,
			link: link.value,
		}))
	}
	catch {}
}

function toggleOwo() {
	showOwo.value = !showOwo.value
}

function closeOwoOnOutside(event: PointerEvent) {
	if (!showOwo.value)
		return
	const target = event.target
	if (target instanceof Node && emojiPopoverRef.value?.contains(target))
		return
	showOwo.value = false
}

function closeOwoOnEscape(event: KeyboardEvent) {
	if (event.key === 'Escape')
		showOwo.value = false
}

function insertEmoji(token: string) {
	const textarea = textareaRef.value
	const start = textarea?.selectionStart ?? content.value.length
	const end = textarea?.selectionEnd ?? content.value.length
	content.value = `${content.value.slice(0, start)}${token}${content.value.slice(end)}`
	nextTick(() => {
		textareaRef.value?.focus()
		const cursor = start + token.length
		textareaRef.value?.setSelectionRange(cursor, cursor)
	})
}

function handleEmojiSelect(token: string) {
	insertEmoji(token)
	showOwo.value = false
}

function validateContent(): boolean {
	errorMsg.value = null
	if (!content.value.trim()) {
		errorMsg.value = '请填写评论内容'
		return false
	}
	if (content.value.length > maxLength) {
		errorMsg.value = `评论不能超过 ${maxLength} 字`
		return false
	}
	return true
}

function handleSubmit() {
	if (props.submitting || !validateContent())
		return
	if (!nick.value.trim()) {
		errorMsg.value = '请填写昵称'
		return
	}
	persistProfile()

	emit('submit', {
		mode: 'manual',
		nick: nick.value.trim(),
		mail: mail.value.trim(),
		link: link.value.trim(),
		content: content.value,
	})
}

function clearAfterSubmit() {
	content.value = ''
	showOwo.value = false
	errorMsg.value = null
	try {
		localStorage.removeItem(draftKey.value)
	}
	catch {}
}

defineExpose({ clearAfterSubmit })
</script>

<template>
<div class="comment-editor" :class="{ compact }">
	<div v-if="replyTo" class="reply-to">
		<Icon name="ph:arrow-bend-up-left-bold" />
		<span>正在回复 <b>@{{ replyTo.nick }}</b></span>
		<button type="button" class="cancel-reply" title="取消回复" @click="emit('cancel')">
			<Icon name="ph:x-bold" />
		</button>
	</div>

	<div class="composer-card">
		<div class="identity-row">
			<label class="identity-field">
				<span class="identity-label">昵称</span>
				<input v-model="nick" type="text" placeholder="怎么称呼你" maxlength="40" class="input">
			</label>
			<label class="identity-field">
				<span class="identity-label">邮箱</span>
				<input v-model="mail" type="email" placeholder="name@example.com" maxlength="120" class="input">
			</label>
			<label class="identity-field">
				<span class="identity-label">网站</span>
				<input v-model="link" type="url" placeholder="https://example.com" maxlength="200" class="input">
			</label>
		</div>

		<div class="editor-shell">
			<div class="editor-body">
				<textarea
					ref="textareaRef"
					v-model="content"
					class="textarea"
					:placeholder="replyTo ? `回复 @${replyTo.nick}` : '写下你的想法...'"
					:maxlength="maxLength"
					rows="5"
				/>

				<div class="editor-inline-bar">
					<div ref="emojiPopoverRef" class="tool-group" aria-label="评论工具">
						<button
							type="button"
							class="tool-btn"
							:class="{ active: showOwo }"
							:aria-expanded="showOwo"
							aria-haspopup="dialog"
							title="表情"
							@click="toggleOwo"
						>
							<Icon name="ph:smiley-bold" />
						</button>
						<Transition name="owo-popover">
							<PostCommentOwoPicker v-if="showOwo" class="picker" @select="handleEmojiSelect" />
						</Transition>
					</div>

					<div class="editor-meta">
						<span v-if="hasDraft" class="draft-state">
							<Icon name="ph:floppy-disk-back-bold" />
							草稿已保存
						</span>
						<span class="counter" :class="{ warn: maxLength - contentLength < 80, over: maxLength - contentLength < 0 }">
							{{ contentLength }}/{{ maxLength }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<div class="action-row">
		<span v-if="errorMsg" class="err">{{ errorMsg }}</span>
		<button
			type="button"
			class="submit-btn primary"
			:disabled="submitting"
			@click="handleSubmit"
		>
			<Icon v-if="submitting" name="ph:circle-notch-bold" class="spin" />
			<Icon v-else name="ph:paper-plane-tilt-bold" />
			{{ submitText }}
		</button>
	</div>
</div>
</template>

<style lang="scss" scoped>
.comment-editor {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
	padding: 0;
	color: var(--font-color);
}

.reply-to {
	display: flex;
	align-items: center;
	gap: 0.45rem;
	padding: 0.55rem 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	background: var(--main-color-bg);
	font-size: 0.82rem;
	color: var(--font-color-2);

	.cancel-reply {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.65rem;
		height: 1.65rem;
		margin-left: auto;
		padding: 0;
		border-radius: var(--radius-sm);
		color: var(--font-color-3);

		&:hover {
			background: var(--card-bg);
			color: var(--main-color);
		}
	}
}

.composer-card {
	position: relative;
	overflow: visible;
	border-radius: var(--radius);
	box-shadow: 0 10px 28px rgb(15 23 42 / 4%);
	background: transparent;

	&::after {
		content: "";
		position: absolute;
		inset: 0;
		border: 1px solid color-mix(in srgb, var(--border-color) 90%, transparent);
		border-radius: inherit;
		pointer-events: none;
		z-index: 2;
	}
}

.editor-shell {
	background: transparent;
}

.editor-body {
	position: relative;
	min-height: 9.5rem;
}

.textarea {
	display: block;
	width: 100%;
	min-height: 9.5rem;
	padding: 1.05rem 1.1rem 3.9rem;
	border: 0;
	outline: 0;
	background: transparent;
	font-family: var(--font-family);
	font-size: 0.95rem;
	line-height: 1.75;
	color: var(--font-color);
	resize: vertical;

	&::placeholder {
		color: var(--font-color-3);
	}
}

.editor-inline-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.65rem;
	position: absolute;
	right: 0.85rem;
	bottom: 0.7rem;
	left: 0.85rem;
	min-height: 2.25rem;
	pointer-events: none;

	@media (max-width: 560px) {
		align-items: center;
	}
}

.tool-group {
	display: flex;
	align-items: center;
	gap: 0.18rem;
	position: relative;
	min-width: 0;
	pointer-events: auto;
}

.tool-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2.05rem;
	height: 2.05rem;
	padding: 0;
	border-radius: var(--radius);
	font-size: 1.05rem;
	color: var(--font-color-2);
	transition: background-color var(--transition-fast), color var(--transition-fast);

	&:hover,
	&.active {
		background: var(--main-color-bg);
		color: var(--main-color);
	}

	&:focus-visible {
		outline: 2px solid var(--main-color);
		outline-offset: 2px;
	}
}

.editor-meta {
	display: inline-flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.5rem;
	min-width: fit-content;
	margin-left: auto;
	pointer-events: auto;

	@media (max-width: 560px) {
		min-width: 0;
	}
}

.counter,
.draft-state {
	display: inline-flex;
	align-items: center;
	gap: 0.25rem;
	font-size: 0.76rem;
	color: var(--font-color-3);
}

.draft-state {
	padding: 0.18rem 0.46rem;
	border-radius: var(--radius-pill);
	background: color-mix(in srgb, var(--main-color-bg) 70%, transparent);
	color: var(--font-color-2);
}

.counter {
	font-family: var(--font-monospace);
	font-variant-numeric: tabular-nums;

	&.warn {
		color: var(--warning, #F59E0B);
	}

	&.over {
		color: var(--error, #EF4444);
	}
}

.picker {
	position: absolute;
	top: calc(100% + 0.55rem);
	left: -0.1rem;
	width: min(24rem, calc(100vw - 2rem));
	max-width: calc(100vw - 2rem);
	z-index: var(--z-dropdown, 30);
}

.owo-popover-enter-active,
.owo-popover-leave-active {
	transition: opacity var(--transition-fast);
}

.owo-popover-enter-from,
.owo-popover-leave-to {
	opacity: 0;
}

.identity-row {
	display: grid;
	grid-template-columns: 0.8fr 1.1fr 1fr;
	gap: 0.7rem;
	padding: 0.85rem;
	border-bottom: 1px solid color-mix(in srgb, var(--border-color) 82%, transparent);
	background: transparent;

	@media (max-width: 860px) {
		grid-template-columns: 1fr;
	}
}

.identity-field {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr);
	align-items: center;
	gap: 0.55rem;
	min-width: 0;
	min-height: 2.5rem;
	padding: 0.28rem 0.42rem 0.28rem 0.72rem;
	border: 1px solid color-mix(in srgb, var(--border-color) 86%, transparent);
	border-radius: var(--radius);
	background: color-mix(in srgb, var(--card-bg) 98%, var(--font-color) 2%);
	transition: border-color var(--transition-fast), box-shadow var(--transition-fast), background-color var(--transition-fast);

	&:focus-within {
		border-color: color-mix(in srgb, var(--main-color) 65%, var(--border-color));
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--main-color-bg) 70%, transparent);
		background: var(--card-bg);
	}
}

.identity-label {
	padding-right: 0.55rem;
	border-right: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
	font-size: 0.76rem;
	font-weight: 800;
	line-height: 1.2;
	white-space: nowrap;
	color: var(--font-color-3);
}

.input {
	width: 100%;
	min-width: 0;
	min-height: 1.95rem;
	padding: 0.28rem 0.3rem;
	border: 0;
	border-radius: 0;
	outline: 0;
	background: transparent;
	font-size: 0.88rem;
	line-height: 1.3;
	color: var(--font-color);

	&::placeholder {
		color: color-mix(in srgb, var(--font-color-3) 78%, transparent);
	}
}

.action-row {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 0.75rem;

	@media (max-width: 760px) {
		flex-direction: column;
		align-items: flex-end;
	}
}

.submit-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.42rem;
	min-height: 2.5rem;
	padding: 0.62rem 1.05rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius-md);
	font-size: 0.86rem;
	font-weight: 700;
	line-height: 1.1;
	white-space: nowrap;
	transition: border-color var(--transition-fast), box-shadow var(--transition-fast), color var(--transition-fast), background-color var(--transition-fast), opacity var(--transition-fast);

	&.primary {
		border-color: var(--main-color);
		box-shadow: 0 8px 18px color-mix(in srgb, var(--main-color) 26%, transparent);
		background: var(--main-color);
		color: #FFF;
	}

	&:hover:not(:disabled) {
		border-color: var(--main-color);
		box-shadow: 0 6px 16px rgb(15 23 42 / 6%);
		color: var(--main-color);
	}

	&.primary:hover:not(:disabled) {
		box-shadow: 0 10px 22px color-mix(in srgb, var(--main-color) 30%, transparent);
		background: var(--main-color-hover, var(--main-color));
		color: #FFF;
	}

	&:disabled {
		opacity: 0.56;
		cursor: not-allowed;
	}

	&:focus-visible {
		outline: 2px solid var(--main-color);
		outline-offset: 2px;
	}

	@media (max-width: 520px) {
		width: 100%;
		white-space: normal;
	}
}

.err {
	margin-right: auto;
	font-size: 0.8rem;
	color: var(--error, #EF4444);

	@media (max-width: 760px) {
		align-self: stretch;
		margin-right: 0;
	}
}

.spin {
	animation: comment-editor-spin 1s linear infinite;
}

@keyframes comment-editor-spin {
	to { transform: rotate(360deg); }
}
</style>
