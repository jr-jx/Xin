export const useConsoleStore = defineStore('console', () => {
	const showConsole = ref(false)

	return {
		showConsole,
	}
})
