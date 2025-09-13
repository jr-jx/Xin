<script setup lang="ts">
import AppFooter from '~/components/layouts/AppFooter.vue'
import AppFooterGroup from '~/components/layouts/AppFooterGroup.vue'
import AppHeader from '~/components/layouts/AppHeader.vue'
import Console from '~/components/layouts/Console.vue'
</script>

<template>
<div>
	<Console />
	<AppHeader />
	<div class="container">
		<slot />
	</div>
	<AppFooterGroup />
	<AppFooter />
</div>
</template>

<style lang="scss" scoped>
.container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	min-height: 100vh;
	max-width: 1250px;
	margin: 0 auto;
}
</style>
