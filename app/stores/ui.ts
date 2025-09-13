import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
	const selectedCategory = ref('全部')
	const currentPage = ref(1)

	function setCategory(name: string) {
		selectedCategory.value = name
		currentPage.value = 1
	}

	function setPage(page: number) {
		currentPage.value = page
	}

	return {
		selectedCategory,
		currentPage,
		setCategory,
		setPage,
	}
})
