<script setup lang="ts">
const appConfig = useAppConfig()
const colorMode = useColorMode()
</script>

<template>
<div class="theme-toggle">
	<button
		v-for="(themeData, themeName) in appConfig.themes"
		:key="themeName"
		v-tip="themeData.tip"
		:aria-label="themeData.tip"
		:class="{ active: colorMode.preference === themeName }"
		@click="colorMode.preference = themeName"
	>
		<Icon :name="themeData.icon" />
	</button>
</div>
</template>

<style lang="scss" scoped>
.theme-toggle {
	display: flex;
	justify-content: center;
	gap: 3px;
	width: fit-content;
	padding: 2px;
	border: 1px solid var(--border);
	border-radius: 1rem;
	background-color: var(--card-bg);

	> button {
		padding: 4px 1rem;
		border-radius: 1rem;
		transition: all 0.1s;

		&:hover {
			background-color: var(--card-bg-soft);
			color: var(--font-color-2);
		}

		&.active {
			box-shadow: 0.1em 0.2em 0.5rem var(--shadow);
			background-color: var(--main-color-bg);
			color: var(--font-color-2);
			cursor: auto;
		}
	}
}
</style>
