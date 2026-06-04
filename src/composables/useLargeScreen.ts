export const LARGE_SCREEN_MIN_WIDTH = 1024

export function isLargeScreenViewport(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia(`(min-width: ${LARGE_SCREEN_MIN_WIDTH}px)`).matches
}

export function useLargeScreen() {
  const isLargeScreen = ref(isLargeScreenViewport())

  function syncViewport(): void {
    isLargeScreen.value = isLargeScreenViewport()
  }

  onMounted(() => {
    syncViewport()
    window.addEventListener('resize', syncViewport)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', syncViewport)
  })

  return {
    isLargeScreen,
    syncViewport
  }
}
