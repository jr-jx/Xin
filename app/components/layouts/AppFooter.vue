<script setup lang="ts">
defineOptions({ name: 'AppFooter' })
</script>

<template>
<footer class="footer">
	<div class="footer-container">
		<div class="footer-content">
			<span class="footer-text">© 2025 伍拾柒</span>
		</div>
	</div>
</footer>
</template>

<style lang="scss" scoped>
.footer {
	border-top: var(--border);
	background-color: var(--card-bg);
	transition: all 0.3s ease;
}

.footer-container {
	max-width: 1250px;
	margin: 0 auto;
	padding: 0 1rem;
}

.footer-content {
	display: grid;
	grid-template-columns: 1fr auto 1fr;
	align-items: center;
	height: 4rem;
}

.footer-text {
	font-size: 0.875rem;
	color: var(--font-color-2);
}
</style>
