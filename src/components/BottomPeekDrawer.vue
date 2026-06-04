<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    peekHeight?: number
  }>(),
  {
    modelValue: false,
    peekHeight: 56
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const expanded = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function close(): void {
  expanded.value = false
}

function toggle(): void {
  expanded.value = !expanded.value
}

function onPeekClick(): void {
  if (!expanded.value) {
    expanded.value = true
  }
}

watch(expanded, (isOpen) => {
  if (typeof document === 'undefined') {
    return
  }
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches
  if (isDesktop) {
    document.body.style.overflow = ''
    return
  }
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      leave-active-class="transition-opacity duration-200 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <button
        v-if="expanded"
        type="button"
        class="fixed inset-0 z-40 bg-black/50 lg:hidden"
        aria-label="关闭播放面板"
        @click="close"
      />
    </Transition>

    <div
      class="fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-out lg:hidden"
      :style="{
        transform: expanded
          ? 'translateY(0)'
          : `translateY(calc(100% - ${peekHeight}px))`,
      }"
      @click="onPeekClick"
    >
      <div
        class="border border-zinc-800 rounded-t-2xl bg-zinc-900/95 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm"
      >
        <button
          type="button"
          class="w-full flex flex-col items-center px-4 pt-2 pb-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          :aria-expanded="expanded"
          aria-label="展开或收起播放面板"
          @click.stop="toggle"
        >
          <span class="h-1 w-10 rounded-full bg-zinc-600" />
        </button>

        <div
          class="max-h-[min(70vh,520px)] overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          @click.stop
        >
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
