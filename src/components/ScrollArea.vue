<style scoped>
.scroll-area {
  /* Firefox：thin 滚动条 + 颜色 */
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.2s ease;
}

.scroll-area:hover,
.scroll-area--always {
  scrollbar-color: rgba(244, 244, 245, 0.25) transparent;
}

/* WebKit/Blink */
.scroll-area::-webkit-scrollbar {
  width: var(--scroll-size, 6px);
  height: var(--scroll-size, 6px);
  background: transparent;
}

.scroll-area::-webkit-scrollbar-track {
  background: transparent;
  border: none;
}

.scroll-area::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: background-color 0.2s ease;
}

.scroll-area:hover::-webkit-scrollbar-thumb,
.scroll-area--always::-webkit-scrollbar-thumb {
  background-color: rgba(244, 244, 245, 0.25);
}

.scroll-area::-webkit-scrollbar-thumb:hover {
  background-color: rgba(244, 244, 245, 0.8);
}

.scroll-area::-webkit-scrollbar-thumb:active {
  background-color: rgba(244, 244, 245, 0.9);
}

.scroll-area::-webkit-scrollbar-corner {
  background: transparent;
}
</style>

<template>
  <div
    class="scroll-area"
    :class="[
      direction === 'vertical' ? 'overflow-y-auto overflow-x-hidden' : '',
      direction === 'horizontal' ? 'overflow-x-auto overflow-y-hidden' : '',
      direction === 'both' ? 'overflow-auto' : '',
      always ? 'scroll-area--always' : ''
    ]"
    :style="{ '--scroll-size': size }"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 滚动方向 */
    direction?: 'vertical' | 'horizontal' | 'both'
    /** 是否始终显示滚动条（关闭悬停才显示的效果） */
    always?: boolean
    /** 滚动条粗细，默认 6px */
    size?: string
  }>(),
  {
    direction: 'vertical',
    always: false,
    size: '6px'
  }
)
</script>
