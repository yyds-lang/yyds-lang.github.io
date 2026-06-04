<script setup lang="ts">
import { isLargeScreenViewport } from '../composables/useLargeScreen'

const props = defineProps<{
  modelValue?: boolean
  title?: string
  mobileOnly?: boolean
}>()

const panelClass = computed(() => (
  props.mobileOnly ? 'lg:hidden' : ''
))

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue ?? false,
  set: (value: boolean) => emit('update:modelValue', value)
})

function close(): void {
  open.value = false
}

watch(open, (isOpen) => {
  if (typeof document === 'undefined') {
    return
  }
  const isDesktop = isLargeScreenViewport()
  if (props.mobileOnly && isDesktop) {
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
        v-if="open"
        type="button"
        class="fixed inset-0 z-[60] bg-black/50"
        :class="panelClass"
        aria-label="关闭菜单"
        @click="close"
      />
    </Transition>

    <div
      class="fixed inset-y-0 right-0 z-[70] w-[min(280px,85vw)] transition-transform duration-300 ease-out"
      :class="[open ? 'translate-x-0' : 'translate-x-full', panelClass]"
      role="dialog"
      aria-modal="true"
      :aria-hidden="!open"
    >
      <div
        class="h-full flex flex-col border-l border-zinc-800 bg-zinc-900/98 shadow-2xl backdrop-blur-sm"
      >
        <div class="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <p class="text-sm text-zinc-100 font-semibold">
            {{ title ?? '菜单' }}
          </p>
          <button
            type="button"
            class="h-8 w-8 inline-flex items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="关闭菜单"
            @click="close"
          >
            <span class="i-lucide-x h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <nav class="flex flex-col gap-1 p-3" @click="close">
          <slot />
        </nav>
      </div>
    </div>
  </Teleport>
</template>
