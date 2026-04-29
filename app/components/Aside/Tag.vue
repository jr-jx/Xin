<script setup lang="ts">
const { tags } = useSiteStats()
</script>

<template>
<Widget title="标签" card icon="icon-park-solid:tag">
	<UTags :tags="tags" />
</Widget>
</template>
