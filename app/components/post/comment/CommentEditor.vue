<script setup lang="ts">
import blogConfig from '~~/blog.config'

interface Props {
	submitting?: boolean
	replyTo?: { id: string, nick: string } | null
	compact?: boolean
}

withDefaults(defineProps<Props>(), {
	submitting: false,
	replyTo: null,
	compact: false,
})

const emit = defineEmits<{
	(e: 'submit', payload: { nick: string, mail: string, link: string, content: string }): void
	(e: 'cancel'): void
	(e: 'mailChange', value: string): void
}>()

const STORAGE_KEY = 'xin_comment_profile'

const nick = ref('')
const mail = ref('')
const link = ref('')
const content = ref('')
const preview = ref(false)
const errorMsg = ref<string | null>(null)

onMounted(() => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) {
			const p = JSON.parse(raw)
			nick.value = p.nick || ''
			mail.value = p.mail || ''
			link.value = p.link || ''
			if (mail.value)
				emit('mailChange', mail.value)
		}
	}
	catch {}
})

watch(mail, (v) => {
	emit('mailChange', v)
})

const maxLength = blogConfig.comment.maxLength
const remaining = computed(() => maxLength - content.value.length)

const previewHtml = computed(() => renderPreview(content.value))

function renderPreview(src: string): string {
	// 极简预览：仅换行、基础 inline markdown
	const escape = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c] as string))
	return escape(src)
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\n/g, '<br>')
}

function persistProfile() {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			nick: nick.value,
			mail: mail.value,
			link: link.value,
		}))
	}
	catch {}
}

async function handleSubmit() {
	errorMsg.value = null
	if (!nick.value.trim()) {
		errorMsg.value = '请填写昵称'
		return
	}
	if (!content.value.trim()) {
		errorMsg.value = '请填写评论内容'
		return
	}
	if (content.value.length > maxLength) {
		errorMsg.value = `评论不能超过 ${maxLength} 字`
		return
	}
	persistProfile()
	emit('submit', {
		nick: nick.value.trim(),
		mail: mail.value.trim(),
		link: link.value.trim(),
		content: content.value,
	})
}

function clearAfterSubmit() {
	content.value = ''
	preview.value = false
}

defineExpose({ clearAfterSubmit })

// 插入 OWO 表情
function insertEmoji(token: string) {
	content.value += token
}

const showOwo = ref(false)
</script>

<template>
<div class="comment-editor" :class="{ compact }">
	<div v-if="replyTo" class="reply-to">
		<Icon name="ph:arrow-bend-up-left-bold" />
		正在回复 <b>@{{ replyTo.nick }}</b>
		<button type="button" class="cancel-reply" @click="emit('cancel')">
			取消
		</button>
	</div>

	<div class="fields">
		<input v-model="nick" type="text" placeholder="昵称 *" maxlength="40" class="input">
		<input v-model="mail" type="email" placeholder="邮箱（可选，用于头像与回复通知）" maxlength="120" class="input">
		<input v-model="link" type="url" placeholder="网址（可选）" maxlength="200" class="input">
	</div>

	<div class="editor-body">
		<textarea
			v-if="!preview"
			v-model="content"
			class="textarea"
			:placeholder="replyTo ? `回复 @${replyTo.nick}…（支持 Markdown）` : '说点什么吧…（支持 Markdown）'"
			:maxlength="maxLength"
			rows="4"
		/>
		<div v-else class="preview prose" v-html="previewHtml" />
	</div>

	<div class="toolbar">
		<div class="toolbar-left">
			<button type="button" class="tool-btn" title="表情" @click="showOwo = !showOwo">
				<Icon name="ph:smiley" />
			</button>
			<button type="button" class="tool-btn" :class="{ active: preview }" title="预览" @click="preview = !preview">
				<Icon name="ph:eye" />
			</button>
			<span class="counter" :class="{ warn: remaining < 50, over: remaining < 0 }">{{ remaining }}</span>
		</div>
		<div class="toolbar-right">
			<span v-if="errorMsg" class="err">{{ errorMsg }}</span>
			<button
				type="button"
				class="submit-btn"
				:disabled="submitting"
				@click="handleSubmit"
			>
				<Icon v-if="submitting" name="ph:circle-notch-bold" class="spin" />
				{{ submitting ? '提交中…' : '发表评论' }}
			</button>
		</div>
	</div>

	<PostCommentOwoPicker v-if="showOwo" @select="insertEmoji" />
</div>
</template>

<style lang="scss" scoped>
.comment-editor {
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	padding: 1rem;
	border: var(--border);
	border-radius: var(--radius-md);
	background: var(--card-bg);
	transition: border-color 0.2s, box-shadow 0.2s;

	&:focus-within {
		border-color: var(--main-color);
		box-shadow: 0 4px 16px -8px rgb(0 0 0 / 15%);
	}
}

.reply-to {
	display: flex;
	align-items: center;
	gap: 0.4rem;
	font-size: 0.8rem;
	color: var(--font-color-2);

	.cancel-reply {
		margin-left: auto;
		padding: 0.1rem 0.4rem;
		border: none;
		border-radius: var(--radius-sm);
		background: transparent;
		font-size: 0.75rem;
		color: var(--font-color-3);
		cursor: pointer;

		&:hover { color: var(--main-color); }
	}
}

.fields {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 0.5rem;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

.input {
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	outline: none;
	background: var(--c-bg);
	font-size: 0.85rem;
	color: var(--font-color);
	transition: border-color 0.15s;

	&:focus { border-color: var(--main-color); }
}

.editor-body {
	position: relative;
}

.textarea {
	width: 100%;
	min-height: 6rem;
	padding: 0.75rem;
	border: 1px solid var(--border-color);
	border-radius: var(--radius);
	outline: none;
	background: var(--c-bg);
	font-family: var(--font-monospace, inherit);
	font-size: 0.9rem;
	line-height: 1.6;
	color: var(--font-color);
	transition: border-color 0.15s;
	resize: vertical;

	&:focus { border-color: var(--main-color); }
}

.preview {
	min-height: 6rem;
	padding: 0.75rem;
	border: 1px dashed var(--border-color);
	border-radius: var(--radius);
	background: var(--c-bg-2);
	font-size: 0.9rem;
	line-height: 1.6;
	color: var(--font-color);
}

.toolbar {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.toolbar-left,
.toolbar-right {
	display: flex;
	align-items: center;
	gap: 0.5rem;
}

.toolbar-right {
	margin-left: auto;
}

.tool-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	padding: 0;
	border: 1px solid transparent;
	border-radius: var(--radius-sm);
	background: transparent;
	color: var(--font-color-2);
	transition: all 0.15s;
	cursor: pointer;

	&:hover,
	&.active {
		border-color: var(--border-color);
		background: var(--c-bg-2);
		color: var(--main-color);
	}
}

.counter {
	font-size: 0.75rem;
	color: var(--font-color-3);

	&.warn { color: var(--warning-color, orange); }
	&.over { color: var(--error-color, red); }
}

.err {
	font-size: 0.8rem;
	color: var(--error-color, #EF4444);
}

.submit-btn {
	display: inline-flex;
	align-items: center;
	gap: 0.4rem;
	padding: 0.5rem 1rem;
	border: none;
	border-radius: var(--radius);
	background: var(--main-color);
	font-size: 0.85rem;
	color: #FFF;
	transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
	cursor: pointer;

	&:hover:not(:disabled) {
		box-shadow: 0 6px 14px -6px color-mix(in srgb, var(--main-color) 60%, transparent);
		transform: translateY(-1px);
	}

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spin {
		animation: spin 1s linear infinite;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
