<script setup lang="ts">
const scroll = ref(false)
</script>

<template>
<div class="md-table">
	<div class="operations">
		<button @click="scroll = !scroll">
			<Icon :name="scroll ? 'ph:arrow-u-down-left-bold' : 'ph:arrows-out-line-horizontal-bold'" />
			<span class="tooltip">{{ scroll ? '自动换行' : '横向滚动' }}</span>
		</button>
	</div>
	<table class="scrollcheck-x" :class="{ scroll }">
		<slot />
	</table>
</div>
</template>

<style lang="scss" scoped>
.md-table {
	position: relative;
	overflow-wrap: break-word;
	margin: 2rem 0;
	font-size: 0.875rem;
	line-height: 1.5;

	&:hover .operations {
		opacity: 1;
	}

	table.scroll {
		display: block;
		overflow-x: auto;
		white-space: nowrap;
		word-break: normal;
	}
}

.operations {
	position: absolute;
	opacity: 0;
	top: 0.5rem;
	right: 0.5rem;
	transition: opacity 0.2s ease;
	z-index: 10;

	button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		border: var(--border);
		border-radius: 4px;
		background: var(--c-bg-1);
		font-size: 0.75rem;
		color: var(--font-color-2);
		transition: all 0.15s ease;
		cursor: pointer;

		&:hover {
			border-color: var(--main-color);
			color: var(--font-color);
		}
	}

	.tooltip {
		display: none;
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.25rem;
		padding: 0.25rem 0.5rem;
		border: var(--border);
		border-radius: 3px;
		background: var(--c-bg-3);
		font-size: 0.7rem;
		white-space: nowrap;
		color: var(--font-color-2);
	}

	button:hover + .tooltip {
		display: block;
	}
}

:deep(table) {
	overflow: hidden;
	width: 100%;
	border: var(--border);
	border-collapse: collapse;
	border-radius: 6px;
	box-shadow: var(--shadow-sm);
	background: var(--c-bg-1);

	thead {
		position: sticky;
		top: 0;
		z-index: 5;

		th {
			position: relative;
			padding: 0.75rem 1rem;
			border: var(--border);
			background: var(--c-bg-2);
			font-size: 0.8rem;
			font-weight: 600;
			letter-spacing: 0.5px;
			text-align: center;
			text-transform: uppercase;
			color: var(--font-color);

			&:not(:last-child)::after {
				content: "";
				position: absolute;
				top: 20%;
				right: 0;
				bottom: 20%;
				width: 1px;
				background: var(--border);
			}
		}
	}

	tbody {
		tr {
			border: var(--border);
			transition: background-color 0.15s ease;

			&:hover {
				background: var(--c-bg-2);
			}

			&:last-child {
				border-bottom: none;
			}
		}

		td {
			position: relative;
			padding: 0.75rem 1rem;
			border: var(--border);
			vertical-align: top;
			text-align: center;
			color: var(--font-color-2);

			&:not(:last-child)::after {
				content: "";
				position: absolute;
				top: 20%;
				right: 0;
				bottom: 20%;
				width: 1px;
				background: var(--border);
			}
		}
	}
}

/* 响应式设计 */
@media (max-width: 768px) {
	.md-table {
		margin: 1rem 0;
		font-size: 0.8rem;
	}

	:deep(table) {
		thead th,
		tbody td {
			padding: 0.5rem 0.75rem;
		}
	}

	.operations {
		top: 0.25rem;
		right: 0.25rem;

		button {
			padding: 0.25rem 0.375rem;
			font-size: 0.7rem;
		}
	}
}
</style>
