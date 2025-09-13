<script setup lang="ts">
const props = defineProps<{
	href: string
	icon?: string
}>()

const icon = computed(() => props.icon || getDomainIcon(props.href))
const tip = computed(() => ({
	content: isExtLink(props.href) ? getDomain(props.href) : decodeURIComponent(props.href),
	inlinePositioning: true,
}))
</script>

<template>
<NuxtLink v-tip="tip" class="link" :href="href" :target="isExtLink(href) ? '_blank' : '_self'">
	<Icon v-if="icon" class="domain-icon" :name="icon" />
	<slot />
</NuxtLink>
</template>

<style lang="scss" scoped>
.link {
	margin: -0.1em -0.2em;
	padding: 0.1em 0.2em;
	background: linear-gradient(var(--main-color-bg), var(--main-color-bg)) no-repeat center bottom / 100% 0.1em;
	color: var(--main-color);
	transition: all 0.2s;

	&:hover {
		border-radius: 0.3em;
		background-size: 100% 100%;
	}

	.domain-icon {
		margin-right: 0.1em;
	}
}
</style>
