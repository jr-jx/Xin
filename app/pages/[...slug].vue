<script lang="ts" setup>
const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
	return queryCollection('page').path(route.path).first()
})

const { updateTitleFromContent } = usePageTitle()

// 监听page数据变化，动态更新title
watchEffect(() => {
	if (page.value) {
		updateTitleFromContent(page.value)
	}
})

// 初始设置
if (page.value) {
	updateTitleFromContent(page.value)
}
</script>

<template>
<ContentRenderer v-if="page" :value="page" />
</template>
