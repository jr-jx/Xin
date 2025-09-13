<script setup lang="ts">
const { tags } = useSiteStats()
</script>

<template>
<Widget title="标签" icon="icon-park-solid:tag">
	<UTags :tags="tags" card />
</Widget>
</template>
